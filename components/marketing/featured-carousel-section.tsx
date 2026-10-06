import { Suspense } from "react";

import { PropertyCarousel, PropertyCarouselSkeleton } from "@/components/marketing/property-carousel";
import { PROPERTIES, type Property, type PropertyType } from "@/components/marketing/properties";
import { JsonLd } from "@/components/seo/json-ld";
import { PROPERTIES_CACHE_TAG } from "@/lib/cache-tags";
import { SITE_URL } from "@/lib/site";
import { createPublicClient } from "@/supabase/public";

const TITLE = "Explora propiedades en Medellín";

const CARD_TYPES: PropertyType[] = ["apartamento", "casa", "apartaestudio", "proyecto"];

/** Only what a carousel card shows — not descriptions, typologies or sales-room data. */
async function getFeaturedProperties(): Promise<Property[]> {
  const { data, error } = await createPublicClient({ revalidate: 300, tags: [PROPERTIES_CACHE_TAG] })
    .from("properties")
    .select("id, uuid, title, image, price, property_type, seo")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error || !data || data.length === 0) return PROPERTIES;
  return data.map((row) => ({
    // The SEO slug when set, so cards link to (and Google sees) the canonical URL.
    slug: (row.seo as { google?: { slug?: string } } | null)?.google?.slug?.trim() || row.uuid,
    title: row.title,
    image: row.image,
    price: Number(row.price),
    operation: "comprar",
    type: CARD_TYPES.find((type) => type === row.property_type) ?? "apartamento",
    hue: (row.id * 47) % 360,
    neighborhood: "",
    city: "",
    affordable: false,
    status: "Listo para estrenar",
  }));
}

async function FeaturedCarousel() {
  const properties = await getFeaturedProperties();
  return (
    <>
      {/* Lists the featured properties for search engines, linking the landing to each detail page. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: TITLE,
          itemListElement: properties.map((property, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${SITE_URL}/propiedades/${property.slug}`,
            name: property.title,
            image: property.image,
          })),
        }}
      />
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
