import { getSuperadmin } from "@/lib/auth/dal";
import { listCommonAreas } from "@/lib/common-areas/common-areas";

/** Zonas comunes list for client-side queries (TanStack Query). Superadmins only. */
export async function GET() {
  if (!(await getSuperadmin())) {
    return Response.json({ error: "No tienes permiso para ver las zonas comunes." }, { status: 403 });
  }

  try {
    return Response.json(await listCommonAreas());
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar las zonas comunes.";
    return Response.json({ error: message }, { status: 500 });
  }
}
