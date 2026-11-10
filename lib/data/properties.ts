import { cache } from "react";

import { getDashboardUser } from "@/lib/auth/dal";
import { canManageProperty } from "@/lib/auth/permissions";
import { createClient } from "@/supabase/server";
import { createAdminClient } from "@/supabase/admin";
import type { PriceHistoryEntry } from "@/lib/price-history/price-history";
import { listPriceHistory } from "@/lib/price-history/price-history-repository";

/**
 * A single property (with its developer) for the dashboard detail/edit page —
 * `null` when it doesn't exist or is outside the user's constructora.
 *
 * Memoized per request, so `generateMetadata` and the page share one query.
 */
export const getDashboardProperty = cache(async (id: number) => {
  const user = await getDashboardUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("*, developers!developer_id(id, name, address, phone), property_towers(tower_number, status_id)")
    .eq("id", id)
    .maybeSingle();

  if (!data || !canManageProperty(user, data.developer_id)) return null;

  // The price log is only readable with the admin client, now that access is checked.
  let priceHistory: PriceHistoryEntry[] = [];
  try {
    priceHistory = await listPriceHistory(createAdminClient(), data.id);
  } catch {
    // Show the property even if the log can't be read (e.g. its table isn't created yet).
  }
  return { ...data, price_history: priceHistory };
});
