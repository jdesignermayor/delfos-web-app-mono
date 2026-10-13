import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { QueryProvider } from "@/components/providers/query-provider";
import { requireDashboardUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Forecasts, revenue and alerts for your workspace.",
};

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireDashboardUser();

  return (
    <QueryProvider userId={user.id}>
      <DashboardShell user={user}>{children}</DashboardShell>
    </QueryProvider>
  );
}
