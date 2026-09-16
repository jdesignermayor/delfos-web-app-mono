import { PropertyCarousel } from "@/components/marketing/property-carousel";
import { toProperty } from "@/components/marketing/property-adapter";
import { PROPERTIES, type Property } from "@/components/marketing/properties";
import { createClient } from "@/supabase/server";

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
