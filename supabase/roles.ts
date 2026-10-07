import { cache } from "react";

import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";

/** Must match the rows seeded in the `roles` table. */
export const ROLE_NAMES = ["creator", "admin", "superadmin", "viewer"] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

/** The constructora an `admin` user belongs to. */
export type UserDeveloper = {
  id: number;
  name: string;
  isEnabled: boolean;
};

export type CurrentUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: RoleName | null;
  /** `false` once the user has been disabled in `public.users`. */
  isActive: boolean;
  /** `false` when the user signed in but has no `public.users` row. */
  hasProfile: boolean;
  developer: UserDeveloper | null;
};

/**
 * Loads a user's `public.users` profile (role and constructora).
 *
 * Row Level Security on `public.users` doesn't grant a user SELECT access
 * to their own row, so this reads the profile with the service-role client
 * instead — always scoped to an id the caller has already verified.
 */
export async function getUserProfile(authUser: { id: string; email?: string | null }): Promise<CurrentUser> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("name, email, is_active, roles(name), developer:developers!developer_id(id, name, is_enabled)")
    .eq("id", authUser.id)
    .maybeSingle();

  return {
    id: authUser.id,
    name: data?.name ?? null,
    email: data?.email ?? authUser.email ?? null,
    role: (data?.roles?.name as RoleName | undefined) ?? null,
    // Only an explicit `false` disables a user; legacy rows may still hold NULL.
    isActive: data !== null && data.is_active !== false,
    hasProfile: data !== null,
    developer: data?.developer
      ? { id: data.developer.id, name: data.developer.name, isEnabled: data.developer.is_enabled }
      : null,
  };
}

/**
 * The authenticated user's profile and role, or `null` if signed out.
 * Memoized per request, so layouts, pages and actions can all call it freely.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return getUserProfile(user);
});

/** The role of the currently authenticated user, or `null` if signed out / roleless. */
export async function getCurrentUserRole(): Promise<RoleName | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}
