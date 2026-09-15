"use client";

import { useRef } from "react";

import { ArrowRightIcon } from "@/components/icons";
import { PropertyCard } from "@/components/marketing/property-card";
import type { Property } from "@/components/marketing/properties";

export function PropertyCarousel({
  title,
  properties,
}: {
  title: string;
  properties: Property[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(amount: number) {
    trackRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h2>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => scrollBy(-600)}
            className="flex size-9 items-center justify-center rounded-full border border-separator bg-surface text-foreground shadow-sm transition-colors hover:border-accent hover:text-accent"
          >
            <ArrowRightIcon className="size-4 rotate-180" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => scrollBy(600)}
            className="flex size-9 items-center justify-center rounded-full border border-separator bg-surface text-foreground shadow-sm transition-colors hover:border-accent hover:text-accent"
          >
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
      >
        {properties.map((property) => (
          <div
            key={property.slug}
            className="w-[38%] shrink-0 snap-start sm:w-[26%] lg:w-[18%] xl:w-[14%]"
          >
            <PropertyCard property={property} />
          </div>
        ))}
      </div>
    </div>
  );
}
