/**
 * First-run onboarding for constructora users (role `admin`): complete the
 * profile, review the fiducias, create the first property. Server-only.
 */
import type { DashboardUser } from "@/lib/auth/permissions";
import { createAdminClient } from "@/supabase/admin";

/** `auth.users.user_metadata` key set when the user confirms they reviewed their fiducias. */
export const FIDUCIAS_REVIEWED_KEY = "onboarding_fiducias_reviewed_at";

export type OnboardingStatus = {
  profile: { name: string | null; phone: string | null; avatarUrl: string | null; done: boolean };
  fiducias: { total: number; own: number; done: boolean };
  properties: { count: number; done: boolean };
  completedSteps: number;
};

/** Number of properties of the user's constructora (`null` scope = superadmin, who never onboards). */
export async function countDeveloperProperties(developerId: number): Promise<number> {
  const { count } = await createAdminClient()
    .from("properties")
    .select("uuid", { count: "exact", head: true })
    .eq("developer_id", developerId);
  return count ?? 0;
}

/** Constructora admins see the onboarding until their constructora has a property. */
export async function needsOnboarding(user: DashboardUser): Promise<boolean> {
  if (user.role !== "admin") return false;
  return (await countDeveloperProperties(user.developer.id)) === 0;
}

export async function getOnboardingStatus(user: DashboardUser & { role: "admin" }): Promise<OnboardingStatus> {
  const admin = createAdminClient();
  const developerId = user.developer.id;

  const [{ data: profile }, { data: authUser }, { data: fiducias }, propertyCount] = await Promise.all([
    admin.from("users").select("name, phone, avatar_url").eq("id", user.id).maybeSingle(),
    admin.auth.admin.getUserById(user.id),
    admin.from("trust_companies").select("developer_id").or(`developer_id.is.null,developer_id.eq.${developerId}`),
    countDeveloperProperties(developerId),
  ]);

  const name = profile?.name?.trim() || null;
  const phone = profile?.phone?.trim() || null;
  const reviewedAt = authUser?.user?.user_metadata?.[FIDUCIAS_REVIEWED_KEY];

  const status = {
    profile: { name, phone, avatarUrl: profile?.avatar_url ?? null, done: Boolean(name && phone) },
    fiducias: {
      total: fiducias?.length ?? 0,
      own: fiducias?.filter((row) => row.developer_id === developerId).length ?? 0,
      done: typeof reviewedAt === "string",
    },
    properties: { count: propertyCount, done: propertyCount > 0 },
  };
  return {
    ...status,
    completedSteps: [status.profile.done, status.fiducias.done, status.properties.done].filter(Boolean).length,
  };
}
