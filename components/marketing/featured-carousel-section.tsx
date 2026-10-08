import { Suspense } from "react";

import { PropertyCarousel, PropertyCarouselSkeleton } from "@/components/marketing/property-carousel";
import { JsonLd } from "@/components/seo/json-ld";
import { getFeaturedProperties } from "@/lib/data/landing";
import { buildPropertyListJsonLd } from "@/lib/landing-seo";

const TITLE = "Explora propiedades en Medellín";

async function FeaturedCarousel() {
  const properties = await getFeaturedProperties();
  return (
    <>
      <JsonLd data={buildPropertyListJsonLd(TITLE, properties)} />
      <PropertyCarousel title={TITLE} properties={properties} analyticsListId="landing_featured" />
    </>
  );
}

/** Streams in: the rest of the landing renders immediately while the listings load. */
export function FeaturedCarouselSection() {
  return (
    <section className="mx-auto w-full max-w-[100rem] bg-white px-4 py-14 sm:px-6">
      <Suspense fallback={<PropertyCarouselSkeleton title={TITLE} />}>
        <FeaturedCarousel />
      </Suspense>
    </section>
  );
}
