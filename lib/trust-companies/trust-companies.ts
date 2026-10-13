/**
 * Fiducias (`trust_companies` table): list, read, update and delete.
 * Server-only — uses the service-role client. Callers must authorize the
 * caller and pass their constructora scope.
 */
import { PG_ERROR } from "@/lib/db-errors";
import type { ActionResult } from "@/lib/forms/action-result";
import type { TrustCompanyField, TrustCompanyInput } from "@/lib/validation/trust-company";
import { parseUuid } from "@/lib/validation/uuid";
import { createAdminClient } from "@/supabase/admin";


export type TrustCompanyRow = {
  id: string;
  name: string;
  nit: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  description: string | null;
  updatedAt: string | null;
};

/** One row of the fiducias list (`/dashboard/fiducias`). */
export type TrustCompanyListItem = Pick<TrustCompanyRow, "id" | "name" | "nit" | "phone" | "email">;

export type SaveTrustCompanyResult =
  | { success: true; trustCompanyId: string }
  | { success: false; error: string; field?: TrustCompanyField };

/** Parses a route segment into a fiducia id (a UUID), or `null` when it isn't one. */
export const parseTrustCompanyId = parseUuid;

/**
 * Fiducias visible to a constructora scope, newest first: the shared catalog
 * plus the constructora's own rows, or every row when `developerScope` is
 * `null` (superadmin). Throws when the query fails.
 */
export async function listTrustCompanies(developerScope: number | null): Promise<TrustCompanyListItem[]> {
  const admin = createAdminClient();
  let query = admin
    .from("trust_companies")
    .select("id, name, nit, phone, email")
    .order("created_at", { ascending: false });
  if (developerScope !== null) query = query.or(`developer_id.is.null,developer_id.eq.${developerScope}`);

  const { data, error } = await query;
  if (error) throw new Error(`No se pudieron cargar las fiducias: ${error.message}`);
  return data;
}

export async function getTrustCompany(trustCompanyId: string): Promise<TrustCompanyRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("trust_companies")
    .select("id, name, nit, phone, email, address, description, updated_at")
    .eq("id", trustCompanyId)
    .maybeSingle();

  if (!data) return null;
  const { updated_at: updatedAt, ...row } = data;
  return { ...row, updatedAt };
}

export async function updateTrustCompany(
  trustCompanyId: string,
  input: TrustCompanyInput,
): Promise<SaveTrustCompanyResult> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("trust_companies")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", trustCompanyId)
    .select("id")
    .maybeSingle();

  if (error) {
    // `nit` is the only unique column besides the id.
    return error.code === PG_ERROR.uniqueViolation
      ? { success: false, error: "Ya existe una fiducia con este NIT.", field: "nit" }
      : { success: false, error: `No se pudo actualizar la fiducia: ${error.message}` };
  }
  if (!data) return { success: false, error: "La fiducia no existe." };
  return { success: true, trustCompanyId: data.id };
}

/**
 * Deletes a fiducia. Properties store the fiducia's name as text (not a
 * foreign key), so the ones that used it keep showing that name.
 */
export async function deleteTrustCompany(trustCompanyId: string): Promise<ActionResult> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("trust_companies")
    .delete()
    .eq("id", trustCompanyId)
    .select("id")
    .maybeSingle();

  if (error) return { success: false, error: `No se pudo eliminar la fiducia: ${error.message}` };
  if (!data) return { success: false, error: "La fiducia no existe." };
  return { success: true };
}
