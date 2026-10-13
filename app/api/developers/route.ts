import { getSuperadmin } from "@/lib/auth/dal";
import { listDevelopers } from "@/lib/developers/developers";

/**
 * Constructoras list for client-side queries (TanStack Query). A Route
 * Handler rather than a Server Action: actions are queued one at a time,
 * which would serialize reads behind any pending mutation.
 */
export async function GET() {
  if (!(await getSuperadmin())) {
    return Response.json({ error: "No tienes permiso para ver las constructoras." }, { status: 403 });
  }

  try {
    return Response.json(await listDevelopers());
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar las constructoras.";
    return Response.json({ error: message }, { status: 500 });
  }
}
