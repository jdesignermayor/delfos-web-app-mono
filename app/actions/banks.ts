"use server";

import { revalidatePath } from "next/cache";

import { getSuperadmin } from "@/lib/auth/dal";
import { deleteBank, parseBankId, restoreBank, updateBank, type BankSnapshot } from "@/lib/banks/banks";
import { actionFailure, type ActionFormResult, type ActionResult } from "@/lib/forms/action-result";
import { parseDeletedRecord } from "@/lib/forms/deleted-record";
import { parseBankForm, type BankFormValues } from "@/lib/validation/bank";

export type UpdateBankActionResult = ActionFormResult<BankFormValues>;

const UNAUTHORIZED = "No tienes permiso para realizar esta acción.";

/**
 * Saves the banco edit form: authorize → validate → save → refresh.
 * Navigation is left to the client so the form never loses what was typed.
 */
export async function updateBankAction(bankId: string, values: BankFormValues): Promise<UpdateBankActionResult> {
  if (!(await getSuperadmin())) return actionFailure(UNAUTHORIZED);

  const id = parseBankId(bankId);
  if (id === null) return actionFailure("Banco no válido.");

  const parsed = parseBankForm(values);
  if (!parsed.success) return { success: false, message: null, fieldErrors: parsed.errors };

  const result = await updateBank(id, parsed.data);
  if (!result.success) {
    return result.field
      ? { success: false, message: null, fieldErrors: { [result.field]: result.error } }
      : actionFailure(result.error);
  }

  // Refresh every dashboard page that lists catalogs.
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

/** Deletes a banco and returns its snapshot so the client can offer "Deshacer". */
export async function deleteBankAction(bankId: string): Promise<ActionResult<BankSnapshot>> {
  if (!(await getSuperadmin())) return { success: false, error: UNAUTHORIZED };

  const id = parseBankId(bankId);
  if (id === null) return { success: false, error: "Banco no válido." };

  const result = await deleteBank(id);
  if (result.success) revalidatePath("/dashboard", "layout");
  return result;
}

/** "Deshacer" for `deleteBankAction`: re-creates the banco from its snapshot. */
export async function restoreBankAction(snapshot: BankSnapshot): Promise<ActionResult> {
  if (!(await getSuperadmin())) return { success: false, error: UNAUTHORIZED };

  const record = parseDeletedRecord(snapshot, parseBankId, parseBankForm);
  if (!record) return { success: false, error: "No se pudo restaurar: los datos no son válidos." };

  const result = await restoreBank(record);
  if (result.success) revalidatePath("/dashboard", "layout");
  return result;
}
