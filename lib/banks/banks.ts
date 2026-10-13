/**
 * Bancos (`banks` table): list, read, update, delete and restore.
 * Server-only — uses the service-role client. Callers must check the caller
 * is a superadmin.
 */
import { PG_ERROR } from "@/lib/db-errors";
import type { ActionResult } from "@/lib/forms/action-result";
import type { DeletedRecord, ParsedDeletedRecord } from "@/lib/forms/deleted-record";
import type { BankField, BankFormValues, BankInput } from "@/lib/validation/bank";
import { toCompanyFormValues } from "@/lib/validation/company";
import { parseUuid } from "@/lib/validation/uuid";
import { createAdminClient } from "@/supabase/admin";

const DUPLICATE_CODE = "Ya existe un banco con este código DANE.";

export type BankRow = {
  id: string;
  name: string;
  nit: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  description: string | null;
  updatedAt: string | null;
};

/** One row of the bancos list (`/dashboard/bancos`). */
export type BankListItem = Pick<BankRow, "id" | "name" | "nit" | "phone" | "email">;

/** A deleted banco, kept by the client so "Deshacer" can restore it. */
export type BankSnapshot = DeletedRecord<string, BankFormValues>;

export type SaveBankResult = { success: true; bankId: string } | { success: false; error: string; field?: BankField };

/** Parses a route segment into a banco id (a UUID), or `null` when it isn't one. */
export const parseBankId = parseUuid;

/** Every banco, newest first. Throws when the query fails. */
export async function listBanks(): Promise<BankListItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("banks")
    .select("id, name, nit, phone, email")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`No se pudieron cargar los bancos: ${error.message}`);
  return data;
}

export async function getBank(bankId: string): Promise<BankRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("banks")
    .select("id, name, nit, phone, email, address, description, updated_at")
    .eq("id", bankId)
    .maybeSingle();

  if (!data) return null;
  const { updated_at: updatedAt, ...row } = data;
  return { ...row, updatedAt };
}

export async function updateBank(bankId: string, input: BankInput): Promise<SaveBankResult> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("banks")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", bankId)
    .select("id")
    .maybeSingle();

  if (error) {
    // `nit` (the código DANE) is the only unique column besides the id.
    return error.code === PG_ERROR.uniqueViolation
      ? { success: false, error: DUPLICATE_CODE, field: "nit" }
      : { success: false, error: `No se pudo actualizar el banco: ${error.message}` };
  }
  if (!data) return { success: false, error: "El banco no existe." };
  return { success: true, bankId: data.id };
}

/**
 * Deletes a banco. Nothing references the catalog: a property's "banco
 * constructor" is free text, so it's unaffected.
 */
export async function deleteBank(bankId: string): Promise<ActionResult<BankSnapshot>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("banks")
    .delete()
    .eq("id", bankId)
    .select("id, name, nit, phone, email, address, description, created_at")
    .maybeSingle();

  if (error) return { success: false, error: `No se pudo eliminar el banco: ${error.message}` };
  if (!data) return { success: false, error: "El banco no existe." };
  return { success: true, data: { id: data.id, createdAt: data.created_at, values: toCompanyFormValues(data) } };
}

/** Re-creates a just-deleted banco ("Deshacer") with its original id and creation date. */
export async function restoreBank({ id, createdAt, input }: ParsedDeletedRecord<string, BankInput>): Promise<ActionResult> {
  const admin = createAdminClient();
  const { error } = await admin.from("banks").insert({ ...input, id, ...(createdAt ? { created_at: createdAt } : {}) });

  if (error) {
    return error.code === PG_ERROR.uniqueViolation
      ? { success: false, error: `No se pudo restaurar: ${DUPLICATE_CODE.toLowerCase()}` }
      : { success: false, error: `No se pudo restaurar el banco: ${error.message}` };
  }
  return { success: true };
}
