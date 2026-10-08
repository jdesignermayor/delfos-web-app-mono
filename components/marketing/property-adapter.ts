import { cache } from "react";

import type {
  Property,
  PropertyDetails,
  PropertySeo,
  PropertyType,
  Tower,
  Typology,
} from "@/components/marketing/properties";
import { createPublicClient } from "@/supabase/public";
import { PROPERTIES_CACHE_TAG } from "@/lib/cache-tags";
import type { Json, Tables } from "@/supabase/types";
import { parseAmenities } from "@/lib/amenities";
import { BRAND_COLOR_KEYS, parseBrandColors } from "@/lib/brand-colors";
import { typologyRanges } from "@/lib/typology-ranges";

const TYPE_BY_PROPERTY_TYPE: Record<string, PropertyType> = {
  apartamento: "apartamento",
  casa: "casa",
  apartaestudio: "apartaestudio",
  proyecto: "proyecto",
};

/** The Constructora (`developer_id`) joined onto each row, for its name and contact phone. */
const PROPERTY_SELECT = "*, developer:developers!developer_id(name, phone)";

type PropertyRow = Tables<"properties"> & {
  developer?: Pick<Tables<"developers">, "name" | "phone"> | null;
};

type JsonObject = { [key: string]: Json | undefined };

const isObject = (value: Json | undefined): value is JsonObject =>
  !!value && typeof value === "object" && !Array.isArray(value);

/** Form values are stored as strings ("60", "2"); empty or non-numeric become undefined. */
function toNumber(value: Json | undefined): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

/** "Sí" / "No" from the form selects, or a real boolean. */
function toBoolean(value: Json | undefined): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string" || !value) return undefined;
  return value.trim().toLowerCase().startsWith("s");
}

const text = (value: string | null | undefined) => value?.trim() || undefined;

/**
 * Merges `typologies` (`{ "tower-1": Typology[] }`) and `tower_details`
 * (`{ "tower-1": { deliveryDate, elevatorCount, hasTrashChute } }`) into one
 * list of towers, ordered by number. Towers past `towerCount` are leftovers from
 * when the count was higher, so they're dropped.
 */
function parseTowers(typologies: Json, towerDetails: Json, towerCount: number | null): Tower[] {
  const keys = new Set([
    ...(isObject(typologies) ? Object.keys(typologies) : []),
    ...(isObject(towerDetails) ? Object.keys(towerDetails) : []),
  ]);

  return [...keys]
    .map((key): Tower => {
      const rawTypologies = isObject(typologies) ? typologies[key] : undefined;
      const info = isObject(towerDetails) ? towerDetails[key] : undefined;
      return {
        number: Number(key.replace(/\D/g, "")) || 0,
        deliveryDate: isObject(info) && typeof info.deliveryDate === "string" ? info.deliveryDate || undefined : undefined,
        elevatorCount: isObject(info) ? toNumber(info.elevatorCount) : undefined,
        hasTrashChute: isObject(info) ? toBoolean(info.hasTrashChute) : undefined,
        typologies: (Array.isArray(rawTypologies) ? rawTypologies : []).filter(isObject).map(
          (item): Typology => ({
            name: typeof item.name === "string" ? item.name.trim() : "",
            area: toNumber(item.area),
            bedrooms: toNumber(item.bedrooms),
            bathrooms: toNumber(item.bathrooms),
            hasStudy: toBoolean(item.study),
            hasBalcony: toBoolean(item.hasBalcony),
          })
        ),
      };
    })
    .filter((tower) => towerCount == null || tower.number <= towerCount)
    .sort((a, b) => a.number - b.number);
}

/** Reads `properties.seo`, keeping only non-empty string fields per platform. */
function parseSeo(value: Json | undefined): PropertySeo {
  const platform = (key: keyof PropertySeo) => {
    const fields = isObject(value) ? value[key] : undefined;
    if (!isObject(fields)) return {};
    return Object.fromEntries(
      Object.entries(fields).flatMap(([name, v]) => (typeof v === "string" && v.trim() ? [[name, v.trim()]] : [])),
    );
  };
  return { meta: platform("meta"), google: platform("google"), youtube: platform("youtube"), linkedin: platform("linkedin") };
}

