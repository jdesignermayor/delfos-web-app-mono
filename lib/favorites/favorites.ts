import "server-only";

import { getDbProperties } from "@/components/marketing/property-adapter";
import type { Property } from "@/components/marketing/properties";
import { getAccountUser } from "@/lib/auth/dal";
import { listFavoritePropertyUuids, listRecentViewPropertyUuids } from "@/lib/favorites/favorites-repository";
import { createClient } from "@/supabase/server";

/**
 * The signed-in user's saved property uuids, or `null` when nobody is signed in (the hearts then
 * ask to log in).
 */
export async function getFavoritePropertyUuids(): Promise<string[] | null> {
  const user = await getAccountUser();
  if (!user) return null;
  try {
    return await listFavoritePropertyUuids(await createClient(), user.id);
  } catch {
    // The hearts still work without the initial state; don't break the page over it.
    return [];
  }
}

/**
 * The properties a user saved, most recently saved first. Reuses the cached public catalogue
 * instead of a second mapping; favorites of unpublished/deleted properties simply drop out.
 */
export async function getFavoriteProperties(userId: string): Promise<Property[]> {
  const [uuids, properties] = await Promise.all([
    listFavoritePropertyUuids(await createClient(), userId),
    getDbProperties(),
  ]);
  const byUuid = new Map(properties.map((property) => [property.uuid, property]));
  return uuids.flatMap((uuid) => byUuid.get(uuid) ?? []);
}

/** How many recently viewed properties are kept on screen. */
const RECENT_VIEWS_LIMIT = 30;

/** What a property card needs; the detail-page fields stay on the server. */
function toCard(property: Property): Property {
  return { ...property, details: undefined, seo: undefined, description: undefined, amenities: undefined, brandColors: undefined };
}

export type FavoritesPageData = { favorites: Property[]; recent: Property[] };

/**
 * The `/favoritos` lists: saved properties (most recently saved first) and recently opened ones
 * (most recent first), trimmed to card fields. Unpublished/deleted properties simply drop out.
 */
export async function getFavoritesPageData(userId: string): Promise<FavoritesPageData> {
  const supabase = await createClient();
  const [favoriteUuids, recentUuids, properties] = await Promise.all([
    listFavoritePropertyUuids(supabase, userId),
    listRecentViewPropertyUuids(supabase, userId, RECENT_VIEWS_LIMIT),
    getDbProperties(),
  ]);
  const byUuid = new Map(properties.map((property) => [property.uuid, property]));
  const cards = (uuids: string[]) => uuids.flatMap((uuid) => byUuid.get(uuid) ?? []).map(toCard);
  return { favorites: cards(favoriteUuids), recent: cards(recentUuids) };
}
