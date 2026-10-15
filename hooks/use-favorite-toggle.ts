"use client";

import { useState } from "react";

import { useFavorites } from "@/components/marketing/favorites-provider";
import { getLastEmail } from "@/lib/auth/client-session";

/**
 * Saved/unsaved state of one listing, backed by the page's `FavoritesProvider`. Signed-out
 * visitors get a login prompt instead (with the email they last used on this device, if any).
 */
export function useFavoriteToggle({
  propertyUuid,
  onLoginRequired,
}: { propertyUuid?: string; onLoginRequired?: () => void } = {}) {
  const favorites = useFavorites();
  const [loginPrompt, setLoginPrompt] = useState<{ lastEmail: string | null } | null>(null);

  const isFavorite = Boolean(propertyUuid && favorites?.isFavorite(propertyUuid));

  function toggleFavorite() {
    // Still loading who's signed in: ignore the tap rather than guess.
    if (favorites?.status === "loading") return;
    if (!favorites || favorites.status === "signed-out") {
      setLoginPrompt({ lastEmail: getLastEmail() });
      onLoginRequired?.();
      return;
    }
    if (propertyUuid) void favorites.setFavorite(propertyUuid, !isFavorite);
  }

  return {
    isFavorite,
    /** Whether this listing can be saved at all (sample listings have no uuid). */
    canFavorite: Boolean(propertyUuid),
    toggleFavorite,
    loginPrompt,
    closeLoginPrompt: () => setLoginPrompt(null),
  };
}
