import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { PriceHistoryEntry } from "@/lib/price-history/price-history";
import type { Database } from "@/supabase/types";

/**
 * `property_price_history`: an append-only log of each project's price. RLS has no policies, so
 * only the service-role (admin) client reads or writes it, after the app checked permissions. A
 * database trigger rejects any UPDATE, so recorded changes can't be altered.
 */
type Client = SupabaseClient<Database>;

/** Every recorded price of a property, newest first. */
export async function listPriceHistory(admin: Client, propertyId: number): Promise<PriceHistoryEntry[]> {
  const { data, error } = await admin
    .from("property_price_history")
    .select("id, price, previous_price, changed_at, changed_by_name")
    .eq("property_id", propertyId)
    .order("changed_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    price: Number(row.price),
    previousPrice: row.previous_price == null ? null : Number(row.previous_price),
    changedAt: row.changed_at,
    changedBy: row.changed_by_name,
  }));
}

/** Logs a property's new price (and what it was before; `null` for the first one). */
export async function recordPriceChange(
  admin: Client,
  entry: { propertyId: number; price: number; previousPrice: number | null; user: { id: string; name: string | null; email: string | null } },
): Promise<void> {
  const { error } = await admin.from("property_price_history").insert({
    property_id: entry.propertyId,
    price: entry.price,
    previous_price: entry.previousPrice,
    changed_by: entry.user.id,
    changed_by_name: entry.user.name || entry.user.email,
  });
  if (error) throw error;
}
