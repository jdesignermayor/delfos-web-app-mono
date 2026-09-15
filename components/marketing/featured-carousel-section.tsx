import { PropertyCarousel } from "@/components/marketing/property-carousel";
import { PROPERTIES, type Property, type PropertyType } from "@/components/marketing/properties";
import { createClient } from "@/supabase/server";
import type { Tables } from "@/supabase/types";

const TYPE_BY_PROPERTY_TYPE: Record<string, PropertyType> = {
  apartamento: "apartamento",
  casa: "casa",
  apartaestudio: "apartaestudio",
  proyecto: "proyecto",
};

function toProperty(row: Tables<"properties">): Property {
  return {
    slug: String(row.id),
    title: row.title,
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
    lat: 0,
    lng: 0,
    image: row.image,
  };
}

async function getFeaturedProperties(): Promise<Property[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error || !data || data.length === 0) return PROPERTIES;
  return data.map(toProperty);
}

export async function FeaturedCarouselSection() {
  const properties = await getFeaturedProperties();

  return (
    <section className="mx-auto w-full max-w-[100rem] px-4 py-14 sm:px-6 bg-white">
      <PropertyCarousel title="Explora propiedades en Medellín" properties={properties} />
    </section>
  );
}
