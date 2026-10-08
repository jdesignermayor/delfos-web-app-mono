"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getDashboardUser } from "@/lib/auth/dal";
import { USER_PROFILES_CACHE_TAG } from "@/lib/cache-tags";
import { imageToAvatar } from "@/lib/image-to-webp";
import {
  parsePasswordForm,
  parseProfileForm,
  type PasswordFieldErrors,
  type PasswordFormValues,
  type ProfileFieldErrors,
  type ProfileFormValues,
} from "@/lib/validation/profile";
import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import type { Database } from "@/supabase/types";

const AVATARS_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

/** Sidebar avatar/name come from the cached profile: expire it and re-render the dashboard. */
function refreshProfile() {
  updateTag(USER_PROFILES_CACHE_TAG);
  revalidatePath("/dashboard", "layout");
}

/** Storage path of a public avatar URL in our bucket, or `null` for anything else. */
function avatarPath(url: string | null) {
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${AVATARS_BUCKET}/`;
  return url?.startsWith(prefix) ? url.slice(prefix.length) : null;
}

async function currentAvatarUrl(userId: string) {
  const { data } = await createAdminClient().from("users").select("avatar_url").eq("id", userId).maybeSingle();
  return data?.avatar_url ?? null;
}

// --- Personal data -----------------------------------------------------------

export type ProfileActionResult =
  | { success: true }
  | { success: false; message: string | null; fieldErrors: ProfileFieldErrors };

export async function updateProfileAction(values: ProfileFormValues): Promise<ProfileActionResult> {
  const user = await getDashboardUser();
  if (!user) return { success: false, message: "Tu sesión expiró. Ingresa de nuevo.", fieldErrors: {} };

  const parsed = parseProfileForm(values);
  if (!parsed.success) return { success: false, message: null, fieldErrors: parsed.errors };

  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({ name: parsed.data.name, phone: parsed.data.phone })
    .eq("id", user.id);
  if (error) return { success: false, message: "No pudimos guardar tus datos. Intenta de nuevo.", fieldErrors: {} };

  // Keep the auth metadata in sync with the profile row.
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { full_name: parsed.data.name, phone: parsed.data.phone },
  });

  refreshProfile();
  return { success: true };
}

// --- Avatar ------------------------------------------------------------------

export type AvatarActionResult = { success: true; url: string | null } | { success: false; error: string };

/**
 * Crops the picked photo to a square WebP, stores it under `avatars/<userId>/`
 * with a server-generated name and removes the previous one.
 */
export async function uploadAvatarAction(formData: FormData): Promise<AvatarActionResult> {
  const user = await getDashboardUser();
  if (!user) return { success: false, error: "Tu sesión expiró. Ingresa de nuevo." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { success: false, error: "No se recibió ninguna imagen." };
  if (file.size > MAX_AVATAR_BYTES) return { success: false, error: "La imagen supera el tamaño máximo de 10 MB." };

  let webp: Buffer;
  try {
    webp = await imageToAvatar(file);
  } catch {
    return { success: false, error: "No se pudo procesar la imagen. Usa JPG, PNG, WebP o HEIC." };
  }

  const admin = createAdminClient();
  const previous = avatarPath(await currentAvatarUrl(user.id));
  const path = `${user.id}/avatar-${Date.now()}-${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await admin.storage
    .from(AVATARS_BUCKET)
    .upload(path, webp, { contentType: "image/webp", cacheControl: "31536000" });
  if (uploadError) return { success: false, error: `No se pudo subir la imagen: ${uploadError.message}` };

  const url = admin.storage.from(AVATARS_BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await admin.from("users").update({ avatar_url: url }).eq("id", user.id);
  if (error) {
    await admin.storage.from(AVATARS_BUCKET).remove([path]);
    return { success: false, error: "No pudimos guardar tu foto. Intenta de nuevo." };
  }
  if (previous) await admin.storage.from(AVATARS_BUCKET).remove([previous]);

  refreshProfile();
  return { success: true, url };
}

export async function removeAvatarAction(): Promise<AvatarActionResult> {
  const user = await getDashboardUser();
  if (!user) return { success: false, error: "Tu sesión expiró. Ingresa de nuevo." };

  const admin = createAdminClient();
  const previous = avatarPath(await currentAvatarUrl(user.id));
  const { error } = await admin.from("users").update({ avatar_url: null }).eq("id", user.id);
  if (error) return { success: false, error: "No pudimos quitar tu foto. Intenta de nuevo." };
  if (previous) await admin.storage.from(AVATARS_BUCKET).remove([previous]);

  refreshProfile();
  return { success: true, url: null };
}

// --- Password ----------------------------------------------------------------

export type PasswordActionResult =
  | { success: true }
  | { success: false; message: string | null; fieldErrors: PasswordFieldErrors };

/**
 * Re-checks the current password before changing it, so a hijacked session
 * alone can't lock the owner out. The check uses a throwaway client that
 * never touches the request cookies.
 */
export async function changePasswordAction(values: PasswordFormValues): Promise<PasswordActionResult> {
  const user = await getDashboardUser();
  if (!user?.email) return { success: false, message: "Tu sesión expiró. Ingresa de nuevo.", fieldErrors: {} };

  const parsed = parsePasswordForm(values);
  if (!parsed.success) return { success: false, message: null, fieldErrors: parsed.errors };

  const verifier = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (verifyError) {
    return { success: false, message: null, fieldErrors: { currentPassword: "La contraseña actual no es correcta." } };
  }
  await verifier.auth.signOut({ scope: "local" });

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    const message =
      error.code === "weak_password"
        ? "La contraseña es demasiado débil o aparece en filtraciones conocidas."
        : "No pudimos cambiar tu contraseña. Intenta de nuevo.";
    return { success: false, message: null, fieldErrors: { newPassword: message } };
  }

  // Close every other session that used the old password.
  await supabase.auth.signOut({ scope: "others" });
  return { success: true };
}
