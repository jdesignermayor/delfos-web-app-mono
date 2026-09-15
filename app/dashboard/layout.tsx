import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/supabase/roles";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Forecasts, revenue and alerts for your workspace.",
};

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await getCurrentUser();
  if (user?.role !== "superadmin") {
    redirect("/");
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
