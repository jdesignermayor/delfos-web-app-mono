"use client";

import { useRef } from "react";

import { ArrowRightIcon } from "@/components/icons";
import { PropertyCard } from "@/components/marketing/property-card";
import type { Property } from "@/components/marketing/properties";
import { TrackPropertyList } from "@/components/analytics/track-property-view";

/** Card width per breakpoint; shared with the skeleton so nothing shifts when listings arrive. */
const SLIDE_CLASS = "w-[62%] shrink-0 snap-start sm:w-[38%] lg:w-[26%] xl:w-[20%]";
/** At most this many cards are on screen at load (xl shows 5 + a peek), so only they load eagerly. */
const EAGER_CARDS = 6;

export function PropertyCarousel({
  title,
  properties,
  analyticsListId,
}: {
  title: string;
  properties: Property[];
  /** When set, the list's impressions and card clicks are reported to GA4 under this id. */
  analyticsListId?: string;
}) {
  const analyticsList = analyticsListId ? { id: analyticsListId, name: title } : undefined;
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(amount: number) {
    trackRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <div>
      {analyticsList ? (
        <TrackPropertyList listId={analyticsList.id} listName={analyticsList.name} properties={properties} />
      ) : null}
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
        {properties.map((property, index) => (
          <div key={property.slug} className={SLIDE_CLASS}>
            <PropertyCard
              property={property}
              analyticsList={analyticsList}
              index={index}
              eager={index < EAGER_CARDS}
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 26vw, (min-width: 640px) 38vw, 62vw"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Placeholder while the listings stream in: same title, card size and spacing as the real carousel. */
export function PropertyCarouselSkeleton({ title }: { title: string }) {
  return (
    <div aria-busy="true" aria-label="Cargando propiedades">
      <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      <div className="mt-6 flex gap-4 overflow-hidden pb-2">
        {Array.from({ length: EAGER_CARDS }, (_, index) => (
          <div key={index} className={SLIDE_CLASS}>
            <div className="aspect-square w-full animate-pulse rounded-2xl bg-surface-secondary" />
            <div className="mt-3 h-4 w-3/4 animate-pulse rounded-full bg-surface-secondary" />
            <div className="mt-2 h-3.5 w-1/2 animate-pulse rounded-full bg-surface-secondary" />
          </div>
        ))}
      </div>
    </div>
  );
}
