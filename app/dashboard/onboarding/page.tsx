import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingView } from "@/components/dashboard/onboarding/onboarding-view";
import { requireDashboardUser } from "@/lib/auth/dal";
import { getOnboardingStatus } from "@/lib/onboarding";

export const metadata: Metadata = { title: "Primeros pasos" };

/**
 * First page a constructora user sees until their constructora has a
 * property (`/dashboard` sends them here): a greeting and three steps —
 * profile, fiducias, first property — each marked done from real data.
 */
export default async function OnboardingPage() {
  const user = await requireDashboardUser();
  if (user.role !== "admin") redirect("/dashboard");

  const status = await getOnboardingStatus(user);
  // Onboarding ends with the first property.
  if (status.properties.done) redirect("/dashboard");

  return (
    <OnboardingView
      status={{ ...status, profile: { ...status.profile, name: status.profile.name ?? user.name } }}
      email={user.email}
      developerName={user.developer.name}
    />
  );
}
