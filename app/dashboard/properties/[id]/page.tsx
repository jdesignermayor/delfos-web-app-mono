import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PropertyDetailView } from "@/components/dashboard/properties/property-detail-view";
import { requireDashboardUser } from "@/lib/auth/dal";
import { getDashboardProperty } from "@/lib/data/properties";
import { getPropertyFormOptions } from "@/lib/data/property-form-options";

function parseId(id: string): number | null {
  const numericId = Number(id);
  return Number.isInteger(numericId) ? numericId : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/properties/[id]">): Promise<Metadata> {
  const id = parseId((await params).id);
  // Same memoized query as the page below — no extra round trip.
  const property = id === null ? null : await getDashboardProperty(id);
  return { title: property?.title ?? "Propiedad" };
}

export default async function PropertyDetailPage({
  params,
}: PageProps<"/dashboard/properties/[id]">) {
  const user = await requireDashboardUser();
  const id = parseId((await params).id);
  if (id === null) notFound();

  // Not awaited: the edit form's select options load in parallel and stream
  // to the client, which only waits for them once "Editar" is pressed.
  const formOptionsPromise = getPropertyFormOptions(user);

  // `null` for properties outside the user's constructora.
  const property = await getDashboardProperty(id);
  if (!property) notFound();

  return <PropertyDetailView property={property} formOptionsPromise={formOptionsPromise} />;
}
