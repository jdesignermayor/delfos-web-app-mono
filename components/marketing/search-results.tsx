"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@heroui/react";

import { PropertyMap } from "@/components/marketing/property-map";
import { PropertyCard } from "@/components/marketing/property-card";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";
import type { Property } from "@/components/marketing/properties";

export function SearchResults({ results }: { results: Property[] }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  return (
    <div className="lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[1.3fr_1fr] lg:overflow-hidden">
      {/* Map */}
      <div className="hidden lg:block lg:h-full">
        <PropertyMap results={results} activeSlug={activeSlug} onActivate={setActiveSlug} />
      </div>

      {/* List */}
      <div className="lg:h-full lg:min-h-0 lg:overflow-y-auto">
        <div className="px-4 py-5 sm:px-5">
          <p className="mb-4 text-sm text-muted">
            {results.length > 0
              ? `${results.length} ${results.length === 1 ? "propiedad" : "propiedades"} en esta zona`
              : "Sin propiedades para estos filtros"}
          </p>

          {results.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {results.map((property) => (
                <PropertyCard
                  key={property.slug}
                  property={property}
                  active={property.slug === activeSlug}
                  onActivate={() => setActiveSlug(property.slug)}
                  onDeactivate={() => setActiveSlug(null)}
                />
              ))}
            </div>
          ) : (
            <div className="mx-auto flex max-w-sm flex-col items-center rounded-2xl border border-separator bg-surface p-8 text-center">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <SearchIcon />
              </span>
              <h2 className="mt-4 font-display text-base font-semibold">
                Ajusta los filtros
              </h2>
              <p className="mt-2 text-sm text-muted">
                Prueba con menos filtros o explora todo lo disponible en Medellín.
              </p>
              <Link
                href="/search?ubicacion=Medell%C3%ADn"
                className={`mt-5 ${buttonVariants({ variant: "primary", size: "sm" })}`}
              >
                Ver todo en Medellín
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
