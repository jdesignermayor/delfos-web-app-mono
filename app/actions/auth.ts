"use server";

import { redirect } from "next/navigation";

import { canAccessAccount, signInDenialReason } from "@/lib/auth/permissions";
import {
  createTokenForUnconfirmedUser,
  createUnconfirmedUser,
  deleteAuthUser,
  findRoleId,
  isEmailRegistered,
  saveUserProfile,
  type PendingSignUp,
} from "@/lib/auth/user-accounts";
import { sendViewerConfirmationEmail } from "@/lib/email/viewer-confirmation";
import { createRateLimiter } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { isValidEmail, normalizeEmail } from "@/lib/validation/email";
import { PASSWORD_REGEX } from "@/lib/validation/profile";
import {
  parseRegisterForm,
  type RegisterField,
  type RegisterFormValues,
} from "@/lib/validation/register";
import { getUserProfile, type RoleName } from "@/supabase/roles";
import { createClient } from "@/supabase/server";

export type { RegisterField } from "@/lib/validation/register";

/**
 * Sign-up never says whether an email already has an account: every successful attempt, new or
 * existing email, gets the same "check your inbox" answer. Only format errors are
 * specific, since they reveal nothing about stored data.
 */
export type RegisterResult =
  | { success: true; needsEmailConfirmation: boolean }
  | { success: false; error: string; field?: RegisterField };

/** Public sign-up only ever creates viewers; other roles are invited from the dashboard. */
const SELF_SIGNUP_ROLE: RoleName = "viewer";

const REGISTER_FAILED = "No pudimos crear tu cuenta. Intenta de nuevo.";
const TOO_MANY_ATTEMPTS = "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.";
/** The answer for an email that may or may not be registered: indistinguishable on purpose. */
const CHECK_YOUR_INBOX: RegisterResult = { success: true, needsEmailConfirmation: true };

const signUpLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });
const signInLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

/**
 * For an email that already has an account: re-sends the confirmation link if it was never
 * confirmed, and otherwise does nothing. Either way the caller sees the same answer.
 */
async function resendConfirmationIfPending(email: string): Promise<RegisterResult> {
  try {
    const pending = await createTokenForUnconfirmedUser(email);
    if (pending) await sendViewerConfirmationEmail({ email, name: pending.name, tokenHash: pending.tokenHash });
  } catch {
    // Swallowed on purpose: a different answer here would reveal that the email is registered.
  }
  return CHECK_YOUR_INBOX;
}

/**
 * Registers a visitor with email and password as a `viewer`. The role is fixed here on the
 * server, never taken from the form, so sign-up can't be used to obtain dashboard access.
 */
export async function registerViewerAccount(input: RegisterFormValues): Promise<RegisterResult> {
  if (!signUpLimiter.tryConsume(await getClientIp())) return { success: false, error: TOO_MANY_ATTEMPTS };

  const parsed = parseRegisterForm(input);
  if (!parsed.success) return parsed;
  const { fullName, email, phone, password } = parsed.data;

  let roleId: string | null;
  try {
    if (await isEmailRegistered(email)) return resendConfirmationIfPending(email);
    roleId = await findRoleId(SELF_SIGNUP_ROLE);
  } catch {
    return { success: false, error: REGISTER_FAILED };
  }
  if (!roleId) return { success: false, error: REGISTER_FAILED };

  let signUp: PendingSignUp;
  try {
    signUp = await createUnconfirmedUser({ email, password, metadata: { full_name: fullName, phone } });
  } catch {
    return { success: false, error: REGISTER_FAILED };
  }
  if (signUp.status === "exists") return resendConfirmationIfPending(email);

  try {
    await saveUserProfile({ id: signUp.userId, email, name: fullName, phone, roleId });
    const sent = await sendViewerConfirmationEmail({ email, name: fullName, tokenHash: signUp.tokenHash });
    if (!sent.success) throw new Error(sent.error);
  } catch {
    // Without a profile or the email the account could never be activated: undo it so the email can try again.
    await deleteAuthUser(signUp.userId);
    return { success: false, error: REGISTER_FAILED };
  }

  return CHECK_YOUR_INBOX;
}

export type ConfirmEmailResult = { success: true; hasAccountAccess: boolean } | { success: false; error: string };

/**
 * Activates a viewer's account from the emailed `/auth/confirm` link and signs them in. The
 * single-use token is only exchanged here, on click, so mail scanners that pre-open links can't burn it.
 */
export async function confirmEmailAction(input: { tokenHash: string }): Promise<ConfirmEmailResult> {
  const tokenHash = typeof input?.tokenHash === "string" ? input.tokenHash : "";
  if (!tokenHash) return { success: false, error: "El enlace no es válido." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (error || !data.user) {
    return { success: false, error: "El enlace venció o ya fue usado. Intenta iniciar sesión o regístrate de nuevo." };
  }

  const user = await getUserProfile(data.user, { fresh: true });
  const denialReason = signInDenialReason(user);
  if (denialReason) {
    await supabase.auth.signOut();
    return { success: false, error: denialReason };
  }

  return { success: true, hasAccountAccess: canAccessAccount(user) };
}

export type SignInResult =
  | { success: true; role: RoleName | null; hasAccountAccess: boolean }
  | { success: false; error: string };

export async function signInAccount(input: {
  email: string;
  password: string;
}): Promise<SignInResult> {
  if (!signInLimiter.tryConsume(await getClientIp())) return { success: false, error: TOO_MANY_ATTEMPTS };

  const email = normalizeEmail(String(input.email ?? ""));
  const password = String(input.password ?? "");

  if (!isValidEmail(email)) {
    return { success: false, error: "Ingresa un correo válido." };
  }
  if (!password) {
    return { success: false, error: "Ingresa tu contraseña." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  // Supabase only reports this after checking the password, so it tells nothing to a stranger.
  if (error?.code === "email_not_confirmed") {
    return { success: false, error: "Confirma tu correo para ingresar. Revisa tu bandeja de entrada." };
  }
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

  return { success: true, role: user.role, hasAccountAccess: canAccessAccount(user) };
}

export async function signOutAccount(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type SetPasswordField = "password" | "confirmPassword";

export type SetPasswordResult =
  | { success: true; hasAccountAccess: boolean }
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

  return { success: true, hasAccountAccess: canAccessAccount(user) };
}
