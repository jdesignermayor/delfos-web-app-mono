"use client";

import { HomeIcon } from "@/components/icons/animated/home";
import { KeyIcon } from "@/components/icons/animated/key";
import { MapPinHouseIcon } from "@/components/icons/animated/map-pin-house";
import { SEARCH_MODES, useSearchMode, type SearchMode } from "@/components/marketing/search-mode-context";

const TAB_ICONS = {
  comprar: HomeIcon,
  arrendar: KeyIcon,
  proyecto: MapPinHouseIcon,
} as const;

/** Desktop shows underlined tabs with icons in the header; mobile shows plain text chips inside the full-screen search. */
const VARIANTS = {
  desktop: {
    iconSize: 18,
    base: "flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-[13px] font-semibold transition-colors",
    active: "border-foreground text-foreground",
    inactive: "border-transparent text-muted hover:border-separator hover:text-foreground",
  },
  mobile: {
    iconSize: null,
    base: "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
    active: "border-foreground bg-foreground text-background",
    inactive: "border-separator text-muted hover:border-foreground hover:text-foreground",
  },
  /** Landing phone search sheet: segments of one quiet segmented control; the active one is solid ink. */
  brutalMobile: {
    iconSize: null,
    base: "min-h-11 flex-1 basis-0 px-2 py-1.5 text-center text-[15px] font-semibold leading-tight transition-[background-color,color] duration-200 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink",
    active: "bg-ink text-white",
    inactive: "text-ink/65 active:bg-ink/[0.06]",
  },
  /** Landing header: the desktop tabs in ink, with a square ink underline on the active one. */
  brutal: {
    iconSize: 18,
    base: "flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-[13px] font-semibold transition-colors outline-none focus-visible:bg-delfos-sky",
    active: "border-ink text-ink",
    inactive: "border-transparent text-ink/60 hover:border-ink/30 hover:text-ink",
  },
} as const;

/**
 * Comprar / Arrendar / Proyectos nuevos switch, bound to the shared search mode. `onSelectAction`
 * runs after the mode changes, e.g. to re-run the search on /search.
 */
export function SearchModeTabs({
  variant,
  onSelectAction,
}: {
  variant: keyof typeof VARIANTS;
  onSelectAction?: (mode: SearchMode) => void;
}) {
  const { mode, setMode } = useSearchMode();
  const styles = VARIANTS[variant];

  return SEARCH_MODES.map((tab) => {
    const Icon = TAB_ICONS[tab.value];
    const active = tab.value === mode;
    return (
      <button
        key={tab.value}
        type="button"
        onClick={() => {
          setMode(tab.value);
          onSelectAction?.(tab.value);
        }}
        aria-current={active ? "true" : undefined}
        className={`${styles.base} ${active ? styles.active : styles.inactive}`}
      >
        {styles.iconSize ? <Icon size={styles.iconSize} /> : null}
        {tab.label}
      </button>
    );
  });
}
