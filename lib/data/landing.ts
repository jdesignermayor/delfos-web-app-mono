import { cache } from "react";

import { PROPERTIES, type Property, type PropertyType } from "@/components/marketing/properties";
import { LISTING_SUMMARY_SELECT, listingSummary, type ListingSummaryRow } from "@/components/marketing/property-adapter";
import { PROPERTIES_CACHE_TAG } from "@/lib/cache-tags";
import { youtubeId } from "@/lib/property-seo";
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
const HIGHLIGHTED_LIMIT = 12;

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

/** Most photos a carousel card cycles through. */
const CARD_IMAGE_LIMIT = 6;

type FeaturedRow = ListingSummaryRow & {
  id: number;
  uuid: string;
  title: string;
  additional_images: string[] | null;
  image: string | null;
  price: number | string;
  property_type: string | null;
  seo: unknown;
};

/** The SEO slug when set, so cards link to (and Google sees) the canonical URL. */
type CardSeo = { google?: { slug?: string }; youtube?: { videoUrl?: string } } | null;

function canonicalSlug(row: Pick<FeaturedRow, "uuid" | "seo">): string {
  const seo = row.seo as CardSeo;
  return seo?.google?.slug?.trim() || row.uuid;
}

/** The project's YouTube video id from its SEO step, if it has one. */
function cardVideoId(row: Pick<FeaturedRow, "seo">): string | undefined {
  return youtubeId((row.seo as CardSeo)?.youtube?.videoUrl) ?? undefined;
}

function toCardType(propertyType: string | null): PropertyType {
  return CARD_TYPES.find((type) => type === propertyType) ?? "apartamento";
}

/** Photos the card's slideshow cycles through; capped, since a card only shows a few. */
function cardImages(row: FeaturedRow): string[] | undefined {
  if (!row.additional_images?.length) return undefined;
  return [row.image, ...row.additional_images].filter((src): src is string => Boolean(src)).slice(0, CARD_IMAGE_LIMIT);
}

/** Maps a DB row to the subset of `Property` a carousel card renders. */
function toFeaturedProperty(row: FeaturedRow): Property {
  return {
    slug: canonicalSlug(row),
    uuid: row.uuid,
    title: row.title,
    image: row.image ?? undefined,
    images: cardImages(row),
    price: Number(row.price),
    operation: "comprar",
    type: toCardType(row.property_type),
    hue: (row.id * 47) % 360,
    videoId: cardVideoId(row),
    ...listingSummary(row),
  };
}

/**
 * Newest listings for the landing carousel — only what a card shows, not descriptions,
 * typologies or sales-room data. Falls back to the sample catalogue when the DB is empty.
 */
export async function getFeaturedProperties(): Promise<Property[]> {
  const { data, error } = await cardsQuery().limit(FEATURED_LIMIT);

  if (error || !data?.length) return PROPERTIES;
  return data.map(toFeaturedProperty);
}

/**
 * Properties marked "Propiedad destacada" in the dashboard (`properties.is_featured`), newest
 * first, for the landing's "Propiedades destacadas". Empty when none is marked.
 */
export async function getHighlightedProperties(): Promise<Property[]> {
  const { data, error } = await cardsQuery().eq("is_featured", true).limit(HIGHLIGHTED_LIMIT);
  return error || !data ? [] : data.map(toFeaturedProperty);
}

/** Newest listings with only the columns a card needs; cached and refreshed when a property is saved. */
function cardsQuery() {
  return createPublicClient({ revalidate: 300, tags: [PROPERTIES_CACHE_TAG] })
    .from("properties")
    .select(`id, uuid, title, image, additional_images, price, property_type, seo, ${LISTING_SUMMARY_SELECT}`)
    .order("created_at", { ascending: false });
}
