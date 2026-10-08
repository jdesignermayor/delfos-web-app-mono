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

/** Desktop shows underlined tabs in the header; mobile shows compact pills in their own row. */
const VARIANTS = {
  desktop: {
    iconSize: 22,
    base: "flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold transition-colors",
    active: "border-foreground text-foreground",
    inactive: "border-transparent text-muted hover:border-separator hover:text-foreground",
  },
  mobile: {
    iconSize: 18,
    base: "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
    active: "bg-surface-secondary text-foreground",
    inactive: "text-muted hover:bg-surface-secondary hover:text-foreground",
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
        <Icon size={styles.iconSize} />
        {tab.label}
      </button>
    );
  });
}
