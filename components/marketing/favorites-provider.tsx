"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { getMyFavoritesAction, setFavoriteAction } from "@/app/actions/favorites";

type FavoritesStatus = "loading" | "signed-out" | "ready";

type FavoritesContextValue = {
  status: FavoritesStatus;
  isFavorite: (propertyUuid: string) => boolean;
  /** Optimistic: the heart flips at once and flips back if saving fails. */
  setFavorite: (propertyUuid: string, isFavorite: boolean) => Promise<void>;
  /** Re-reads the saved list from the server — after signing in, for example. */
  reload: () => void;
  /** Forgets everything at once — on sign-out, before the server round trip. */
  clear: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/**
 * The signed-in user's saved properties, shared by every page. It lives in the root layout so it
 * survives client-side navigation: a heart toggled on a property page is already right when the
 * landing comes back from the router cache. Loaded from the client, so no page turns dynamic.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<FavoritesStatus>("loading");
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set());
  // Bumped by every load and write: a load answered after a newer change is stale and dropped.
  const version = useRef(0);

  const reload = useCallback(() => {
    const requested = ++version.current;
    getMyFavoritesAction()
      .then((uuids) => {
        if (requested !== version.current) return;
        setStatus(uuids ? "ready" : "signed-out");
        setSaved(new Set(uuids ?? []));
      })
      .catch(() => {
        // Keep what's on screen; the next reload will try again.
      });
  }, []);

  const clear = useCallback(() => {
    version.current++;
    setStatus("signed-out");
    setSaved(new Set());
  }, []);

  useEffect(() => {
    reload();
    // Another tab may have signed in or out, or changed favorites.
    function onVisible() {
      if (document.visibilityState === "visible") reload();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  function apply(propertyUuid: string, isFavorite: boolean) {
    setSaved((current) => {
      const next = new Set(current);
      if (isFavorite) next.add(propertyUuid);
      else next.delete(propertyUuid);
      return next;
    });
  }

  async function setFavorite(propertyUuid: string, isFavorite: boolean) {
    version.current++;
    apply(propertyUuid, isFavorite);
    const result = await setFavoriteAction({ propertyUuid, isFavorite });
    if (result.success) return;
    apply(propertyUuid, !isFavorite);
    if (result.reason === "signed-out") clear();
  }

  return (
    <FavoritesContext.Provider
      value={{ status, isFavorite: (uuid) => saved.has(uuid), setFavorite, reload, clear }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

/** `null` outside a `FavoritesProvider`. */
export function useFavorites() {
  return useContext(FavoritesContext);
}
