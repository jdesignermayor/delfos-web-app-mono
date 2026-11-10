import { MobileNav, Sidebar } from "@/components/dashboard/sidebar";
import type { CurrentUser } from "@/supabase/roles";

/**
 * Dashboard frame. From `md` up: the fixed 16rem sidebar. On phones: a top bar with a slide-in
 * menu, so the page gets the full width. `data-dashboard` scopes the phone-sized (44px) buttons
 * in globals.css to the dashboard.
 */
export function DashboardShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div data-dashboard className="min-h-full bg-background">
      <Sidebar user={user} />

      <div className="flex min-h-full flex-col md:pl-64">
        <MobileNav user={user} />
        {/* `min-w-0` lets wide tables scroll inside their own box instead of widening the page. */}
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
