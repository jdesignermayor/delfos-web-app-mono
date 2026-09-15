import { Sidebar } from "@/components/dashboard/sidebar";
import type { CurrentUser } from "@/supabase/roles";

export function DashboardShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-background">
      <Sidebar user={user} />

      <div className="flex min-h-full flex-col pl-64">
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
