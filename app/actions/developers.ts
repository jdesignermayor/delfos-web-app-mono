"use server";

import { revalidatePath, updateTag } from "next/cache";

import { getSuperadmin } from "@/lib/auth/dal";
import { USER_PROFILES_CACHE_TAG } from "@/lib/cache-tags";
import {
  deleteDeveloper,
  parseDeveloperId,
  restoreDeveloper,
  updateDeveloper,
  type DeveloperSnapshot,
} from "@/lib/developers/developers";
import { actionFailure, type ActionFormResult, type ActionResult } from "@/lib/forms/action-result";
import { parseDeletedRecord } from "@/lib/forms/deleted-record";
import { parseDeveloperForm, type DeveloperFormValues } from "@/lib/validation/developer";
import { createAdminClient } from "@/supabase/admin";

export type SetDeveloperEnabledResult = ActionResult;

/**
 * Enables or disables a constructora. Its users can't sign in — and are
 * kept out of the dashboard on their next request — while it's disabled.
 */
export async function setDeveloperEnabled(
  developerId: number,
  isEnabled: boolean,
): Promise<SetDeveloperEnabledResult> {
  if (!(await getSuperadmin())) {
    return { success: false, error: "No tienes permiso para realizar esta acción." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("developers")
    .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
    .eq("id", developerId);

  if (error) {
    return { success: false, error: `No se pudo actualizar la constructora: ${error.message}` };
  }

  // Its users' cached profiles carry `is_enabled`: expire them so access changes apply now.
  updateTag(USER_PROFILES_CACHE_TAG);
  revalidatePath("/dashboard/constructoras");
  revalidatePath("/dashboard/users");
  return { success: true };
}

export type UpdateDeveloperActionResult = ActionFormResult<DeveloperFormValues>;

/**
 * Saves the constructora edit form: authorize → validate → save → refresh.
 * Navigation is left to the client so the form never loses what was typed.
 */
export async function updateDeveloperAction(
  developerId: number,
  values: DeveloperFormValues,
): Promise<UpdateDeveloperActionResult> {
  if (!(await getSuperadmin())) {
    return actionFailure("No tienes permiso para realizar esta acción.");
  }

  const id = parseDeveloperId(developerId);
  if (id === null) return actionFailure("Constructora no válida.");

  const parsed = parseDeveloperForm(values);
  if (!parsed.success) return { success: false, message: null, fieldErrors: parsed.errors };

  const result = await updateDeveloper(id, parsed.data);
  if (!result.success) {
    return result.field
      ? { success: false, message: null, fieldErrors: { [result.field]: result.error } }
      : { success: false, message: result.error, fieldErrors: {} };
  }

  // Name and `is_enabled` live in users' cached profiles; the name also feeds
  // catalogs and selects across the dashboard.
  updateTag(USER_PROFILES_CACHE_TAG);
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

/** Deletes a constructora, unless users, projects, properties or fiducias still reference it. */
export async function deleteDeveloperAction(developerId: number): Promise<ActionResult<DeveloperSnapshot>> {
  if (!(await getSuperadmin())) return { success: false, error: "No tienes permiso para realizar esta acción." };

  const id = parseDeveloperId(developerId);
  if (id === null) return { success: false, error: "Constructora no válida." };

  const result = await deleteDeveloper(id);
  if (result.success) revalidatePath("/dashboard", "layout");
  return result;
}

/** "Deshacer" for `deleteDeveloperAction`: re-creates the constructora from its snapshot. */
export async function restoreDeveloperAction(snapshot: DeveloperSnapshot): Promise<ActionResult> {
  if (!(await getSuperadmin())) return { success: false, error: "No tienes permiso para realizar esta acción." };

  const record = parseDeletedRecord(snapshot, parseDeveloperId, parseDeveloperForm);
  if (!record) return { success: false, error: "No se pudo restaurar: los datos no son válidos." };

  const result = await restoreDeveloper(record);
  if (result.success) revalidatePath("/dashboard", "layout");
  return result;
}
