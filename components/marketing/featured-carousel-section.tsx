import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";

import { PropertyCarousel, PropertyCarouselSkeleton } from "@/components/marketing/property-carousel";
import { PROPERTIES, type Property, type PropertyType } from "@/components/marketing/properties";
import { PROPERTIES_CACHE_TAG } from "@/lib/cache-tags";
import type { Database } from "@/supabase/types";

const TITLE = "Explora propiedades en Medellín";

/**
 * Anon client whose requests go through Next's data cache: the landing's
 * listings are public and change rarely, so they're refreshed every 5 minutes
 * (or right away when a property is saved) instead of on every visit.
 */
function createCachedPublicClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 300, tags: [PROPERTIES_CACHE_TAG] } }),
    },
  });
}

const CARD_TYPES: PropertyType[] = ["apartamento", "casa", "apartaestudio", "proyecto"];

/** Only what a carousel card shows — not descriptions, typologies or sales-room data. */
async function getFeaturedProperties(): Promise<Property[]> {
  const { data, error } = await createCachedPublicClient()
    .from("properties")
    .select("id, uuid, title, image, price, property_type")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error || !data || data.length === 0) return PROPERTIES;
  return data.map((row) => ({
    slug: row.uuid,
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
  return <PropertyCarousel title={TITLE} properties={properties} />;
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
