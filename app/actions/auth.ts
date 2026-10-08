"use server";

import { redirect } from "next/navigation";

import { canAccessDashboard, signInDenialReason } from "@/lib/auth/permissions";
import { isValidEmail, normalizeEmail } from "@/lib/validation/email";
import { PASSWORD_REGEX } from "@/lib/validation/profile";
import { createAdminClient } from "@/supabase/admin";
import { getUserProfile, type RoleName } from "@/supabase/roles";
import { createClient } from "@/supabase/server";

export type RegisterField = "fullName" | "email" | "phone" | "password";

export type RegisterResult =
  | { success: true; needsEmailConfirmation: boolean }
  | { success: false; error: string; field?: RegisterField };

/** Looks up `public.users` with the service-role client so RLS can't hide a match. */
export async function checkEmailExists(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

export async function registerAccount(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<RegisterResult> {
  const fullName = input.fullName.trim();
  const email = normalizeEmail(input.email);
  const phone = input.phone.trim();
  const password = input.password;

  if (!fullName) {
    return { success: false, error: "Ingresa tu nombre completo.", field: "fullName" };
  }
  if (!isValidEmail(email)) {
    return { success: false, error: "Ingresa un correo válido.", field: "email" };
  }
  if (!phone) {
    return { success: false, error: "Ingresa tu teléfono.", field: "phone" };
  }
  if (password.length < 6) {
    return {
      success: false,
      error: "La contraseña debe tener al menos 6 caracteres.",
      field: "password",
    };
  }

  let exists: boolean;
  try {
    exists = await checkEmailExists(email);
  } catch {
    return {
      success: false,
      error: "No pudimos validar el correo. Intenta de nuevo.",
      field: "email",
    };
  }
  if (exists) {
    return { success: false, error: "Ya existe una cuenta con este correo.", field: "email" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone } },
  });

  if (error) {
    return { success: false, error: error.message, field: "email" };
  }

  const userId = data.user?.id;
  if (userId) {
    const admin = createAdminClient();
    await admin.from("users").upsert(
      { id: userId, email, name: fullName, phone },
      { onConflict: "id" },
    );
  }

  return { success: true, needsEmailConfirmation: data.session === null };
}

export type SignInResult =
  | { success: true; role: RoleName | null; hasDashboardAccess: boolean }
  | { success: false; error: string };

export async function signInAccount(input: {
  email: string;
  password: string;
}): Promise<SignInResult> {
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!isValidEmail(email)) {
    return { success: false, error: "Ingresa un correo válido." };
  }
  if (!password) {
    return { success: false, error: "Ingresa tu contraseña." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { success: false, error: "Correo o contraseña incorrectos." };
  }

  // Valid credentials aren't enough: the profile must exist and be active,
  // and a constructora's users need their constructora to be enabled.
  const user = await getUserProfile(data.user, { fresh: true });
  const denialReason = signInDenialReason(user);
  if (denialReason) {
    await supabase.auth.signOut();
    return { success: false, error: denialReason };
  }

  return { success: true, role: user.role, hasDashboardAccess: canAccessDashboard(user) };
}

export async function signOutAccount(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type SetPasswordField = "password" | "confirmPassword";

export type SetPasswordResult =
  | { success: true; hasDashboardAccess: boolean }
  | { success: false; error: string; field?: SetPasswordField };

/**
 * Sets the password from an emailed link (welcome email / reset). The
 * one-time Supabase token is only exchanged here, on submit — not when the
 * page opens — so mail scanners that pre-open links can't burn it. On
 * success the user is signed in with the new password.
 */
export async function setPasswordWithTokenAction(input: {
  tokenHash: string;
  password: string;
  confirmPassword: string;
}): Promise<SetPasswordResult> {
  const tokenHash = typeof input.tokenHash === "string" ? input.tokenHash : "";
  const password = typeof input.password === "string" ? input.password : "";
  const confirmPassword = typeof input.confirmPassword === "string" ? input.confirmPassword : "";

  if (!tokenHash) return { success: false, error: "El enlace no es válido." };
  if (!PASSWORD_REGEX.test(password)) {
    return { success: false, error: "La contraseña no cumple los requisitos de seguridad.", field: "password" };
  }
  if (password !== confirmPassword) {
    return { success: false, error: "Las contraseñas no coinciden.", field: "confirmPassword" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
  if (error || !data.user) {
    return {
      success: false,
      error: "El enlace venció o ya fue usado. Pide al administrador que te envíe uno nuevo.",
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    await supabase.auth.signOut();
    return {
      success: false,
      error:
        updateError.code === "weak_password"
          ? "La contraseña es demasiado débil o aparece en filtraciones conocidas."
          : "No pudimos guardar tu contraseña. Intenta de nuevo.",
      field: "password",
    };
  }

  // Same gate as a normal sign-in: an inactive user or disabled constructora stays out.
  const user = await getUserProfile(data.user, { fresh: true });
  const denialReason = signInDenialReason(user);
  if (denialReason) {
    await supabase.auth.signOut();
    return { success: false, error: `Tu contraseña quedó guardada, pero no puedes ingresar: ${denialReason}` };
  }

  return { success: true, hasDashboardAccess: canAccessDashboard(user) };
}
