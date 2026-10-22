"use client";

import { useEffect } from "react";

import { recordRecentViewAction } from "@/app/actions/favorites";
import { useFavorites } from "@/components/marketing/favorites-provider";

/**
 * Adds the property to the signed-in user's "Vistos recientemente". Runs from the client once the
 * shared favorites state knows someone is signed in, so the detail page stays static.
 */
export function RecordRecentView({ propertyUuid }: { propertyUuid?: string }) {
  const status = useFavorites()?.status;

  useEffect(() => {
    if (status === "ready" && propertyUuid) void recordRecentViewAction(propertyUuid);
  }, [status, propertyUuid]);

  return null;
}
