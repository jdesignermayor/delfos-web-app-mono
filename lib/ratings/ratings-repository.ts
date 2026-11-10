import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/supabase/types";

/**
 * `property_ratings` reads and writes. Takes the signed-in user's own Supabase client, so Row Level
 * Security (only your own rows) applies on top of the `userId` filters. Everyone else only ever
 * sees the average and count, from the `property_rating_summary` function.
 */
type Client = SupabaseClient<Database>;

export type RatingSummary = { average: number; total: number };

/** Average (one decimal) and number of ratings; `{ 0, 0 }` when nobody rated yet. */
export async function getRatingSummary(supabase: Client, propertyId: number): Promise<RatingSummary> {
  const { data, error } = await supabase.rpc("property_rating_summary", { p_property_id: propertyId });
  if (error) throw error;
  const row = data?.[0];
  return { average: Number(row?.average ?? 0), total: Number(row?.total ?? 0) };
}

/** The user's own rating (1–5) of the property, or `null` if they haven't rated it. */
export async function getUserRating(supabase: Client, userId: string, propertyId: number): Promise<number | null> {
  const { data, error } = await supabase
    .from("property_ratings")
    .select("rating")
    .eq("user_id", userId)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (error) throw error;
  return data?.rating ?? null;
}

/** Saves the user's rating; rating again replaces it. */
export async function upsertRating(supabase: Client, userId: string, propertyId: number, rating: number): Promise<void> {
  const { error } = await supabase
    .from("property_ratings")
    .upsert(
      { user_id: userId, property_id: propertyId, rating, updated_at: new Date().toISOString() },
      { onConflict: "property_id,user_id" },
    );
  if (error) throw error;
}
