"use server";

import { revalidatePath } from "next/cache";

import { getAccountUser } from "@/lib/auth/dal";
import { getFavoritePropertyUuids } from "@/lib/favorites/favorites";
import { addFavorite, findPropertyId, removeFavorite } from "@/lib/favorites/favorites-repository";
import { createRateLimiter } from "@/lib/rate-limit";
import { createClient } from "@/supabase/server";

export type FavoriteActionResult =
  | { success: true; isFavorite: boolean }
  | { success: false; error: string; reason?: "signed-out" };

const favoriteLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The signed-in user's saved property uuids, or `null` when signed out. Only ever their own. */
export async function getMyFavoritesAction(): Promise<string[] | null> {
  return getFavoritePropertyUuids();
}

/** Saves (`isFavorite: true`) or removes a property from the signed-in user's favorites. */
export async function setFavoriteAction(input: { propertyUuid: string; isFavorite: boolean }): Promise<FavoriteActionResult> {
  const user = await getAccountUser();
  if (!user) return { success: false, error: "Inicia sesión para guardar favoritos.", reason: "signed-out" };
  if (!favoriteLimiter.tryConsume(user.id)) {
    return { success: false, error: "Demasiados cambios seguidos. Espera un momento." };
  }

  const propertyUuid = typeof input?.propertyUuid === "string" ? input.propertyUuid : "";
  const isFavorite = input?.isFavorite === true;
  if (!UUID_RE.test(propertyUuid)) return { success: false, error: "Propiedad no válida." };

  try {
    const supabase = await createClient();
    const propertyId = await findPropertyId(supabase, propertyUuid);
    if (propertyId === null) return { success: false, error: "Propiedad no válida." };

    if (isFavorite) await addFavorite(supabase, user.id, propertyId);
    else await removeFavorite(supabase, user.id, propertyId);
    // The account home lists favorites: drop its cached render so it never shows a stale list.
    revalidatePath("/dashboard");
    return { success: true, isFavorite };
  } catch {
    return { success: false, error: "No pudimos guardar tu favorito. Intenta de nuevo." };
  }
}
