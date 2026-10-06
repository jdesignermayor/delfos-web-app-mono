import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants, Card } from "@heroui/react";
import { Plus } from "lucide-react";

import { ProjectOverview } from "@/components/dashboard/home/project-overview";
import { computeProjectStats } from "@/components/dashboard/home/project-stats";
import { createClient } from "@/supabase/server";

export const metadata: Metadata = {
  title: "Inicio",
  description: "Crecimiento de proyectos en la plataforma.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      "uuid, title, created_at, developer_id, tower_count, city, location, price, housing_type, delivery_date, typologies, additional_images, developer:developers!developer_id(name)",
    );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inicio</h1>
          <p className="mt-1 text-sm text-muted">Cómo crece la base de proyectos de Delfos.</p>
        </div>
        <Link href="/dashboard/properties/new" className={buttonVariants({ variant: "primary", size: "sm" })}>
          <Plus className="size-4" />
          Nueva propiedad
        </Link>
      </div>

      {error ? (
        <Card className="p-5">
          <p className="text-sm text-danger">No se pudieron cargar los indicadores: {error.message}</p>
        </Card>
      ) : (
        <ProjectOverview stats={computeProjectStats(data ?? [])} />
      )}
    </div>
  );
}
