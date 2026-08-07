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
  if (!["yes", "no"].includes(rsvp.attending)) {
    return Response.json({ error: "invalid_attending" }, { status: 400 });
  }

  const { error: rsvpError } = await db.from("wedding_rsvps").upsert(
    {
      household_id: household.id,
      attending: rsvp.attending,
      email: rsvp.email || null,
      arrival: rsvp.arrival || null,
      departure: rsvp.departure || null,
      transport: rsvp.transport || null,
      accommodation: rsvp.accommodation || null,
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
    .filter((p) => p.name?.trim())
    .map((p, i) => ({
      household_id: household.id,
      position: i,
      name: p.name.trim(),
      type: p.type === "child" ? "child" : "adult",
      age: p.type === "child" && p.age !== "" ? Number(p.age) : null,
      diet: ["none", "veg", "allergy"].includes(p.diet) ? p.diet : "none",
      diet_note: p.diet === "allergy" ? p.dietNote || null : null,
      events: p.events || {},
    }));

  if (rows.length) {
    const { error } = await db.from("wedding_participants").insert(rows);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