function toDetails(row: PropertyRow): PropertyDetails {
  return {
    developer: row.developer
      ? { name: row.developer.name, phone: text(row.developer.phone) }
      : undefined,
    housingType: text(row.housing_type),
    constructionCompany: text(row.construction_company),
    trustCompany: text(row.trust_company),
    constructionBank: text(row.construction_bank),
    deliveryDate: text(row.delivery_date),
    towerCount: row.tower_count ?? undefined,
    towers: parseTowers(row.typologies, row.tower_details, row.tower_count),
    financing: {
      initialFeePercentage: row.initial_fee_percentage ?? undefined,
      initialFeeAmount: toNumber(row.initial_fee_amount),
      creditPercentage: row.credit_percentage ?? undefined,
      creditAmount: toNumber(row.credit_amount),
      separationAmount: toNumber(row.separation_amount),
    },
    salesRoom: {
      address: text(row.sales_room_address),
      phone: text(row.sales_room_phone),
      email: text(row.sales_room_email),
      hours: text(row.sales_room_hours),
    },
  };
}

/** The project's palette, or undefined when none was extracted (the page keeps Delfos' look). */
function toBrandColors(value: Json): Property["brandColors"] {
  const colors = parseBrandColors(value);
  return BRAND_COLOR_KEYS.some((key) => colors[key]) ? colors : undefined;
}

/** Maps a real `properties` row from Supabase onto the marketing site's mock `Property` shape. */
export function toProperty(row: PropertyRow): Property {
  const images = row.additional_images?.length
    ? [row.image, ...row.additional_images]
    : undefined;
  const amenities = parseAmenities(row.amenities).map((a) => a.name.trim());
  const ranges = typologyRanges(row.typologies);
  // Rows created without city/neighbourhood still have `location` ("La Estrella, Antioquia").
  const [locationArea, locationRegion] = (row.location ?? "").split(",").map((part) => part.trim());

  return {
    slug: row.uuid,
    title: row.title,
    projectName: row.project_name ?? undefined,
    neighborhood: row.neighborhood ?? row.commune ?? row.city ?? locationArea ?? "",
    city: row.city ?? locationRegion ?? "",
    operation: "comprar",
    type: TYPE_BY_PROPERTY_TYPE[row.property_type ?? ""] ?? "apartamento",
    price: Number(row.price),
    beds: ranges.bedrooms,
    baths: ranges.bathrooms,
    area: ranges.area,
    // "VIS" / "VIP" housing (but not "No VIS") is the affordable filter.
    affordable: /^\s*vi[sp]\b/i.test(row.housing_type ?? ""),
    // A delivery date still ahead means the project is off-plan.
    status: row.delivery_date && new Date(row.delivery_date) > new Date() ? "Sobre planos" : "Listo para estrenar",
    hue: (row.id * 47) % 360,
    lat: row.latitude ?? undefined,
    lng: row.longitude ?? undefined,
    image: row.image,
    images,
    description: row.description || undefined,
    amenities: amenities.length ? amenities : undefined,
    address: row.address || undefined,
    stratum: row.stratum || undefined,
    details: toDetails(row),
    seo: parseSeo(row.seo),
    brandColors: toBrandColors(row.brand_colors),
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? row.created_at ?? undefined,
  };
}

/** Fetches every real property from Supabase, newest first. Cached like the detail pages and deduped per request. */
export const getDbProperties = cache(async (): Promise<Property[]> => {
  const supabase = createPublicClient({ revalidate: 300, tags: [PROPERTIES_CACHE_TAG] });
  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_SELECT)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(toProperty);
});

/**
 * Looks up a single real property for `/propiedades/[slug]`, by its public
 * UUID or by the SEO slug set in the dashboard (`seo.google.slug`). Cached for
 * 5 minutes (refreshed when a property is saved) and deduped per request, so
 * `generateMetadata` and the page share one query.
 */
export const getDbPropertyBySlug = cache(async (slug: string, by: "uuid" | "seo-slug"): Promise<Property | null> => {
  const query = createPublicClient({ revalidate: 300, tags: [PROPERTIES_CACHE_TAG] })
    .from("properties")
    .select(PROPERTY_SELECT);
  const { data, error } = await (by === "uuid" ? query.eq("uuid", slug) : query.eq("seo->google->>slug", slug))
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return toProperty(data);
});
