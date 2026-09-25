"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { SlidersIcon } from "@/components/icons";
import {
  BUDGET_OPTIONS,
  TYPE_LABELS,
  type Operation,
  type PropertyFilters,
  type PropertyType,
} from "@/components/marketing/properties";
import { useSearchMode } from "@/components/marketing/search-mode-context";

const TYPE_OPTIONS = Object.entries(TYPE_LABELS) as [PropertyType, string][];

const controlClass =
  "h-9 rounded-full border border-separator bg-surface px-3.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25";

export function SearchFilters({ filters }: { filters: PropertyFilters }) {
  const router = useRouter();
  const { navbarRef } = useSearchMode();
  const [navbarHeight, setNavbarHeight] = useState(0);

  // Dock under the sticky site header, whose height varies by breakpoint and open panels.
  useEffect(() => {
    const navbar = navbarRef.current;
    if (!navbar) return;
    const observer = new ResizeObserver(() => setNavbarHeight(navbar.offsetHeight));
    observer.observe(navbar);
    return () => observer.disconnect();
  }, [navbarRef]);

  const operacion: Operation = filters.operacion === "arrendar" ? "arrendar" : "comprar";
  const budgetOptions = BUDGET_OPTIONS.filter((option) => option.operation === operacion);

  function apply(patch: Partial<PropertyFilters>) {
    const next: PropertyFilters = { ...filters, ...patch };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }

  const hasExtraFilters = Boolean(
    filters.tipo || filters.habitaciones || filters.presupuesto || filters.asequible || filters.ubicacion,
  );

  return (
    <div
      className="sticky z-30 border-b border-separator bg-background/90 backdrop-blur-xl"
      style={{ top: navbarHeight }}
    >
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6">
        {/* Operation */}
        <div className="flex shrink-0 rounded-full bg-surface-secondary p-0.5">
          {(["comprar", "arrendar"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => apply({ operacion: value, presupuesto: undefined })}
              className={`h-8 rounded-full px-3.5 text-sm font-medium capitalize transition-colors ${
                operacion === value
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {value === "comprar" ? "Comprar" : "Arrendar"}
            </button>
          ))}
        </div>

        <select
          aria-label="Tipo de propiedad"
          value={filters.tipo ?? ""}
          onChange={(event) => apply({ tipo: event.target.value || undefined })}
          className={`shrink-0 ${controlClass}`}
        >
          <option value="">Tipo</option>
          {TYPE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          aria-label="Habitaciones"
          value={filters.habitaciones ?? ""}
          onChange={(event) => apply({ habitaciones: event.target.value || undefined })}
          className={`shrink-0 ${controlClass}`}
        >
          <option value="">Habitaciones</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>

        <select
          aria-label="Presupuesto"
          value={filters.presupuesto ?? ""}
          onChange={(event) => apply({ presupuesto: event.target.value || undefined })}
          className={`shrink-0 ${controlClass}`}
        >
          <option value="">Presupuesto</option>
          {budgetOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => apply({ asequible: filters.asequible === "si" ? undefined : "si" })}
          className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors ${
            filters.asequible === "si"
              ? "border-accent bg-accent-soft text-accent"
              : "border-separator bg-surface text-muted hover:text-foreground"
          }`}
        >
          <SlidersIcon className="size-4" />
          VIS / VIP
        </button>

        {hasExtraFilters ? (
          <button
            type="button"
            onClick={() => apply({ tipo: undefined, habitaciones: undefined, presupuesto: undefined, asequible: undefined, ubicacion: undefined })}
            className="shrink-0 px-2 text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            Limpiar
          </button>
        ) : null}
      </div>
    </div>
  );
}
