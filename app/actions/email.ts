"use server";

/**
 * One Server Action per transactional email an authorized user can trigger.
 * Sending itself lives in `lib/email/send-email.ts` (server-only), so no
 * generic "send anything" endpoint is ever exposed to the browser.
 * Templates live in `/emails` (React Email components).
 */
import { AdminWelcomeEmail } from "@/emails/admin-welcome-email";
import { getSuperadmin } from "@/lib/auth/dal";
import { sendEmail, type EmailResult } from "@/lib/email/send-email";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getAdminUser } from "@/lib/users/admin-users";
import { createAdminClient } from "@/supabase/admin";

/**
 * Lifetime of password links, in hours. Must match Supabase → Authentication
 * → Email → "Email OTP Expiration" (seconds), which is what actually expires
 * the token; this value is only shown in the email.
 */
const PASSWORD_LINK_EXPIRY_HOURS = Number(process.env.AUTH_LINK_EXPIRY_HOURS) || 24;

/**
 * One-time link to `/auth/set-password`. Supabase creates a recovery token
 * (without sending its own email) and we point it at our page, which
 * exchanges it for a session only when the form is submitted.
 */
async function createSetPasswordUrl(email: string): Promise<string | null> {
  const { data, error } = await createAdminClient().auth.admin.generateLink({ type: "recovery", email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    console.error("[email] No se pudo generar el enlace de contraseña:", error);
    return null;
  }
  const params = new URLSearchParams({ token_hash: tokenHash, type: "recovery" });
  return `${SITE_URL}/auth/set-password?${params}`;
}

// --- Actions -----------------------------------------------------------------

/**
 * Welcome email for a constructora user (role `admin`): tells them the
 * account exists and links to a page where they set their own password.
 * Superadmins only; also used to re-send the link.
 */
export async function sendAdminWelcomeEmailAction(userId: string): Promise<EmailResult> {
  if (!(await getSuperadmin())) return { success: false, error: "No tienes permiso para enviar este correo." };
  if (typeof userId !== "string" || !userId) return { success: false, error: "Usuario no válido." };

  const user = await getAdminUser(userId);
  if (!user?.email) return { success: false, error: "El usuario no existe o no es de una constructora." };

  const setPasswordUrl = await createSetPasswordUrl(user.email);
  if (!setPasswordUrl) return { success: false, error: "No se pudo generar el enlace para crear la contraseña." };

  return sendEmail({
    to: user.email,
    subject: `Bienvenido a ${SITE_NAME}: crea tu contraseña`,
    template: AdminWelcomeEmail({
      name: user.name || user.email,
      email: user.email,
      developerName: user.developer?.name ?? null,
      setPasswordUrl,
      expiresInHours: PASSWORD_LINK_EXPIRY_HOURS,
    }),
  });
}
