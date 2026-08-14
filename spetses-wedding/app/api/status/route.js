import { isConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

// Indique simplement si l'application est reliée à sa base. Aucune donnée
// sensible : sert à afficher un message clair plutôt qu'une page cassée.
export function GET() {
  return Response.json({ configured: isConfigured });
}
