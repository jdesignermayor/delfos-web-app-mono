import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { QueryProvider } from "@/components/providers/query-provider";
import { requireAccountUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Forecasts, revenue and alerts for your workspace.",
};

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  // Each page checks its own access; viewers only reach the home and their profile.
  const user = await requireAccountUser();

  return (
    <QueryProvider userId={user.id}>
      <DashboardShell user={user}>{children}</DashboardShell>
    </QueryProvider>
  );
}
