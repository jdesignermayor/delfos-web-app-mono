import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants, Card } from "@heroui/react";

import { createClient } from "@/supabase/server";

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
    .select("*, developers(id, name)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
          <p className="mt-1 text-sm text-muted">
            {properties?.length ?? 0} propiedades en el sistema.
          </p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className={buttonVariants({ variant: "primary", size: "sm" })}
        >
          Nueva propiedad
        </Link>
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
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-separator text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-5 py-3 font-medium">Título</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Constructora</th>
                  <th className="px-5 py-3 font-medium">Ubicación</th>
                  <th className="px-5 py-3 font-medium">Hab. / Baños</th>
                  <th className="px-5 py-3 font-medium">Área</th>
                  <th className="px-5 py-3 text-right font-medium">Precio</th>
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
                        {property.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted capitalize">{property.type}</td>
                    <td className="px-5 py-3 text-muted">
                      {property.developers?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {[property.neighborhood, property.city].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {property.bedrooms} / {property.bathrooms}
                    </td>
                    <td className="px-5 py-3 text-muted">{property.area} m²</td>
                    <td className="px-5 py-3 text-right font-medium">
                      {currency.format(Number(property.price))}
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
