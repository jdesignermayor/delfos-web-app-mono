import type { PropertyFilters } from "@/components/marketing/properties";
import type { SearchMode } from "@/components/marketing/search-mode-context";

/** Refinements only the /search filter bar sets; kept when searching again from the search box. */
const REFINEMENT_KEYS = ["banos", "area", "estrato", "estado", "orden", "asequible"] as const;

export type SearchSelection = {
  mode: SearchMode;
  location?: string;
  tipo?: string;
  habitaciones?: string;
  presupuesto?: string;
  /** The search currently shown on /search, whose refinements carry over. */
  current?: PropertyFilters;
};

/**
 * `/search?…` for what the visitor picked. "Proyectos nuevos" is a sale search
 * filtered to new developments, so it overrides any property type.
 */
export function buildSearchHref({ mode, location, tipo, habitaciones, presupuesto, current }: SearchSelection) {
  const params = new URLSearchParams();
  params.set("operacion", mode === "arrendar" ? "arrendar" : "comprar");

  const type = mode === "proyecto" ? "proyecto" : tipo;
  if (type) params.set("tipo", type);

  const place = location?.trim();
  if (place) params.set("ubicacion", place);
  if (habitaciones) params.set("habitaciones", habitaciones);
  if (presupuesto) params.set("presupuesto", presupuesto);

  for (const key of REFINEMENT_KEYS) {
    const value = current?.[key];
    if (value) params.set(key, value);
  }

  return `/search?${params.toString()}`;
}
