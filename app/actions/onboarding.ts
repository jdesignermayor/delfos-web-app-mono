"use server";

import { revalidatePath } from "next/cache";

import { getDashboardUser } from "@/lib/auth/dal";
import { FIDUCIAS_REVIEWED_KEY } from "@/lib/onboarding";
import { createAdminClient } from "@/supabase/admin";

export type OnboardingActionResult = { success: true } | { success: false; error: string };

/** Marks the "Verifica tus fiducias" step as done (stored in the auth user's metadata). */
export async function confirmFiduciasReviewedAction(): Promise<OnboardingActionResult> {
  const user = await getDashboardUser();
  if (!user) return { success: false, error: "Tu sesión expiró. Ingresa de nuevo." };

  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(user.id);
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...data?.user?.user_metadata, [FIDUCIAS_REVIEWED_KEY]: new Date().toISOString() },
  });
  if (error) return { success: false, error: "No pudimos guardar el paso. Intenta de nuevo." };

  revalidatePath("/dashboard/onboarding");
  return { success: true };
}
