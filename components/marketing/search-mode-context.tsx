"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

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
};

const SearchModeContext = createContext<SearchModeContextValue | null>(null);

export function SearchModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<SearchMode>("comprar");
  return (
    <SearchModeContext.Provider value={{ mode, setMode }}>
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
