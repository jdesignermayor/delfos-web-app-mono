import { getDashboardUser } from "@/lib/auth/dal";
import { canAccessEntity, developerScope } from "@/lib/auth/permissions";
import { listTrustCompanies } from "@/lib/trust-companies/trust-companies";

/**
 * Fiducias list for client-side queries (TanStack Query). Constructora
 * admins get the shared catalog plus their own rows; superadmins get all.
 */
export async function GET() {
  const user = await getDashboardUser();
  if (!user || !canAccessEntity(user, "trust_companies", "read")) {
    return Response.json({ error: "No tienes permiso para ver las fiducias." }, { status: 403 });
  }

  try {
    return Response.json(await listTrustCompanies(developerScope(user)));
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar las fiducias.";
    return Response.json({ error: message }, { status: 500 });
  }
}
