// TEMPORARY visual check — delete after screenshot.
import { ProjectOverview } from "@/components/dashboard/home/project-overview";
import { computeProjectStats } from "@/components/dashboard/home/project-stats";
import { createPublicClient } from "@/supabase/public";

export default async function Preview() {
  const { data } = await createPublicClient()
    .from("properties")
    .select("uuid, title, created_at, developer_id, tower_count, city, location, price, housing_type, delivery_date, typologies, additional_images, developer:developers!developer_id(name)");
  return (
    <div className="light min-h-screen bg-background p-8" style={{ colorScheme: "light" }}>
      <div className="mx-auto max-w-7xl"><ProjectOverview stats={computeProjectStats(data ?? [])} /></div>
    </div>
  );
}
