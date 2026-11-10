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
      {/* First stop for keyboard users: jump past the menu straight to the page. */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-focus"
      >
        Saltar al contenido
      </a>
      <Sidebar user={user} />

      <div className="flex min-h-full flex-col md:pl-64">
        <MobileNav user={user} />
        {/* `min-w-0` lets wide tables scroll inside their own box instead of widening the page. */}
        <main id="contenido" tabIndex={-1} className="min-w-0 flex-1 px-4 py-5 outline-none sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
