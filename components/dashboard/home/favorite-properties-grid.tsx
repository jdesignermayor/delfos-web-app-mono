"use client";

import Link from "next/link";

import { useFavorites } from "@/components/marketing/favorites-provider";
import { PropertyCard } from "@/components/marketing/property-card";
import type { Property } from "@/components/marketing/properties";

/** The viewer's saved properties; a card un-hearted here leaves the grid right away. */
export function FavoritePropertiesGrid({ properties }: { properties: Property[] }) {
  const favorites = useFavorites();
  // Until the shared list loads, trust the server-rendered one.
  const visible =
    favorites?.status === "ready"
      ? properties.filter((property) => property.uuid && favorites.isFavorite(property.uuid))
      : properties;

  if (visible.length === 0) return <EmptyFavorites />;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {visible.map((property, index) => (
        <PropertyCard
          key={property.slug}
          property={property}
          eager={index < 4}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      ))}
    </div>
  );
}

function EmptyFavorites() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-separator px-6 py-16 text-center">
      <p className="font-semibold">Aún no tienes propiedades favoritas</p>
      <p className="mt-1 max-w-sm text-sm text-muted">
        Toca el corazón en cualquier propiedad para guardarla y encontrarla aquí.
      </p>
      <Link href="/search" className="mt-5 text-sm font-semibold text-accent hover:underline">
        Explorar propiedades
      </Link>
    </div>
  );
}
