"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useOverlayState } from "@heroui/react";

import { HeartIcon } from "@/components/icons/animated/heart";
import { SendIcon } from "@/components/icons/animated/send";
import { AuthModal } from "@/components/marketing/auth-modal";
import { FavoritesLoginPrompt } from "@/components/marketing/favorites-login-prompt";
import { useFavoriteToggle } from "@/hooks/use-favorite-toggle";

type PropertyActionsValue = {
  title: string;
  saved: boolean;
  toggleSaved: () => void;
};

const PropertyActionsContext = createContext<PropertyActionsValue | null>(null);

function usePropertyActions() {
  const value = useContext(PropertyActionsContext);
  if (!value) throw new Error("PropertyActions must be rendered inside <PropertyActionsProvider>");
  return value;
}

/**
 * Owns the "saved" flag, the login prompt and the auth modal once per page, so
 * every PropertyActions (the top bar and the photo tour header) stays in sync
 * without mounting its own copy of the modals.
 */
export function PropertyActionsProvider({ title, children }: { title: string; children: ReactNode }) {
  const { isFavorite: saved, toggleFavorite: toggleSaved, loginPrompt, closeLoginPrompt } = useFavoriteToggle();
  const authModal = useOverlayState();

  function continueToLogin() {
    closeLoginPrompt();
    authModal.open();
  }

  return (
    <PropertyActionsContext.Provider value={{ title, saved, toggleSaved }}>
      {children}

      {loginPrompt ? (
        <FavoritesLoginPrompt
          lastEmail={loginPrompt.lastEmail}
          onCancel={closeLoginPrompt}
          onContinue={continueToLogin}
        />
      ) : null}

      <AuthModal state={authModal} />
    </PropertyActionsContext.Provider>
  );
}

/** Top action row: the listing name on the left, share + save on the right. */
export function FavoriteShareBar() {
  const { title } = usePropertyActions();
  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="truncate font-display text-xl font-semibold text-foreground sm:text-xl">
        {title}
      </h1>
      <PropertyActions />
    </div>
  );
}

/**
 * Share + save buttons. `compact` hides the labels below `sm`, for tight
 * headers like the photo tour.
 */
export function PropertyActions({ compact = false }: { compact?: boolean }) {
  const { title, saved, toggleSaved } = usePropertyActions();

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
      } catch {
        // User dismissed the share sheet
      }
      return;
    }
    await navigator.clipboard?.writeText(window.location.href);
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={handleShare}
        className="flex items-center gap-1.5 rounded-full border border-separator px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"
      >
        <SendIcon size={18} />
        <span className={compact ? "sr-only sm:not-sr-only" : undefined}>Compartir</span>
      </button>

      <button
        type="button"
        onClick={toggleSaved}
        aria-pressed={saved}
        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
          saved
            ? "border-danger text-danger"
            : "border-separator text-foreground hover:bg-surface-secondary"
        }`}
      >
        <HeartIcon size={18} filled={saved} />
        <span className={compact ? "sr-only sm:not-sr-only" : undefined}>
          {saved ? "Guardado" : "Guardar"}
        </span>
      </button>
    </div>
  );
}
