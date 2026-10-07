/**
 * Data Access Layer guards for Server Components and Server Actions.
 *
 * Layouts don't re-render on every navigation, so each page and action that
 * reads or writes dashboard data calls one of these itself. `getCurrentUser`
 * is memoized per request, so repeated calls are free.
 */
import { redirect } from "next/navigation";

import { canAccessDashboard, type DashboardUser } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/supabase/roles";

/** The signed-in dashboard user, or `null` — for Server Actions that return errors instead of redirecting. */
export async function getDashboardUser(): Promise<DashboardUser | null> {
  const user = await getCurrentUser();
  return canAccessDashboard(user) ? user : null;
}

/** Same as `getDashboardUser`, but only for superadmins. */
export async function getSuperadmin(): Promise<DashboardUser | null> {
  const user = await getDashboardUser();
  return user?.role === "superadmin" ? user : null;
}

/** For pages: sends anyone without dashboard access back to the home page. */
export async function requireDashboardUser(): Promise<DashboardUser> {
  const user = await getDashboardUser();
  if (!user) redirect("/");
  return user;
}

/** For superadmin-only pages: constructora admins are sent to the dashboard home. */
export async function requireSuperadmin(): Promise<DashboardUser> {
  const user = await requireDashboardUser();
  if (user.role !== "superadmin") redirect("/dashboard");
  return user;
}
