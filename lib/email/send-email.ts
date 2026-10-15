import "server-only";

/**
 * The Resend client, the sender and `sendEmail`, shared by every transactional email. Kept out of
 * "use server" files on purpose: nothing here may become a browser-callable "send anything" action.
 */
import type { ReactElement } from "react";
import { render } from "react-email";
import { Resend } from "resend";

import { SITE_NAME } from "@/lib/site";

export type EmailResult = { success: true; id: string | null } | { success: false; error: string };

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
export async function sendEmail({
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
