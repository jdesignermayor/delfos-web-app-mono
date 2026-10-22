"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronUp } from "lucide-react";

import { PropertyCard } from "@/components/marketing/property-card";
import type { ReelMode } from "@/components/marketing/reel-media";
import type { Property } from "@/components/marketing/properties";

type AnalyticsList = { id: string; name: string };

/** Space between reels (`gap-3`), so the active one can be worked out from the scroll position. */
const REEL_GAP_PX = 12;
/** Share of the feed that must be on screen before its reel plays. */
const VISIBLE_RATIO = 0.6;
/** How far below (or above) the screen the feed may still be when its first video starts loading. */
const NEAR_MARGIN = "100% 0px";

/** Whether `ref`'s element is mostly on screen (`ratio`), optionally counting a margin around it. */
function useIsOnScreen(ref: React.RefObject<HTMLElement | null>, { ratio, rootMargin }: { ratio: number; rootMargin?: string }) {
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting && entry.intersectionRatio >= ratio), {
      threshold: [0, ratio, 1],
      rootMargin,
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, ratio, rootMargin]);
  return onScreen;
}

const noopSubscribe = () => () => {};

/**
 * Whether the visitor asked to save data (Data Saver / Lite mode) or is on a 2G-like connection.
 * Only Chromium browsers report it; elsewhere (e.g. iOS Safari) this is always false.
 */
function useSavesData() {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
        .connection;
      return Boolean(connection?.saveData) || /2g/.test(connection?.effectiveType ?? "");
    },
    () => false,
  );
}

/**
 * Phones' "Propiedades destacadas": a TikTok-style vertical feed. Each project fills the player
 * and a swipe up snaps to the next one; the side dots and the counter show where you are. Only the
 * reel on screen plays (its video and photos, swiped sideways like Instagram), and only while the
 * feed itself is on screen; the ones just above and below preload their video, the rest stay idle.
 */
export function HighlightedReels({
  title,
  properties,
  analyticsList,
}: {
  title: string;
  properties: Property[];
  /** Card clicks are reported to GA4 under this list (impressions are tracked by the section). */
  analyticsList?: AnalyticsList;
}) {
  const feedRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const feedOnScreen = useIsOnScreen(feedRef, { ratio: VISIBLE_RATIO });
  // Scrolling towards the feed: its current reel's player starts loading before it's seen.
  const feedNearScreen = useIsOnScreen(feedRef, { ratio: 0, rootMargin: NEAR_MARGIN });
  const savesData = useSavesData();
  const count = properties.length;

  function reelMode(index: number): ReelMode {
    // Saving data: a video only loads once its reel is on screen; nothing is preloaded.
    if (savesData) return feedOnScreen && index === active ? "active" : "idle";
    if (!feedOnScreen) return feedNearScreen && index === active ? "preload" : "idle";
    if (index === active) return "active";
    // Both neighbours stay warm, so swiping either way starts at once.
    return Math.abs(index - active) === 1 ? "preload" : "idle";
  }

  function trackActiveReel() {
    const feed = feedRef.current;
    if (!feed) return;
    setActive(Math.min(count - 1, Math.round(feed.scrollTop / (feed.clientHeight + REEL_GAP_PX))));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
        {count > 1 ? (
          <span className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-semibold tabular-nums text-foreground">
            {active + 1} / {count}
          </span>
        ) : null}
      </div>

      <div className="relative mt-3">
        <div
          ref={feedRef}
          onScroll={trackActiveReel}
          aria-label={`${title}: desliza hacia arriba para ver el siguiente proyecto`}
          // The viewport minus the sticky mobile header (~4.5rem), the section title (~3.25rem), the
          // swipe hint below (~1.5rem) and the bottom tab bar (4rem + safe area), so the whole reel —
          // details and hint included — fits on screen once the section reaches the top.
          className="no-scrollbar flex h-[clamp(20rem,calc(100svh-13.75rem-env(safe-area-inset-bottom)),40rem)] snap-y snap-mandatory flex-col gap-3 overflow-y-auto rounded-2xl"
        >
          {properties.map((property, index) => (
            <div key={property.slug} className="h-full shrink-0 snap-start snap-always">
              <PropertyCard
                property={property}
                variant="reel"
                reelMode={reelMode(index)}
                eager={index === 0}
                sizes="100vw"
                analyticsList={analyticsList}
                index={index}
              />
            </div>
          ))}
        </div>

        {count > 1 ? (
          <div aria-hidden className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-1.5">
            {properties.map((property, index) => (
              <span
                key={property.slug}
                className={`w-1.5 rounded-full bg-white shadow transition-all duration-300 ${
                  index === active ? "h-5 opacity-100" : "h-1.5 opacity-60"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>

      {count > 1 ? (
        <p className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-muted">
          <ChevronUp className={`size-4 ${active < count - 1 ? "animate-bounce" : "opacity-0"}`} />
          {active < count - 1 ? "Desliza hacia arriba para ver más proyectos" : "Viste todos los destacados"}
        </p>
      ) : null}
    </div>
  );
}
