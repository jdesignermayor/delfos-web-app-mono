"use server";

import { revalidatePath } from "next/cache";

import { getDashboardUser } from "@/lib/auth/dal";
import { canAccessEntity } from "@/lib/auth/permissions";
import { actionFailure, type ActionFormResult } from "@/lib/forms/action-result";
import { parseTrustCompanyId, updateTrustCompany } from "@/lib/trust-companies/trust-companies";
import { parseTrustCompanyForm, type TrustCompanyFormValues } from "@/lib/validation/trust-company";

export type UpdateTrustCompanyActionResult = ActionFormResult<TrustCompanyFormValues>;

/**
 * Saves the fiducia edit form: authorize → validate → save → refresh.
 * Only superadmins may edit fiducias. Navigation is left to the client so
 * the form never loses what was typed.
 */
export async function updateTrustCompanyAction(
  trustCompanyId: string,
  values: TrustCompanyFormValues,
): Promise<UpdateTrustCompanyActionResult> {
  const user = await getDashboardUser();
  if (!user || !canAccessEntity(user, "trust_companies", "modify")) {
    return actionFailure("No tienes permiso para realizar esta acción.");
  }

  const id = parseTrustCompanyId(trustCompanyId);
  if (id === null) return actionFailure("Fiducia no válida.");

  const parsed = parseTrustCompanyForm(values);
  if (!parsed.success) return { success: false, message: null, fieldErrors: parsed.errors };

  const result = await updateTrustCompany(id, parsed.data);
  if (!result.success) {
    return result.field
      ? { success: false, message: null, fieldErrors: { [result.field]: result.error } }
      : actionFailure(result.error);
  }

  // Fiducias feed catalogs and the property form's selects across the dashboard.
  revalidatePath("/dashboard", "layout");
  return { success: true };
}
