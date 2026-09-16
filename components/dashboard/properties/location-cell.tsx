"use client";

import { Tooltip } from "@heroui/react";

/** Truncated address with a hover/focus tooltip revealing the full text, plus the city/region underneath. */
export function LocationCell({
  address,
  location,
}: {
  address: string | null;
  location: string | null;
}) {
  return (
    <div>
      <Tooltip>
        <Tooltip.Trigger
          tabIndex={0}
          className="block max-w-[220px] cursor-default truncate text-left outline-none focus-visible:ring-2 focus-visible:ring-focus/30 rounded"
        >
          {address || "—"}
        </Tooltip.Trigger>
        <Tooltip.Content>{address || "Sin dirección"}</Tooltip.Content>
      </Tooltip>
      {location ? <div className="text-xs text-muted/80">{location}</div> : null}
    </div>
  );
}
