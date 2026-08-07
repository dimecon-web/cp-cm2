import { isConfigured, adminEnabled } from "@/lib/db";

export const dynamic = "force-dynamic";

// Permet au navigateur de savoir s'il doit parler à la base (mode serveur)
// ou rester sur ses données locales (mode démo). Aucune donnée sensible.
export function GET() {
  return Response.json({ configured: isConfigured, adminEnabled });
}
