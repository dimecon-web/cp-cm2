import { db, isConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

// Portail des invités : une adresse email et le mot de passe commun,
// communiqué dans l'invitation. L'adresse email fait l'identité.
//
// Connue : la personne retrouve sa réponse, pour la consulter ou la
// modifier. Inconnue : son foyer est créé, et elle remplit sa réponse.
//
// Le mot de passe est vérifié ici, côté serveur : il ne part jamais dans le
// code de la page.

const CODE = (process.env.GUEST_CODE || "party").trim().toLowerCase();
const VALID_EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";   // sans caractères ambigus

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

// Une adresse peut être connue à trois endroits : le carnet d'adresses, la
// réponse du foyer, ou la fiche d'un adulte nommé.
async function findHousehold(email) {
  const direct = await db
    .from("wedding_households").select("token").eq("email", email).maybeSingle();
  if (direct.data) return direct.data.token;

  for (const table of ["wedding_rsvps", "wedding_participants"]) {
    const { data } = await db
      .from(table)
      .select("household_id, wedding_households(token)")
      .eq("email", email)
      .limit(1)
      .maybeSingle();
    if (data?.wedding_households?.token) return data.wedding_households.token;
  }
  return null;
}

export async function POST(request) {
  if (!isConfigured) return Response.json({ error: "not_configured" }, { status: 503 });

  const body = await request.json();
  if ((body.code || "").trim().toLowerCase() !== CODE) {
    return Response.json({ error: "bad_code" }, { status: 401 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!VALID_EMAIL.test(email)) {
    return Response.json({ error: "bad_email" }, { status: 400 });
  }

  const known = await findHousehold(email);
  if (known) return Response.json({ token: known, existing: true });

  // Nom provisoire : la personne le corrigera dans le formulaire, où le nom
  // de la famille est demandé. Mieux vaut un repère qu'un vide.
  const placeholder = email.split("@")[0].replace(/[._-]+/g, " ").trim() || "Nouveau foyer";
  const token = await makeToken();
  const { error } = await db.from("wedding_households").insert({
    token,
    name: placeholder.charAt(0).toUpperCase() + placeholder.slice(1),
    email,
    lang: ["fr", "en", "el"].includes(body.lang) ? body.lang : "fr",
    source: "portail",
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ token, existing: false });
}
