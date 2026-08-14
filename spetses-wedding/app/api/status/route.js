import { isConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

// Indique si l'application est reliée à sa base, et si le code d'installation
// est défini — un booléen seulement, jamais la valeur elle-même.
export function GET() {
  return Response.json({
    configured: isConfigured,
    setupReady: Boolean(process.env.ADMIN_SETUP_CODE),
  });
}
