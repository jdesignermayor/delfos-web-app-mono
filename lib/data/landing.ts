import { cache } from "react";

import { PROPERTIES, type Property, type PropertyType } from "@/components/marketing/properties";
import { PROPERTIES_CACHE_TAG } from "@/lib/cache-tags";
import { createPublicClient } from "@/supabase/public";

export type LandingStats = {
  count: number;
  /** Lowest listed price in COP; 0 when no listing has a price. */
  minPrice: number;
  /** Earliest and latest delivery years, or null when no listing has a date. */
  deliveryYears: [number, number] | null;
};

const CARD_TYPES: PropertyType[] = ["apartamento", "casa", "apartaestudio", "proyecto"];
const FEATURED_LIMIT = 12;

function deliveryYear(deliveryDate: string | null): number | null {
  return deliveryDate ? Number(deliveryDate.slice(0, 4)) : null;
}

function minMax(values: number[]): [number, number] | null {
  return values.length ? [Math.min(...values), Math.max(...values)] : null;
}

/**
 * Live numbers for the landing's description, from the same cached query as the listings.
 * Memoized per request so metadata and any section reading it share one query.
 */
export const getLandingStats = cache(async (): Promise<LandingStats | null> => {
  const { data } = await createPublicClient({ revalidate: 3600, tags: [PROPERTIES_CACHE_TAG] })
    .from("properties")
    .select("price, delivery_date");
  if (!data?.length) return null;

  const prices = data.map((row) => Number(row.price)).filter((price) => price > 0);
  const years = data.map((row) => deliveryYear(row.delivery_date)).filter((year) => year !== null);

  return {
    count: data.length,
    minPrice: prices.length ? Math.min(...prices) : 0,
    deliveryYears: minMax(years),
  };
});

type FeaturedRow = {
  id: number;
  uuid: string;
  title: string;
  image: string | null;
  price: number | string;
  property_type: string | null;
  seo: unknown;
};

/** The SEO slug when set, so cards link to (and Google sees) the canonical URL. */
function canonicalSlug(row: Pick<FeaturedRow, "uuid" | "seo">): string {
  const seo = row.seo as { google?: { slug?: string } } | null;
  return seo?.google?.slug?.trim() || row.uuid;
}

function toCardType(propertyType: string | null): PropertyType {
  return CARD_TYPES.find((type) => type === propertyType) ?? "apartamento";
}

/** Maps a DB row to the subset of `Property` a carousel card renders. */
function toFeaturedProperty(row: FeaturedRow): Property {
  return {
    slug: canonicalSlug(row),
    title: row.title,
    image: row.image ?? undefined,
    price: Number(row.price),
    operation: "comprar",
    type: toCardType(row.property_type),
    hue: (row.id * 47) % 360,
    neighborhood: "",
    city: "",
    affordable: false,
    status: "Listo para estrenar",
  };
}

/**
 * Newest listings for the landing carousel — only what a card shows, not descriptions,
 * typologies or sales-room data. Falls back to the sample catalogue when the DB is empty.
 */
export async function getFeaturedProperties(): Promise<Property[]> {
  const { data, error } = await createPublicClient({ revalidate: 300, tags: [PROPERTIES_CACHE_TAG] })
    .from("properties")
    .select("id, uuid, title, image, price, property_type, seo")
    .order("created_at", { ascending: false })
    .limit(FEATURED_LIMIT);

  if (error || !data?.length) return PROPERTIES;
  return data.map(toFeaturedProperty);
}
