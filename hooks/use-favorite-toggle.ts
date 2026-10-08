"use client";

import { useState } from "react";

import { getLastEmail, hasClientSession } from "@/lib/auth/client-session";

/**
 * Saved/unsaved flag for a listing. Signed-out visitors get a login prompt
 * instead (with the email they last used on this device, if any).
 */
export function useFavoriteToggle({ onLoginRequired }: { onLoginRequired?: () => void } = {}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState<{ lastEmail: string | null } | null>(null);

  function toggleFavorite() {
    if (!hasClientSession()) {
      setLoginPrompt({ lastEmail: getLastEmail() });
      onLoginRequired?.();
      return;
    }
    setIsFavorite((value) => !value);
  }

  return {
    isFavorite,
    toggleFavorite,
    loginPrompt,
    closeLoginPrompt: () => setLoginPrompt(null),
  };
}
