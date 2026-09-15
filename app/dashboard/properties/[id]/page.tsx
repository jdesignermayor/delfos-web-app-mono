import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPropertyById } from "@/app/actions/properties";
import { PropertyDetailView } from "@/components/dashboard/properties/property-detail-view";
import { createClient } from "@/supabase/server";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/properties/[id]">): Promise<Metadata> {
  const { id } = await params;
  const numericId = Number(id);
  const property = Number.isInteger(numericId) ? await getPropertyById(numericId) : null;
  return { title: property?.title ?? "Propiedad" };
}

export default async function PropertyDetailPage({
  params,
}: PageProps<"/dashboard/properties/[id]">) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const supabase = await createClient();
  const [property, developersResult] = await Promise.all([
    getPropertyById(numericId),
    supabase.from("developers").select("id, name").order("name"),
  ]);

  if (!property) notFound();

  return (
    <PropertyDetailView property={property} developers={developersResult.data ?? []} />
  );
}
