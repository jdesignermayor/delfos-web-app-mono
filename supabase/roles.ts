import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";

/** Must match the rows seeded in the `roles` table. */
export const ROLE_NAMES = ["creator", "admin", "superadmin", "viewer"] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

export type CurrentUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: RoleName | null;
};

/** The authenticated user's profile and role, or `null` if signed out. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Row Level Security on `public.users` doesn't grant a user SELECT access
  // to their own row, so this reads the profile with the service-role client
  // instead — scoped to the caller's own verified id, never anything else.
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("name, email, roles(name)")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    name: data?.name ?? null,
    email: data?.email ?? user.email ?? null,
    role: (data?.roles?.name as RoleName | undefined) ?? null,
  };
}

/** The role of the currently authenticated user, or `null` if signed out / roleless. */
export async function getCurrentUserRole(): Promise<RoleName | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}
