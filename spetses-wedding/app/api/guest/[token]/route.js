import { db, isConfigured, rowToRsvp, rowToNews, rowToPhoto } from "@/lib/db";

export const dynamic = "force-dynamic";

// Espace invité : le jeton du foyer fait office d'identifiant.
// Un invité ne peut lire et écrire que les données de SON foyer.

async function loadHousehold(token) {
  const { data } = await db
    .from("wedding_households")
    .select("id, token, name, email, phone, lang, is_shared")
    .eq("token", token)
    .maybeSingle();
  return data;
}

// Jeton court et lisible, sans caractères qu'on confond à l'oral.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
async function makeToken() {
  for (let i = 0; i < 20; i++) {
    const token = Array.from({ length: 6 }, () =>
      ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
    ).join("");
    const { data } = await db.from("wedding_households").select("id").eq("token", token).maybeSingle();
    if (!data) return token;
  }
  throw new Error("token_generation_failed");
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

  // Sur le lien partagé, on ne montre jamais de réponse : il sert à tous.
  return Response.json({
    household: {
      token: household.token,
      name: household.is_shared ? "" : household.name,
      email: household.is_shared ? "" : household.email,
      phone: household.is_shared ? "" : household.phone,
      lang: household.lang,
      shared: Boolean(household.is_shared),
    },
    rsvp: household.is_shared ? null : hasReplied ? rowToRsvp(rsvp, participantsRes.data) : null,
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

  const body = await request.json();

  if (!["yes", "probably", "unsure", "no"].includes(body.attending)) {
    return Response.json({ error: "invalid_attending" }, { status: 400 });
  }

  const clean = (v) => (typeof v === "string" ? v.trim() : "");
  const count = (v) => {
    if (v === "" || v == null) return null;
    const n = Number(v);
    return Number.isInteger(n) && n >= 0 && n <= 50 ? n : null;
  };

  const familyName = clean(body.householdName).slice(0, 120);
  const coming = body.attending !== "no";
  const people = coming && Array.isArray(body.participants) ? body.participants.slice(0, 60) : [];

  // Le premier adulte de la liste est la personne qui répond : son email et
  // son téléphone servent de contact du foyer, pour les relances et l'export.
  const lead = people.find((p) => p.type !== "child") || {};
  const leadEmail = clean(lead.email).toLowerCase();
  const leadPhone = clean(lead.phone);

  // Sur le lien partagé, répondre ne modifie pas la ligne du lien : cela
  // crée le foyer de la personne, ou retrouve le sien si elle revient avec
  // la même adresse. C'est ainsi qu'un invité entre dans la base.
  let target = household;
  let createdToken = null;

  if (household.is_shared) {
    if (!familyName) return Response.json({ error: "family_name_required" }, { status: 400 });

    const existing = leadEmail
      ? (await db
          .from("wedding_households")
          .select("id, token, name")
          .eq("email", leadEmail)
          .eq("is_shared", false)
          .maybeSingle()).data
      : null;

    if (existing) {
      target = existing;
      createdToken = existing.token;
      await db.from("wedding_households")
        .update({ name: familyName, phone: leadPhone || null, lang: body.lang || "fr" })
        .eq("id", existing.id);
    } else {
      const fresh = await makeToken();
      const { data, error } = await db
        .from("wedding_households")
        .insert({
          token: fresh,
          name: familyName,
          email: leadEmail || null,
          phone: leadPhone || null,
          lang: ["fr", "en", "el"].includes(body.lang) ? body.lang : "fr",
          source: "shared",
        })
        .select("id, token")
        .single();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      target = data;
      createdToken = data.token;
    }
  } else if (familyName && familyName !== household.name) {
    // Depuis un lien personnel, le foyer corrige simplement son nom. Vide,
    // on garde celui du carnet : on n'efface pas un nom par mégarde.
    await db.from("wedding_households").update({ name: familyName }).eq("id", household.id);
  }

  const { error: rsvpError } = await db.from("wedding_rsvps").upsert(
    {
      household_id: target.id,
      attending: body.attending,
      adults: coming ? count(body.adults) : null,
      children: coming ? count(body.children) : null,
      email: leadEmail || null,
      phone: leadPhone || null,
      arrival: coming ? body.arrival || null : null,
      departure: coming ? body.departure || null : null,
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "household_id" }
  );
  if (rsvpError) return Response.json({ error: rsvpError.message }, { status: 500 });

  // Les personnes sont remplacées en bloc : c'est la façon la plus simple de
  // refléter des ajouts, des retraits et des réordonnancements. Une personne
  // encore sans nom est conservée : l'effectif annoncé reste visible, et le
  // foyer retrouvera sa ligne pour la compléter plus tard.
  await db.from("wedding_participants").delete().eq("household_id", target.id);

  const rows = people.map((p, i) => {
    const first = clean(p.firstName);
    const last = clean(p.lastName);
    const child = p.type === "child";
    const age = Number(p.age);
    return {
      household_id: target.id,
      position: i,
      first_name: first,
      last_name: last,
      name: [first, last].filter(Boolean).join(" "),   // pratique pour les exports
      type: child ? "child" : "adult",
      email: child ? null : clean(p.email).toLowerCase() || null,
      phone: child ? null : clean(p.phone) || null,
      age: child && p.age !== "" && Number.isInteger(age) && age >= 0 && age < 18 ? age : null,
      events: p.events || {},
    };
  });

  if (rows.length) {
    const { error } = await db.from("wedding_participants").insert(rows);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }

  // Le jeton n'est renvoyé que pour une réponse venue du lien partagé :
  // c'est l'adresse personnelle qui permettra de revenir modifier.
  return Response.json({ ok: true, token: createdToken });
}
