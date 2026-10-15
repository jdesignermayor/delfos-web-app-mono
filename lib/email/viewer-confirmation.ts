import "server-only";

import { ViewerConfirmEmail } from "@/emails/viewer-confirm-email";
import { sendEmail, type EmailResult } from "@/lib/email/send-email";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/** Shown in the email only; Supabase → Auth → "Email OTP Expiration" is what expires the token. */
const CONFIRM_LINK_EXPIRY_HOURS = Number(process.env.AUTH_LINK_EXPIRY_HOURS) || 24;

/** Emails a new viewer the one-time link to `/auth/confirm`. */
export function sendViewerConfirmationEmail(input: { email: string; name: string; tokenHash: string }): Promise<EmailResult> {
  const params = new URLSearchParams({ token_hash: input.tokenHash, type: "signup" });
  return sendEmail({
    to: input.email,
    subject: `Confirma tu correo en ${SITE_NAME}`,
    template: ViewerConfirmEmail({
      name: input.name,
      confirmUrl: `${SITE_URL}/auth/confirm?${params}`,
      expiresInHours: CONFIRM_LINK_EXPIRY_HOURS,
    }),
  });
}
