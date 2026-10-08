"use server";

import { revalidatePath, updateTag } from "next/cache";

import { sendAdminWelcomeEmailAction } from "@/app/actions/email";
import { getSuperadmin } from "@/lib/auth/dal";
import { USER_PROFILES_CACHE_TAG } from "@/lib/cache-tags";
import { createAdminUser, updateAdminUser, type SaveAdminUserResult } from "@/lib/users/admin-users";
import {
  parseAdminUserForm,
  type AdminUserFieldErrors,
  type AdminUserFormMode,
  type AdminUserFormValues,
  type AdminUserInput,
} from "@/lib/validation/admin-user";

export type AdminUserActionResult =
  | { success: true; userId: string; warning?: string }
  | { success: false; message: string | null; fieldErrors: AdminUserFieldErrors };

/**
 * Shared flow for both forms: authorize → validate → save → refresh the list.
 * Only `save` differs between create and update. Navigation is left to the
 * client so the form never reloads or loses what was typed.
 */
async function saveAdminUser(
  mode: AdminUserFormMode,
  values: AdminUserFormValues,
  save: (input: AdminUserInput) => Promise<SaveAdminUserResult>,
): Promise<AdminUserActionResult> {
  if (!(await getSuperadmin())) {
    return { success: false, message: "No tienes permiso para gestionar usuarios.", fieldErrors: {} };
  }

  const parsed = parseAdminUserForm(values, mode);
  if (!parsed.success) {
    return { success: false, message: null, fieldErrors: parsed.errors };
  }

  const result = await save(parsed.data);
  if (!result.success) {
    return result.field
      ? { success: false, message: null, fieldErrors: { [result.field]: result.error } }
      : { success: false, message: result.error, fieldErrors: {} };
  }

  // Role / constructora / active flag may have changed: expire cached profiles now.
  updateTag(USER_PROFILES_CACHE_TAG);
  revalidatePath("/dashboard/users");
  return { success: true, userId: result.userId };
}

/** Creates the constructora user, then emails them a link to set their own password. */
export async function createAdminUserAction(values: AdminUserFormValues): Promise<AdminUserActionResult> {
  const result = await saveAdminUser("create", values, createAdminUser);
  if (!result.success) return result;

  // The account already exists: a failed email is reported, not rolled back.
  const email = await sendAdminWelcomeEmailAction(result.userId);
  return email.success
    ? result
    : { ...result, warning: `No se pudo enviar el correo de bienvenida: ${email.error}` };
}

export async function updateAdminUserAction(
  userId: string,
  values: AdminUserFormValues,
): Promise<AdminUserActionResult> {
  if (typeof userId !== "string" || !userId) {
    return { success: false, message: "Usuario no válido.", fieldErrors: {} };
  }
  const result = await saveAdminUser("update", values, (input) => updateAdminUser(userId, input));
  if (result.success) revalidatePath(`/dashboard/users/${userId}`);
  return result;
}
