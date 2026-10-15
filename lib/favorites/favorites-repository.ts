import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/supabase/types";

/**
 * `property_favorites` reads and writes. Takes the signed-in user's own Supabase client, so Row
 * Level Security (only your own rows) applies on top of the `userId` filters.
 */
type Client = SupabaseClient<Database>;

/** Uuids of the properties this user saved, newest first. */
export async function listFavoritePropertyUuids(supabase: Client, userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("property_favorites")
    .select("property:properties!property_id(uuid)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.flatMap((row) => (row.property ? [row.property.uuid] : []));
}

/** The internal id of a published property, or `null` when no property has this uuid. */
export async function findPropertyId(supabase: Client, propertyUuid: string): Promise<number | null> {
  const { data, error } = await supabase.from("properties").select("id").eq("uuid", propertyUuid).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

/** Saves a property for the user; saving it twice is a no-op. */
export async function addFavorite(supabase: Client, userId: string, propertyId: number): Promise<void> {
  const { error } = await supabase
    .from("property_favorites")
    .upsert({ user_id: userId, property_id: propertyId }, { onConflict: "user_id,property_id", ignoreDuplicates: true });
  if (error) throw error;
}

/** Removes a saved property; removing one that isn't saved is a no-op. */
export async function removeFavorite(supabase: Client, userId: string, propertyId: number): Promise<void> {
  const { error } = await supabase
    .from("property_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("property_id", propertyId);
  if (error) throw error;
}
