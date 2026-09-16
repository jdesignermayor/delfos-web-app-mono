"use client";

import { SearchIcon } from "@/components/icons";

const PREVIEW_LABELS = ["Ubicación", "Tipo", "Habitaciones", "Presupuesto"];

/**
 * Brief, low-height preview of the full search bar's segments — a single
 * click target (not interactive per-segment) that opens the real thing.
 */
export function MiniSearchTrigger({ onOpenAction }: { onOpenAction: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpenAction}
      className="flex items-center divide-x divide-separator rounded-full border border-separator bg-surface-secondary/60 py-1 pl-1 pr-1 transition-colors hover:bg-surface-secondary"
    >
      {PREVIEW_LABELS.map((label) => (
        <span key={label} className="px-3 text-xs font-medium text-foreground">
          {label}
        </span>
      ))}
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <SearchIcon className="size-3" />
      </span>
    </button>
  );
}
