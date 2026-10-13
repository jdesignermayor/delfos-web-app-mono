import { getSuperadmin } from "@/lib/auth/dal";
import { listBanks } from "@/lib/banks/banks";

/** Bancos list for client-side queries (TanStack Query). Superadmins only. */
export async function GET() {
  if (!(await getSuperadmin())) {
    return Response.json({ error: "No tienes permiso para ver los bancos." }, { status: 403 });
  }

  try {
    return Response.json(await listBanks());
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar los bancos.";
    return Response.json({ error: message }, { status: 500 });
  }
}
