import type { Property, PropertyType } from "@/components/marketing/properties";
import { createPublicClient } from "@/supabase/public";
import type { Tables } from "@/supabase/types";
import { parseAmenities } from "@/lib/amenities";

const TYPE_BY_PROPERTY_TYPE: Record<string, PropertyType> = {
  apartamento: "apartamento",
  casa: "casa",
  apartaestudio: "apartaestudio",
  proyecto: "proyecto",
};

/** Maps a real `properties` row from Supabase onto the marketing site's mock `Property` shape. */
export function toProperty(row: Tables<"properties">): Property {
  const images = row.additional_images?.length
    ? [row.image, ...row.additional_images]
    : undefined;
  const amenities = parseAmenities(row.amenities).map((a) => a.name);

  return {
    slug: row.uuid,
    title: row.title,
    projectName: row.project_name ?? undefined,
    neighborhood: row.neighborhood ?? row.commune ?? row.city ?? "",
    city: row.city ?? "",
    operation: "comprar",
    type: TYPE_BY_PROPERTY_TYPE[row.property_type ?? ""] ?? "apartamento",
    price: Number(row.price),
    beds: row.bedrooms,
    baths: row.bathrooms,
    parking: row.parking,
    area: Number(row.area),
    affordable: false,
    status: "Listo para estrenar",
    hue: (row.id * 47) % 360,
    lat: row.latitude ?? undefined,
    lng: row.longitude ?? undefined,
    image: row.image,
    images,
    description: row.description || undefined,
    amenities: amenities.length ? amenities : undefined,
    address: row.address || undefined,
    stratum: row.stratum || undefined,
  };
}

/** Fetches every real property from Supabase, newest first. */
export async function getDbProperties(): Promise<Property[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(toProperty);
}

/** Looks up a single real property by its public UUID (used in `/propiedades/[slug]` URLs). */
export async function getDbPropertyByUuid(uuid: string): Promise<Property | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("uuid", uuid)
    .maybeSingle();

  if (error || !data) return null;
  return toProperty(data);
}
