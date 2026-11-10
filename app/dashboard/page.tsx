import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { buttonVariants, Card } from "@heroui/react";
import { CircleAlert, Plus } from "lucide-react";

import { RefreshButton } from "@/components/dashboard/refresh-button";
import { ProjectOverview, ProjectOverviewSkeleton } from "@/components/dashboard/home/project-overview";
import { computeProjectStats } from "@/components/dashboard/home/project-stats";
import { ViewerHome } from "@/components/dashboard/home/viewer-home";
import { requireAccountUser } from "@/lib/auth/dal";
import type { DashboardUser } from "@/lib/auth/permissions";
import { scopeToDeveloper } from "@/lib/auth/scope-query";
import { needsOnboarding } from "@/lib/onboarding";
import { createClient } from "@/supabase/server";

export const metadata: Metadata = {
  title: "Inicio",
  description: "Crecimiento de proyectos en la plataforma.",
};

/** The indicators: the only slow part of the page, so it streams in behind a same-shaped skeleton. */
async function Overview({ user }: { user: DashboardUser }) {
  const supabase = await createClient();
  const { data, error } = await scopeToDeveloper(
    supabase
      .from("properties")
      .select(
        "uuid, title, image, created_at, developer_id, tower_count, city, location, price, housing_type, tower_details, typologies, additional_images, developer:developers!developer_id(name)",
      ),
    user,
  );

  if (error) {
    return (
      <Card role="alert" className="flex flex-col items-center gap-3 rounded-3xl px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <CircleAlert className="size-6" aria-hidden />
        </span>
        <div>
          <p className="font-semibold text-foreground">No se pudieron cargar los indicadores</p>
          <p className="mt-1 max-w-md text-sm text-muted">{error.message}</p>
        </div>
        <RefreshButton />
      </Card>
    );
  }

  return <ProjectOverview stats={computeProjectStats(data ?? [])} />;
}

export default async function DashboardPage() {
  const user = await requireAccountUser();
  if (user.role === "viewer") return <ViewerHome userId={user.id} name={user.name} />;
  // A constructora without properties starts at the onboarding guide.
  if (await needsOnboarding(user)) redirect("/dashboard/onboarding");

  const firstName = user.name?.split(" ")[0];
  const subtitle = user.developer
    ? `Cómo crecen los proyectos de ${user.developer.name} en Delfos.`
    : "Cómo crece la base de proyectos de Delfos.";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {firstName ? `Hola, ${firstName}` : "Inicio"}
          </h1>
          <p className="mt-1 text-sm text-muted sm:text-base">{subtitle}</p>
        </div>
        <Link href="/dashboard/properties/new" className={`${buttonVariants({ variant: "primary", size: "md" })} max-md:w-full`}>
          <Plus className="size-4" aria-hidden />
          Nueva propiedad
        </Link>
      </div>

      <Suspense fallback={<ProjectOverviewSkeleton />}>
        <Overview user={user} />
      </Suspense>
    </div>
  );
}
