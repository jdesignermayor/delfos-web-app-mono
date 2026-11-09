import type { Json } from "@/supabase/types";
import { towerNumberOf } from "@/lib/towers/tower-keys";

const ISO_DATE = /^\d{4}-\d{2}(-\d{2})?/;

/**
 * A project's "Fecha de entrega": the delivery date of its last tower, i.e. the latest
 * `deliveryDate` in `properties.tower_details` (`{ "tower-1": { deliveryDate: "2027-06-30" } }`).
 * Towers past `towerCount` are leftovers from a higher count and are ignored.
 * Returns "YYYY-MM-DD" (or "YYYY-MM" if that's how it was stored), or null when no tower has a date.
 * Safe on client and server.
 */
export function projectDeliveryDate(towerDetails: Json | undefined, towerCount?: number | null): string | null {
  if (!towerDetails || typeof towerDetails !== "object" || Array.isArray(towerDetails)) return null;

  let latest: string | null = null;
  for (const [key, detail] of Object.entries(towerDetails)) {
    if (towerCount != null && towerNumberOf(key) > towerCount) continue;
    if (!detail || typeof detail !== "object" || Array.isArray(detail)) continue;
    const date = typeof detail.deliveryDate === "string" ? detail.deliveryDate.match(ISO_DATE)?.[0] : undefined;
    // ISO dates sort lexically, so string comparison finds the latest.
    if (date && (latest === null || date > latest)) latest = date;
  }
  return latest;
}
