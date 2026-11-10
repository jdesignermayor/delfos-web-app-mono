import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants, Card } from "@heroui/react";
import { Building2, ChevronRight, Plus } from "lucide-react";

import { DashboardImage } from "@/components/dashboard/properties/dashboard-image";
import { requireDashboardUser } from "@/lib/auth/dal";
import type { Tables } from "@/supabase/types";
import { scopeToDeveloper } from "@/lib/auth/scope-query";
import { createClient } from "@/supabase/server";
import { ExportPropertiesButton } from "@/components/dashboard/properties/export-properties-button";
import { LocationCell } from "@/components/dashboard/properties/location-cell";
import { formatRange, typologyRanges } from "@/lib/typology-ranges";
import { projectDeliveryDate } from "@/lib/towers/delivery-date";

export const metadata: Metadata = {
  title: "Properties",
  description: "All properties in the system.",
};

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

type PropertyRow = Tables<"properties">;

function areaLabel(property: PropertyRow) {
  const { area } = typologyRanges(property.typologies);
  return area ? `${formatRange(area)} m²` : "—";
}

function deliveryLabel(property: PropertyRow) {
  const delivery = projectDeliveryDate(property.tower_details, property.tower_count);
  return delivery
    ? new Date(delivery).toLocaleDateString("es-CO", { month: "short", year: "numeric", timeZone: "UTC" })
    : "—";
}

/**
 * Phones: one tappable card per property (photo, name, the facts that matter, price) instead of
 * an 1100px table that only scrolls sideways. The table stays from `md` up.
 */
function PropertyCardList({ properties }: { properties: (PropertyRow & { developers: { name: string } | null })[] }) {
  return (
    <ul className="divide-y divide-separator md:hidden">
      {properties.map((property) => {
        const cover = property.image ?? property.additional_images?.[0] ?? null;
        const name = property.project_name || property.title;
        return (
          <li key={property.id}>
            <Link
              href={`/dashboard/properties/${property.id}`}
              className="flex items-center gap-3 px-4 py-3.5 outline-none transition-colors active:bg-surface-secondary focus-visible:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
            >
              <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface-secondary">
                {cover ? (
                  <DashboardImage src={cover} alt="" sizes="64px" />
                ) : (
                  <span className="flex size-full items-center justify-center text-muted">
                    <Building2 className="size-6" aria-hidden />
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">{name}</span>
                <span className="block truncate text-sm capitalize text-muted">
                  {[property.property_type, property.developers?.name].filter(Boolean).join(" · ") || "—"}
                </span>
                <span className="mt-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-muted">
                    {areaLabel(property)} · {deliveryLabel(property)}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-foreground">
                    {currency.format(Number(property.price))}
                  </span>
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default async function PropertiesPage() {
  const user = await requireDashboardUser();
  const supabase = await createClient();
  const { data: properties, error } = await scopeToDeveloper(
    supabase.from("properties").select("*, developers!developer_id(id, name)"),
    user,
  ).order("created_at", { ascending: false });
  const scopeLabel = user.developer ? `de ${user.developer.name}` : "en el sistema";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Propiedades</h1>
          <p className="mt-1 text-sm text-muted">
            {properties?.length ?? 0} propiedades {scopeLabel}.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <ExportPropertiesButton />
          <Link
            href="/dashboard/properties/new"
            className={`${buttonVariants({ variant: "primary", size: "sm" })} max-md:w-full`}
          >
            <Plus className="size-4" />
            Nueva propiedad
          </Link>
        </div>
      </div>

      <Card className="p-0">
        {error ? (
          <p className="p-5 text-sm text-danger">
            No se pudieron cargar las propiedades: {error.message}
          </p>
        ) : !properties || properties.length === 0 ? (
          <p className="p-5 text-sm text-muted">
            Aún no hay propiedades. Crea la primera con &ldquo;Nueva propiedad&rdquo;.
          </p>
        ) : (
          <>
          <PropertyCardList properties={properties} />
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b border-separator text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-5 py-3 font-medium">Título</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Constructora</th>
                  <th className="px-5 py-3 font-medium">Ubicación</th>
                  <th className="px-5 py-3 font-medium">Estrato</th>
                  <th className="px-5 py-3 font-medium">Área</th>
                  <th className="px-5 py-3 font-medium">Entrega</th>
                  <th className="px-5 py-3 text-right font-medium">Precio</th>
                  <th className="px-5 py-3 text-right font-medium">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator">
                {properties.map((property) => (
                  <tr key={property.id} className="hover:bg-surface-secondary/60">
                    <td className="px-5 py-3 font-medium">
                      <Link
                        href={`/dashboard/properties/${property.id}`}
                        className="hover:text-accent hover:underline"
                      >
                        {property.project_name || property.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">
                      <span className="capitalize">{property.property_type ?? "—"}</span>
                      {property.housing_type ? (
                        <span className="ml-1 text-xs text-muted">({property.housing_type})</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {property.developers?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      <LocationCell address={property.address} location={property.location} />
                    </td>
                    <td className="px-5 py-3 text-muted">{property.stratum ?? "—"}</td>
                    <td className="px-5 py-3 text-muted">{areaLabel(property)}</td>
                    <td className="px-5 py-3 text-muted">{deliveryLabel(property)}</td>
                    <td className="px-5 py-3 text-right font-medium">
                      {currency.format(Number(property.price))}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/dashboard/properties/${property.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Card>
    </div>
  );
}
