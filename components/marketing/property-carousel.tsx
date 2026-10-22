"use client";

import { useRef } from "react";

import { ArrowRightIcon } from "@/components/icons";
import { PropertyCard } from "@/components/marketing/property-card";
import type { Property } from "@/components/marketing/properties";
import { TrackPropertyList } from "@/components/analytics/track-property-view";

/** Card width per breakpoint; shared with the skeleton so nothing shifts when listings arrive. */
const SLIDE_CLASS = "w-[58%] shrink-0 snap-start sm:w-[38%] lg:w-[22%] xl:w-[17%]";
/**
 * Twice the card's width: the square card crops landscape photos to fill it, so a photo fetched at
 * the card's width would come too short to cover its height and get blown up (blurry). Next never
 * serves a photo wider than its original, so small uploads cost nothing extra.
 */
const SLIDE_SIZES = "(min-width: 1280px) 34vw, (min-width: 1024px) 44vw, (min-width: 640px) 76vw, 116vw";
/** "Propiedades destacadas": much bigger cards, as tall as the viewport allows (see `PropertyCard`). */
const HIGHLIGHTED_SLIDE_CLASS = "shrink-0 snap-start";
/** The card is at most 44rem tall at 3:4, so never wider than 33rem. */
const HIGHLIGHTED_SLIDE_SIZES = "528px";
/** At most this many cards are on screen at load (xl shows 5 + a peek), so only they load eagerly. */
const EAGER_CARDS = 6;
/** How far (px) one arrow press scrolls the track — about two cards on desktop. */
const SCROLL_STEP = 600;

function CarouselArrow({ direction, onClick }: { direction: "previous" | "next"; onClick: () => void }) {
  const isPrevious = direction === "previous";
  return (
    <button
      type="button"
      aria-label={isPrevious ? "Anterior" : "Siguiente"}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-full border border-separator bg-surface text-foreground shadow-sm transition-colors hover:border-accent hover:text-accent"
    >
      <ArrowRightIcon className={`size-4 ${isPrevious ? "rotate-180" : ""}`} />
    </button>
  );
}

export function PropertyCarousel({
  title,
  properties,
  analyticsListId,
  highlighted = false,
}: {
  title: string;
  properties: Property[];
  /** When set, the list's impressions and card clicks are reported to GA4 under this id. */
  analyticsListId?: string;
  /** "Propiedades destacadas": bigger cards with the details over the photo. */
  highlighted?: boolean;
}) {
  const analyticsList = analyticsListId ? { id: analyticsListId, name: title } : undefined;
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollTrack(amount: number) {
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
          <CarouselArrow direction="previous" onClick={() => scrollTrack(-SCROLL_STEP)} />
          <CarouselArrow direction="next" onClick={() => scrollTrack(SCROLL_STEP)} />
        </div>
      </div>

      <div
        ref={trackRef}
        className={`no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto sm:gap-4 scroll-smooth pb-2 ${
          // Room for the hover ring, which the scrolling track would otherwise clip.
          highlighted ? "-mx-2 mt-4 px-2 pt-2 sm:gap-5" : "-mx-2 mt-4 px-2 pt-2"
        }`}
      >
        {properties.map((property, index) => (
          <div key={property.slug} className={highlighted ? HIGHLIGHTED_SLIDE_CLASS : SLIDE_CLASS}>
            <PropertyCard
              property={property}
              analyticsList={analyticsList}
              index={index}
              eager={index < EAGER_CARDS}
              variant={highlighted ? "highlighted" : "default"}
              playOnHover={!highlighted}
              sizes={highlighted ? HIGHLIGHTED_SLIDE_SIZES : SLIDE_SIZES}
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
      <div className="mt-6 flex gap-3 overflow-hidden pb-2 sm:gap-4">
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
