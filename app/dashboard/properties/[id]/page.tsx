import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPropertyById } from "@/app/actions/properties";
import { PropertyDetailView } from "@/components/dashboard/properties/property-detail-view";
import { requireDashboardUser } from "@/lib/auth/dal";
import { getPropertyFormOptions } from "@/lib/data/property-form-options";

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
  const user = await requireDashboardUser();
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  // `getPropertyById` returns null for properties outside the user's constructora.
  const [property, options] = await Promise.all([
    getPropertyById(numericId),
    getPropertyFormOptions(user),
  ]);

  if (!property) notFound();

  return <PropertyDetailView property={property} {...options} />;
}
