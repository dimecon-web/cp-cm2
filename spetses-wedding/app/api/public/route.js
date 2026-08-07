import { db, isConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

// Écritures ouvertes aux invités : message de contact et envoi de photo.
// Les photos n'apparaissent qu'après validation d'un organisateur.

const MAX_PHOTO_BYTES = 3_000_000; // ~3 Mo de data URL, largement au-dessus
                                   // de ce que produit la réduction côté client

export async function POST(request) {
  if (!isConfigured) return Response.json({ error: "not_configured" }, { status: 503 });

  const body = await request.json();
  const { action, token } = body;

  let householdId = null;
  if (token) {
    const { data } = await db
      .from("wedding_households")
      .select("id")
      .eq("token", token)
      .maybeSingle();
    householdId = data?.id ?? null;
  }

  if (action === "contact") {
    const { name, email, message } = body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return Response.json({ error: "missing_fields" }, { status: 400 });
    }
    const { error } = await db.from("wedding_messages").insert({
      household_id: householdId,
      name: name.trim(),
      email: email.trim(),
      body: message.trim(),
    });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (action === "photo") {
    const { dataUrl, caption } = body;
    if (!dataUrl?.startsWith("data:image/")) {
      return Response.json({ error: "invalid_image" }, { status: 400 });
    }
    if (dataUrl.length > MAX_PHOTO_BYTES) {
      return Response.json({ error: "image_too_large" }, { status: 413 });
    }
    const { error } = await db.from("wedding_photos").insert({
      household_id: householdId,
      caption: caption?.trim() || null,
      url: dataUrl,
      approved: false,
    });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "unknown_action" }, { status: 400 });
}
