"use client";

import { useEffect, useId, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, Bath, CalendarClock, Check, ChevronDown, HandCoins, Layers, Ruler, X } from "lucide-react";

import {
  AREA_OPTIONS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  type PropertyFilters,
} from "@/components/marketing/properties";
import { useSearchMode } from "@/components/marketing/search-mode-context";

type Option = { value: string; label: string };
type Icon = ComponentType<{ className?: string }>;

const BATH_OPTIONS: Option[] = ["1", "2", "3"].map((n) => ({ value: n, label: `${n}+ baños` }));
const STRATUM_OPTIONS: Option[] = ["1", "2", "3", "4", "5", "6"].map((n) => ({ value: n, label: `Estrato ${n}` }));

/**
 * Refinements that the main search bar doesn't offer (it already covers
 * operation, location, type, bedrooms and budget), so the two never repeat.
 */
const REFINEMENTS = ["banos", "area", "estrato", "estado", "asequible", "orden"] as const;

const pillBase =
  "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border bg-white px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const pillIdle = "border-separator text-foreground/80 hover:border-foreground/40 hover:text-foreground";
const pillActive = "border-foreground text-foreground";

function FilterDropdown({
  icon: Icon,
  label,
  options,
  value,
  open,
  onOpenChange,
  onSelect,
  align = "left",
}: {
  icon: Icon;
  label: string;
  options: readonly Option[];
  value: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: string | undefined) => void;
  align?: "left" | "right";
}) {
  const listId = useId();
  const selected = options.find((option) => option.value === (value ?? ""));
  const active = Boolean(value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        className={`${pillBase} ${active || open ? pillActive : pillIdle}`}
      >
        <Icon className="size-4 text-muted" />
        {active && selected ? selected.label : label}
        <ChevronDown className={`size-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label={label}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute top-full z-40 mt-2 min-w-52 origin-top rounded-2xl border border-separator bg-white p-1.5 shadow-[0_18px_40px_-16px_rgba(15,23,42,0.3)] ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            {options.map((option) => {
              const isSelected = option.value === (value ?? "");
              return (
                <li key={option.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(option.value || undefined);
                      onOpenChange(false);
                    }}
                    className={`flex w-full items-center justify-between gap-6 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-surface-secondary ${
                      isSelected ? "font-semibold text-foreground" : "text-foreground/80"
                    }`}
                  >
                    {option.label}
                    {isSelected ? <Check className="size-4 text-accent" /> : null}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function SearchFilters({ filters }: { filters: PropertyFilters }) {
  const router = useRouter();
  const { navbarRef } = useSearchMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  // Dock under the sticky site header, whose height varies by breakpoint and open panels.
  useEffect(() => {
    const navbar = navbarRef.current;
    if (!navbar) return;
    const observer = new ResizeObserver(() => setNavbarHeight(navbar.offsetHeight));
    observer.observe(navbar);
    return () => observer.disconnect();
  }, [navbarRef]);

  // Close the open dropdown on an outside click or Escape.
  useEffect(() => {
    if (!openId) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpenId(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenId(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openId]);

  function apply(patch: Partial<PropertyFilters>) {
    const next: PropertyFilters = { ...filters, ...patch };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search", { scroll: false });
  }

  const dropdown = (id: keyof PropertyFilters) => ({
    value: filters[id],
    open: openId === id,
    onOpenChange: (open: boolean) => setOpenId(open ? id : null),
    onSelect: (value: string | undefined) => apply({ [id]: value }),
  });

  const hasRefinements = REFINEMENTS.some((key) => filters[key]);
  const affordable = filters.asequible === "si";

  return (
    <div
      className="sticky z-30 border-b border-separator bg-white/95 backdrop-blur-xl"
      style={{ top: navbarHeight }}
    >
      <div
        ref={containerRef}
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-4 py-3 sm:px-6"
      >
        <FilterDropdown icon={Bath} label="Baños" options={[{ value: "", label: "Cualquiera" }, ...BATH_OPTIONS]} {...dropdown("banos")} />
        <FilterDropdown icon={Ruler} label="Área" options={[{ value: "", label: "Cualquiera" }, ...AREA_OPTIONS]} {...dropdown("area")} />
        <FilterDropdown icon={Layers} label="Estrato" options={[{ value: "", label: "Cualquiera" }, ...STRATUM_OPTIONS]} {...dropdown("estrato")} />
        <FilterDropdown
          icon={CalendarClock}
          label="Estado"
          options={[{ value: "", label: "Cualquiera" }, ...STATUS_OPTIONS]}
          align="right"
          {...dropdown("estado")}
        />

        <button
          type="button"
          onClick={() => apply({ asequible: affordable ? undefined : "si" })}
          aria-pressed={affordable}
          className={`${pillBase} ${affordable ? "border-accent bg-accent-soft text-accent" : pillIdle}`}
        >
          <HandCoins className={`size-4 ${affordable ? "" : "text-muted"}`} />
          VIS / VIP
        </button>

        <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-separator sm:block" />

        <FilterDropdown icon={ArrowUpDown} label="Ordenar" options={SORT_OPTIONS} align="right" {...dropdown("orden")} />

        {hasRefinements ? (
          <button
            type="button"
            onClick={() => apply(Object.fromEntries(REFINEMENTS.map((key) => [key, undefined])))}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            <X className="size-4" />
            Limpiar
          </button>
        ) : null}
      </div>
    </div>
  );
}
