"use server";

/**
 * Every transactional email the platform sends lives here: the Resend
 * client, the sender, rendering and one Server Action per email.
 *
 * `sendEmail` is deliberately NOT exported — every exported function of a
 * "use server" file is callable from the browser, so only specific,
 * authorized actions are exposed, never a generic "send anything" endpoint.
 * Templates live in `/emails` (React Email components).
 */
import type { ReactElement } from "react";
import { render } from "react-email";
import { Resend } from "resend";

import { AdminWelcomeEmail } from "@/emails/admin-welcome-email";
import { getSuperadmin } from "@/lib/auth/dal";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getAdminUser } from "@/lib/users/admin-users";
import { createAdminClient } from "@/supabase/admin";

export type EmailResult = { success: true; id: string | null } | { success: false; error: string };

/**
 * Lifetime of password links, in hours. Must match Supabase → Authentication
 * → Email → "Email OTP Expiration" (seconds), which is what actually expires
 * the token; this value is only shown in the email.
 */
const PASSWORD_LINK_EXPIRY_HOURS = Number(process.env.AUTH_LINK_EXPIRY_HOURS) || 24;

/**
 * Sender for every email: the product's main address (its domain must be
 * verified in Resend). EMAIL_FROM overrides it per environment.
 */
const EMAIL_FROM = process.env.EMAIL_FROM || `${SITE_NAME} <alejandromejia@godelfos.co>`;

let resendClient: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

/** Renders a React Email template to HTML + plain text and sends it through Resend. */
async function sendEmail({
  to,
  subject,
  template,
}: {
  to: string;
  subject: string;
  template: ReactElement;
}): Promise<EmailResult> {
  const resend = getResend();
  if (!resend) {
    console.error("[email] RESEND_API_KEY no está configurada.");
    return { success: false, error: "El envío de correos no está configurado." };
  }

  try {
    const [html, text] = await Promise.all([render(template), render(template, { plainText: true })]);
    const { data, error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, html, text });
    if (error) {
      console.error("[email] Resend rechazó el envío:", error);
      return { success: false, error: "No se pudo enviar el correo." };
    }
    return { success: true, id: data?.id ?? null };
  } catch (error) {
    console.error("[email] Error enviando el correo:", error);
    return { success: false, error: "No se pudo enviar el correo." };
  }
}

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
