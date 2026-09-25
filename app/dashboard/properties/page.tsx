import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants, Card } from "@heroui/react";
import { Plus } from "lucide-react";

import { createClient } from "@/supabase/server";
import { ExportPropertiesButton } from "@/components/dashboard/properties/export-properties-button";
import { LocationCell } from "@/components/dashboard/properties/location-cell";

export const metadata: Metadata = {
  title: "Properties",
  description: "All properties in the system.",
};

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default async function PropertiesPage() {
  const supabase = await createClient();
  const { data: properties, error } = await supabase
    .from("properties")
    .select("*, developers!developer_id(id, name)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Propiedades</h1>
          <p className="mt-1 text-sm text-muted">
            {properties?.length ?? 0} propiedades en el sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportPropertiesButton />
          <Link
            href="/dashboard/properties/new"
            className={buttonVariants({ variant: "primary", size: "sm" })}
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
          <div className="overflow-x-auto">
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
                    <td className="px-5 py-3 text-muted">{property.area} m²</td>
                    <td className="px-5 py-3 text-muted">
                      {property.delivery_date
                        ? new Date(property.delivery_date).toLocaleDateString("es-CO", {
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
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
        )}
      </Card>
    </div>
  );
}
