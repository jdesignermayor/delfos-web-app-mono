import "server-only";

import { createAdminClient } from "@/supabase/admin";
import type { RoleName } from "@/supabase/roles";

/**
 * `public.users` / `roles` reads and writes behind sign-up. Uses the service-role client, so RLS
 * can't hide a match — callers must only pass ids and emails they have already validated.
 */

/** Whether a profile already uses this (normalized) email. */
export async function isEmailRegistered(email: string): Promise<boolean> {
  const { data, error } = await createAdminClient().from("users").select("id").eq("email", email).maybeSingle();
  if (error) throw error;
  return data !== null;
}

/** The `roles.id` seeded for `name`, or `null` when it's missing. */
export async function findRoleId(name: RoleName): Promise<string | null> {
  const { data, error } = await createAdminClient().from("roles").select("id").eq("name", name).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

/** Creates (or completes) the profile row for a freshly signed-up auth user. */
export async function saveUserProfile(profile: {
  id: string;
  email: string;
  name: string;
  phone: string;
  roleId: string;
}): Promise<void> {
  const { error } = await createAdminClient()
    .from("users")
    .upsert(
      { id: profile.id, email: profile.email, name: profile.name, phone: profile.phone, role_id: profile.roleId },
      { onConflict: "id" },
    );
  if (error) throw error;
}

export type PendingSignUp = { status: "created"; userId: string; tokenHash: string } | { status: "exists" };

/**
 * Creates an unconfirmed auth user and its one-time confirmation token, without Supabase sending
 * its own email: the app emails the link itself (Resend), like every other transactional email.
 */
export async function createUnconfirmedUser(input: {
  email: string;
  password: string;
  metadata: Record<string, string>;
}): Promise<PendingSignUp> {
  const { data, error } = await createAdminClient().auth.admin.generateLink({
    type: "signup",
    email: input.email,
    password: input.password,
    options: { data: input.metadata },
  });
  if (error?.code === "email_exists" || error?.code === "user_already_exists") return { status: "exists" };
  if (error) throw error;

  const tokenHash = data.properties?.hashed_token;
  if (!data.user || !tokenHash) throw new Error("Supabase no devolvió el enlace de confirmación.");
  return { status: "created", userId: data.user.id, tokenHash };
}

/**
 * A fresh confirmation token for an account that signed up but never confirmed its email, so
 * signing up again re-sends the link. `null` for confirmed or unknown emails: nothing to send.
 */
export async function createTokenForUnconfirmedUser(email: string): Promise<{ tokenHash: string; name: string } | null> {
  const admin = createAdminClient();
  const { data: profile } = await admin.from("users").select("id, name").eq("email", email).maybeSingle();
  if (!profile) return null;

  const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
  if (!authUser.user || authUser.user.email_confirmed_at) return null;

  // A magic-link token verifies as type "email" too, and confirms the address when used.
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) return null;
  return { tokenHash, name: profile.name ?? email };
}

/** Removes an auth user whose profile couldn't be saved, so the email can sign up again. */
export async function deleteAuthUser(id: string): Promise<void> {
  await createAdminClient().auth.admin.deleteUser(id);
}
