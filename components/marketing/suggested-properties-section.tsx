import Link from "next/link";
import { buttonVariants } from "@heroui/react";

import { ArrowRightIcon } from "@/components/icons";
import { PropertyCard } from "@/components/marketing/property-card";
import { PROPERTIES } from "@/components/marketing/properties";

const SUGGESTED = PROPERTIES.slice(0, 6);

export function SuggestedPropertiesSection() {
  return (
    <section id="proyectos" className="border-y border-separator bg-surface-secondary">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="text-sm font-medium text-accent">Destacados</span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Propiedades sugeridas en Medellín
            </h2>
            <p className="mt-4 text-lg text-muted">
              Una selección de proyectos y usados en los barrios con más
              demanda del Valle de Aburrá.
            </p>
          </div>
          <Link
            href="/search?ubicacion=Medell%C3%ADn"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Ver todo en Medellín
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SUGGESTED.map((property) => (
            <PropertyCard key={property.slug} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
}
