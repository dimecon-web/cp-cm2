import { db, isConfigured, rowToRsvp, rowToNews, rowToPhoto } from "@/lib/db";

export const dynamic = "force-dynamic";

// Espace invité : le jeton du foyer fait office d'identifiant.
// Un invité ne peut lire et écrire que les données de SON foyer.

async function loadHousehold(token) {
  const { data } = await db
    .from("wedding_households")
    .select("id, token, name, email, phone, lang")
    .eq("token", token)
    .maybeSingle();
  return data;
}

export async function GET(request, { params }) {
  if (!isConfigured) return Response.json({ error: "not_configured" }, { status: 503 });
  const { token } = await params;

  const household = await loadHousehold(token);
  if (!household) return Response.json({ error: "unknown_token" }, { status: 404 });

  const [rsvpRes, participantsRes, newsRes, photosRes] = await Promise.all([
    db.from("wedding_rsvps").select("*").eq("household_id", household.id).maybeSingle(),
    db.from("wedding_participants").select("*").eq("household_id", household.id),
    db.from("wedding_news").select("*").order("published_at", { ascending: false }),
    db.from("wedding_photos").select("*").eq("approved", true).order("created_at", { ascending: false }),
  ]);

  const rsvp = rsvpRes.data;
  const attending = rsvp?.attending;
  const hasReplied = Boolean(rsvp) || Boolean(participantsRes.data?.length);

  return Response.json({
    household: { token: household.token, name: household.name, email: household.email, phone: household.phone, lang: household.lang },
    rsvp: hasReplied ? rowToRsvp(rsvp, participantsRes.data) : null,
    // Les actualités réservées aux « oui » ne sortent pas du serveur pour les autres.
    news: (newsRes.data || []).filter((n) => n.audience !== "yes" || attending === "yes").map(rowToNews),
    photos: (photosRes.data || []).map((p) => rowToPhoto(p)),
  });
}

export async function POST(request, { params }) {
  if (!isConfigured) return Response.json({ error: "not_configured" }, { status: 503 });
  const { token } = await params;

  const household = await loadHousehold(token);
  if (!household) return Response.json({ error: "unknown_token" }, { status: 404 });

  const rsvp = await request.json();

  // ---------- Premier questionnaire, envoyé avec le save the date ----------
  // Il ne touche ni `attending` ni la liste nominative : une intention n'est
  // pas une réponse ferme, et on ne veut pas effacer ce qui a déjà été dit.
  if (rsvp.stage === "saveDate") {
    if (!["yes", "probably", "unsure", "no"].includes(rsvp.intent)) {
      return Response.json({ error: "invalid_intent" }, { status: 400 });
    }
    const count = (v) => {
      if (v === "" || v == null) return null;
      const n = Number(v);
      return Number.isInteger(n) && n >= 0 && n <= 50 ? n : null;
    };
    const clean = (s) => (typeof s === "string" ? s.trim() : "");
    const nAdults = count(rsvp.adults);
    const nChildren = count(rsvp.children);

    // Chaque adulte porte ses propres coordonnées. Le premier de la liste est
    // la personne qui répond : c'est son contact qui sert au foyer, pour les
    // relances et les exports, afin que les deux ne puissent pas diverger.
    const adultNames = (Array.isArray(rsvp.adultNames) ? rsvp.adultNames : [])
      .slice(0, Math.max(1, nAdults || 1))
      .map((a) => ({
        first: clean(a?.first),
        last: clean(a?.last),
        email: clean(a?.email).toLowerCase(),
        phone: clean(a?.phone),
      }));
    const lead = adultNames[0] || { first: "", last: "", email: "", phone: "" };

    const childNames = (Array.isArray(rsvp.childNames) ? rsvp.childNames : [])
      .slice(0, nChildren || 0)
      .map((c) => {
        const age = Number(c?.age);
        return {
          first: clean(c?.first),
          last: clean(c?.last),
          age: Number.isInteger(age) && age >= 0 && age < 18 ? age : null,
        };
      });

    const coming = rsvp.intent !== "no";

    const { error } = await db.from("wedding_rsvps").upsert(
      {
        household_id: household.id,
        intent: rsvp.intent,
        respondent_first_name: lead.first || null,
        respondent_last_name: lead.last || null,
        adults: nAdults,
        children: nChildren,
        adult_names: coming ? adultNames : null,
        child_names: coming ? childNames : null,
        email: lead.email || null,
        phone: lead.phone || null,
        arrival: rsvp.arrival || null,
        departure: rsvp.departure || null,
        notes: rsvp.notes || null,
        intent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "household_id" }
    );
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (!["yes", "no"].includes(rsvp.attending)) {
    return Response.json({ error: "invalid_attending" }, { status: 400 });
  }

  const { error: rsvpError } = await db.from("wedding_rsvps").upsert(
    {
      household_id: household.id,
      attending: rsvp.attending,
      email: rsvp.email || null,
      phone: rsvp.phone || null,
      arrival: rsvp.arrival || null,
      departure: rsvp.departure || null,
      notes: rsvp.notes || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "household_id" }
  );
  if (rsvpError) return Response.json({ error: rsvpError.message }, { status: 500 });

  // Les participants sont remplacés en bloc : c'est la façon la plus simple
  // de refléter des ajouts, des retraits et des réordonnancements.
  await db.from("wedding_participants").delete().eq("household_id", household.id);

  const participants = rsvp.attending === "yes" ? rsvp.participants || [] : [];
  const rows = participants
    .filter((p) => (p.firstName || "").trim() || (p.lastName || "").trim())
    .map((p, i) => {
      const first = (p.firstName || "").trim();
      const last = (p.lastName || "").trim();
      return {
        household_id: household.id,
        position: i,
        first_name: first,
        last_name: last,
        name: [first, last].filter(Boolean).join(" "),   // pratique pour les exports
        type: p.type === "child" ? "child" : "adult",
        age: p.type === "child" && p.age !== "" ? Number(p.age) : null,
        events: p.events || {},
      };
    });

  if (rows.length) {
    const { error } = await db.from("wedding_participants").insert(rows);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
