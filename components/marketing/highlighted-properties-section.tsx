import { Suspense } from "react";

import { HighlightedReels } from "@/components/marketing/highlighted-reels";
import { PropertyCarousel } from "@/components/marketing/property-carousel";
import { getHighlightedProperties } from "@/lib/data/landing";

const TITLE = "Propiedades destacadas";
const ANALYTICS_LIST_ID = "landing_highlighted";

async function HighlightedListings() {
  const properties = await getHighlightedProperties();
  if (!properties.length) return null;

  return (
    <section className="mx-auto w-full max-w-[100rem] bg-white px-4 pt-3 sm:px-6 md:pt-6">
      {/* Larger screens: a carousel of big cards. It also reports the list's impressions, once. */}
      <div className="hidden md:block">
        <PropertyCarousel title={TITLE} properties={properties} analyticsListId={ANALYTICS_LIST_ID} highlighted />
      </div>
      {/* Phones: a TikTok-style vertical feed, one project per screen. */}
      <div className="md:hidden">
        <HighlightedReels title={TITLE} properties={properties} analyticsList={{ id: ANALYTICS_LIST_ID, name: TITLE }} />
      </div>
    </section>
  );
}

/**
 * Listings marked "Propiedad destacada" in the dashboard, above the newest ones. Renders nothing
 * while none is marked, so it never leaves an empty block on the page.
 */
export function HighlightedPropertiesSection() {
  return (
    <Suspense fallback={null}>
      <HighlightedListings />
    </Suspense>
  );
}
