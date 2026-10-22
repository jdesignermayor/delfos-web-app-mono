import "server-only";

import { PasswordResetEmail } from "@/emails/password-reset-email";
import { sendEmail, type EmailResult } from "@/lib/email/send-email";
import { createSetPasswordUrl, PASSWORD_LINK_EXPIRY_HOURS } from "@/lib/email/set-password-link";
import { SITE_NAME } from "@/lib/site";
import { createAdminClient } from "@/supabase/admin";

/**
 * Emails a reset link to `email` when it belongs to a profile. Unknown emails get nothing and
 * `null`, so the caller can answer the same either way. `email` must already be normalized.
 */
export async function sendPasswordResetEmail(email: string): Promise<EmailResult | null> {
  const { data: profile, error } = await createAdminClient()
    .from("users")
    .select("name")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  const resetUrl = await createSetPasswordUrl(email, "reset");
  if (!resetUrl) return { success: false, error: "No se pudo generar el enlace para restablecer la contraseña." };

  return sendEmail({
    to: email,
    subject: `Restablece tu contraseña de ${SITE_NAME}`,
    template: PasswordResetEmail({
      name: profile.name || email,
      resetUrl,
      expiresInHours: PASSWORD_LINK_EXPIRY_HOURS,
    }),
  });
}
