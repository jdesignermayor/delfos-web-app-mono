"use client";

import { useEffect } from "react";

import { propertyItem, trackEvent } from "@/lib/analytics";

type TrackedProperty = Parameters<typeof propertyItem>[0];

/** GA4 `view_item` for a property detail page, so each property's views are reported by name and price. */
export function TrackPropertyView({ property }: { property: TrackedProperty }) {
  useEffect(() => {
    trackEvent("view_item", { currency: "COP", value: property.price || undefined, items: [propertyItem(property)] });
  }, [property]);
  return null;
}

/** GA4 `view_item_list` for a list of properties shown on the landing (e.g. the featured carousel). */
export function TrackPropertyList({
  listId,
  listName,
  properties,
}: {
  listId: string;
  listName: string;
  properties: TrackedProperty[];
}) {
  useEffect(() => {
    trackEvent("view_item_list", {
      item_list_id: listId,
      item_list_name: listName,
      items: properties.map((property, index) => propertyItem(property, index)),
    });
  }, [listId, listName, properties]);
  return null;
}
