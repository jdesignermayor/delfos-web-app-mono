import type { Json } from "@/supabase/types";

/** A common area as stored in `properties.amenities` (a snapshot of the `common_areas` row). */
export type Amenity = { id: string; name: string };

/** Reads `properties.amenities`, tolerating legacy rows that stored plain name strings. */
export function parseAmenities(value: Json | null | undefined): Amenity[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): Amenity[] => {
    if (typeof item === "string") return [{ id: "", name: item }];
    if (item && typeof item === "object" && !Array.isArray(item) && typeof item.name === "string") {
      return [{ id: typeof item.id === "string" ? item.id : "", name: item.name }];
    }
    return [];
  });
}
