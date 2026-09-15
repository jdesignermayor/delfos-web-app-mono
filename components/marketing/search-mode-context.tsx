"use client";

import { createContext, useContext, useRef, useState, type ReactNode, type RefObject } from "react";

import type { Operation } from "@/components/marketing/properties";

export type SearchMode = Operation | "proyecto";

export const SEARCH_MODES: { value: SearchMode; label: string }[] = [
  { value: "comprar", label: "Comprar" },
  { value: "arrendar", label: "Arrendar" },
  { value: "proyecto", label: "Proyectos nuevos" },
];

type SearchModeContextValue = {
  mode: SearchMode;
  setMode: (mode: SearchMode) => void;
  /** Anchors the hero's PropertySearch so the navbar can watch its visibility. */
  heroSearchRef: RefObject<HTMLDivElement | null>;
  /** The sticky site header, so other components can measure its live height. */
  navbarRef: RefObject<HTMLElement | null>;
};

const SearchModeContext = createContext<SearchModeContextValue | null>(null);

export function SearchModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<SearchMode>("comprar");
  const heroSearchRef = useRef<HTMLDivElement | null>(null);
  const navbarRef = useRef<HTMLElement | null>(null);
  return (
    <SearchModeContext.Provider value={{ mode, setMode, heroSearchRef, navbarRef }}>
      {children}
    </SearchModeContext.Provider>
  );
}

export function useSearchMode() {
  const context = useContext(SearchModeContext);
  if (!context) {
    throw new Error("useSearchMode must be used within a SearchModeProvider");
  }
  return context;
}
