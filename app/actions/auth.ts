"use server";

import { redirect } from "next/navigation";

import { canAccessDashboard, signInDenialReason } from "@/lib/auth/permissions";
import { isValidEmail, normalizeEmail } from "@/lib/validation/email";
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
  const user = await getUserProfile(data.user);
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
