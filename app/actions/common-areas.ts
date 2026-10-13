"use server";

import { revalidatePath } from "next/cache";

import { getSuperadmin } from "@/lib/auth/dal";
import { deleteCommonArea, parseCommonAreaId, updateCommonArea } from "@/lib/common-areas/common-areas";
import { actionFailure, type ActionFormResult, type ActionResult } from "@/lib/forms/action-result";
import { parseCommonAreaForm, type CommonAreaFormValues } from "@/lib/validation/common-area";

export type UpdateCommonAreaActionResult = ActionFormResult<CommonAreaFormValues>;

/**
 * Saves the zona común edit form: authorize → validate → save → refresh.
 * Navigation is left to the client so the form never loses what was typed.
 */
export async function updateCommonAreaAction(
  commonAreaId: string,
  values: CommonAreaFormValues,
): Promise<UpdateCommonAreaActionResult> {
  if (!(await getSuperadmin())) return actionFailure("No tienes permiso para realizar esta acción.");

  const id = parseCommonAreaId(commonAreaId);
  if (id === null) return actionFailure("Zona común no válida.");

  const parsed = parseCommonAreaForm(values);
  if (!parsed.success) return { success: false, message: null, fieldErrors: parsed.errors };

  const result = await updateCommonArea(id, parsed.data);
  if (!result.success) return actionFailure(result.error);

  // Zonas comunes feed the property form's amenity picker across the dashboard.
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function deleteCommonAreaAction(commonAreaId: string): Promise<ActionResult> {
  if (!(await getSuperadmin())) return { success: false, error: "No tienes permiso para realizar esta acción." };

  const id = parseCommonAreaId(commonAreaId);
  if (id === null) return { success: false, error: "Zona común no válida." };

  const result = await deleteCommonArea(id);
  if (result.success) revalidatePath("/dashboard", "layout");
  return result;
}
