"use client";

import { useEffect, useState } from "react";

import { getMyFavoritesPageAction } from "@/app/actions/favorites";
import { useFavorites } from "@/components/marketing/favorites-provider";
import type { FavoritesPageData } from "@/lib/favorites/favorites";

/**
 * Last lists loaded in this tab, so going between /favoritos and its "Vistos recientemente" page
 * paints at once; every visit still re-reads them in the background.
 */
let cached: FavoritesPageData | null = null;

export type FavoritesPageState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "error" }
  | { status: "ready"; data: FavoritesPageData };

/** The signed-in user's favorites and recently viewed properties, loaded from the client. */
export function useFavoritesPageData(): FavoritesPageState {
  const sessionStatus = useFavorites()?.status ?? "signed-out";
  const [data, setData] = useState<FavoritesPageData | null>(cached);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (sessionStatus === "signed-out") cached = null;
    if (sessionStatus !== "ready") return;

    let cancelled = false;
    getMyFavoritesPageAction()
      .then((result) => {
        if (cancelled) return;
        cached = result;
        setData(result);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionStatus]);

  if (sessionStatus === "signed-out") return { status: "signed-out" };
  if (data) return { status: "ready", data };
  if (failed) return { status: "error" };
  return { status: "loading" };
}
