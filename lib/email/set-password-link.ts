import "server-only";

import { SITE_URL } from "@/lib/site";
import { createAdminClient } from "@/supabase/admin";

/**
 * Lifetime of password links, in hours. Must match Supabase → Authentication
 * → Email → "Email OTP Expiration" (seconds), which is what actually expires
 * the token; this value is only shown in the email.
 */
export const PASSWORD_LINK_EXPIRY_HOURS = Number(process.env.AUTH_LINK_EXPIRY_HOURS) || 24;

/** Why the link was sent: only changes the copy of `/auth/set-password`. */
export type SetPasswordFlow = "welcome" | "reset";

/**
 * One-time link to `/auth/set-password`. Supabase creates a recovery token
 * (without sending its own email) and we point it at our page, which
 * exchanges it for a session only when the form is submitted.
 */
export async function createSetPasswordUrl(email: string, flow: SetPasswordFlow = "welcome"): Promise<string | null> {
  const { data, error } = await createAdminClient().auth.admin.generateLink({ type: "recovery", email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    console.error("[email] No se pudo generar el enlace de contraseña:", error);
    return null;
  }
  const params = new URLSearchParams({ token_hash: tokenHash, type: "recovery" });
  if (flow === "reset") params.set("flow", "reset");
  return `${SITE_URL}/auth/set-password?${params}`;
}
