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
import { createSetPasswordUrl, PASSWORD_LINK_EXPIRY_HOURS } from "@/lib/email/set-password-link";
import { SITE_NAME } from "@/lib/site";
import { getAdminUser } from "@/lib/users/admin-users";

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
