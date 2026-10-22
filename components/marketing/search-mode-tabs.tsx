"use client";

import { HomeIcon } from "@/components/icons/animated/home";
import { KeyIcon } from "@/components/icons/animated/key";
import { MapPinHouseIcon } from "@/components/icons/animated/map-pin-house";
import { SEARCH_MODES, useSearchMode } from "@/components/marketing/search-mode-context";

const TAB_ICONS = {
  comprar: HomeIcon,
  arrendar: KeyIcon,
  proyecto: MapPinHouseIcon,
} as const;

/** Desktop shows underlined tabs with icons in the header; mobile shows plain text chips under the search box. */
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
} as const;

/** Comprar / Arrendar / Proyectos nuevos switch, bound to the shared search mode. */
export function SearchModeTabs({ variant }: { variant: keyof typeof VARIANTS }) {
  const { mode, setMode } = useSearchMode();
  const styles = VARIANTS[variant];

  return SEARCH_MODES.map((tab) => {
    const Icon = TAB_ICONS[tab.value];
    const active = tab.value === mode;
    return (
      <button
        key={tab.value}
        type="button"
        onClick={() => setMode(tab.value)}
        aria-current={active ? "true" : undefined}
        className={`${styles.base} ${active ? styles.active : styles.inactive}`}
      >
        {styles.iconSize ? <Icon size={styles.iconSize} /> : null}
        {tab.label}
      </button>
    );
  });
}
