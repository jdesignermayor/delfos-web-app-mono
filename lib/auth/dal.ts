/**
 * Data Access Layer guards for Server Components and Server Actions.
 *
 * Layouts don't re-render on every navigation, so each page and action that
 * reads or writes dashboard data calls one of these itself. `getCurrentUser`
 * is memoized per request, so repeated calls are free.
 */
import { redirect } from "next/navigation";

import {
  canAccessAccount,
  canAccessDashboard,
  type AccountUser,
  type DashboardUser,
} from "@/lib/auth/permissions";
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

/** Any signed-in user with an account area (viewers included), or `null`. */
export async function getAccountUser(): Promise<AccountUser | null> {
  const user = await getCurrentUser();
  return canAccessAccount(user) ? user : null;
}

/** For the pages every account shares (home, profile): sends signed-out visitors to the home page. */
export async function requireAccountUser(): Promise<AccountUser> {
  const user = await getAccountUser();
  if (!user) redirect("/");
  return user;
}

/** For dashboard pages: viewers go back to their account home, everyone else to the home page. */
export async function requireDashboardUser(): Promise<DashboardUser> {
  const user = await getCurrentUser();
  if (canAccessDashboard(user)) return user;
  redirect(canAccessAccount(user) ? "/dashboard" : "/");
}

/** For superadmin-only pages: constructora admins are sent to the dashboard home. */
export async function requireSuperadmin(): Promise<DashboardUser> {
  const user = await requireDashboardUser();
  if (user.role !== "superadmin") redirect("/dashboard");
  return user;
}
