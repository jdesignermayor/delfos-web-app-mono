"use server";

import { revalidatePath } from "next/cache";

import { getSuperadmin } from "@/lib/auth/dal";
import { createAdminClient } from "@/supabase/admin";

export type SetDeveloperEnabledResult = { success: true } | { success: false; error: string };

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

  revalidatePath("/dashboard/constructoras");
  revalidatePath("/dashboard/users");
  return { success: true };
}
