export const runtime = "nodejs";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";
const OPENAI_ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";

/**
 * POST /api/transcribe
 * Body: multipart/form-data avec un champ `audio` (Blob webm/mp4/wav)
 * et un champ optionnel `language` (code ISO-639-1, ex. "fr").
 * Réponse: { text: string }
 *
 * Requiert GROQ_API_KEY (recommandé, quasi gratuit et très rapide)
 * ou OPENAI_API_KEY dans les variables d'environnement Vercel.
 */
export async function POST(req: Request) {
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!groqKey && !openaiKey) {
    return Response.json(
      { error: "Aucune clé API configurée (GROQ_API_KEY ou OPENAI_API_KEY)" },
      { status: 500 },
    );
  }

  const form = await req.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return Response.json({ error: "Champ `audio` manquant ou vide" }, { status: 400 });
  }
  // Garde-fou : Whisper accepte jusqu'à 25 Mo par requête.
  if (audio.size > 24 * 1024 * 1024) {
    return Response.json({ error: "Audio trop volumineux (max 24 Mo)" }, { status: 413 });
  }

  const upstream = new FormData();
  upstream.append("file", audio, audio.name || "audio.webm");
  upstream.append("model", groqKey ? "whisper-large-v3-turbo" : "whisper-1");
  const language = form.get("language");
  if (typeof language === "string" && language) upstream.append("language", language);

  const res = await fetch(groqKey ? GROQ_ENDPOINT : OPENAI_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${groqKey ?? openaiKey}` },
    body: upstream,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return Response.json(
      { error: `Échec de la transcription (${res.status})`, detail },
      { status: 502 },
    );
  }

  const data = (await res.json()) as { text?: string };
  return Response.json({ text: (data.text ?? "").trim() });
}
