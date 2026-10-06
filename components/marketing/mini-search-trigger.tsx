"use client";

import { BedIcon, HomeIcon, MapPinIcon, SearchIcon, WalletIcon } from "@/components/icons";

const PREVIEW_SEGMENTS = [
  { label: "Ubicación", icon: MapPinIcon },
  { label: "Tipo", icon: HomeIcon },
  { label: "Habitaciones", icon: BedIcon },
  { label: "Presupuesto", icon: WalletIcon },
];

/**
 * Brief, low-height preview of the full search bar's segments — a single
 * click target (not interactive per-segment) that opens the real thing.
 */
export function MiniSearchTrigger({ onOpenAction }: { onOpenAction: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpenAction}
      aria-label="Abrir buscador"
      className="group flex items-center rounded-full border border-separator bg-white py-1 pl-2 pr-1 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.18)] transition-shadow hover:shadow-[0_6px_20px_-8px_rgba(15,23,42,0.28)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {PREVIEW_SEGMENTS.map(({ label, icon: Icon }, index) => (
        <span key={label} className="flex items-center">
          {index > 0 ? <span aria-hidden="true" className="h-4 w-px bg-separator" /> : null}
          <span className="flex items-center gap-1.5 px-3 text-xs font-medium text-foreground">
            <Icon className="size-3.5 text-muted transition-colors group-hover:text-accent" />
            {label}
          </span>
        </span>
      ))}
      <span className="ml-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors group-hover:bg-accent-hover">
        <SearchIcon className="size-3.5" />
      </span>
    </button>
  );
}
