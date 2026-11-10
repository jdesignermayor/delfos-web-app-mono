"use client";

import { useEffect, useId, useRef, useState, type ComponentType, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpDown,
  Bath,
  BedDouble,
  Building,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  HandCoins,
  HardHat,
  House,
  Layers,
  MapPin,
  Ruler,
  SlidersHorizontal,
  Trees,
  Wallet,
  X,
} from "lucide-react";

import { BudgetRangePanel } from "@/components/marketing/budget-range-panel";
import { LocationFields } from "@/components/marketing/location-fields";
import {
  AFFORDABLE_OPTIONS,
  AREA_OPTIONS,
  BUDGET_OPTIONS,
  BUDGET_RANGE,
  budgetRangeLabel,
  budgetRangeParam,
  DELIVERY_OPTIONS,
  ELEVATOR_OPTIONS,
  MORE_FILTER_KEYS,
  parseAmenityFilter,
  parseBudgetRange,
  parseLocations,
  placeShortName,
  locationsParam,
  withPlace,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  TOWER_COUNT_OPTIONS,
  TYPE_LABELS,
  type BudgetRange,
  type PropertyFilters,
} from "@/components/marketing/properties";
import { budgetHint } from "@/components/marketing/search-choice-panels";
import { MobileSearchFilters } from "@/components/marketing/mobile-search-filters";
import { useSearchMode } from "@/components/marketing/search-mode-context";

type Option = { value: string; label: string };
type Icon = ComponentType<{ className?: string }>;

/** Values the bar can't hard-code: what the listings actually have. */
export type SearchFilterOptions = { developers: string[]; amenities: string[] };

const ANY: Option = { value: "", label: "Cualquiera" };
const TYPE_OPTIONS: Option[] = (["apartamento", "casa", "apartaestudio"] as const).map((value) => ({
  value,
  label: TYPE_LABELS[value],
}));
const ROOM_OPTIONS: Option[] = ["1", "2", "3", "4"].map((n) => ({ value: n, label: `${n}+ hab.` }));
const BATH_OPTIONS: Option[] = ["1", "2", "3"].map((n) => ({ value: n, label: `${n}+ baños` }));
const STRATUM_OPTIONS: Option[] = ["1", "2", "3", "4", "5", "6"].map((n) => ({ value: n, label: `Estrato ${n}` }));
const RENT_BUDGET_OPTIONS: Option[] = BUDGET_OPTIONS.filter((option) => option.operation === "arrendar");
const FULL_BUDGET: BudgetRange = { min: BUDGET_RANGE.min, max: BUDGET_RANGE.max };

/**
 * What "Limpiar filtros" leaves: only the search mode tab (comprar / arrendar / proyecto). The bar's
 * refinements and the main search bar's filters (location, type, bedrooms, budget) all go.
 */
function clearedFilters(filters: PropertyFilters): PropertyFilters {
  return {
    operacion: filters.operacion,
    tipo: filters.tipo === "proyecto" ? filters.tipo : undefined,
  };
}

const pillBase =
  "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border bg-white px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default";
const pillIdle = "border-separator text-foreground/80 hover:border-foreground/40 hover:text-foreground";
const pillActive = "border-foreground text-foreground";
const panelClass =
  "absolute top-full z-40 mt-2 origin-top rounded-2xl border border-separator bg-white shadow-[0_18px_40px_-16px_rgba(15,23,42,0.3)]";
const applyButtonClass =
  "inline-flex h-9 items-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover";

/**
 * A filter pill with a panel under it. The pill shows `display` (the current value) when set,
 * else `label`. Icons only show on very wide screens, so the whole bar fits in one line from `xl` up.
 */
function FilterPopover({
  icon: Icon,
  label,
  display,
  open,
  onToggle,
  align = "left",
  panelClassName = "",
  disabled = false,
  children,
}: {
  icon: Icon;
  label: string;
  display?: string;
  open: boolean;
  onToggle: () => void;
  align?: "left" | "right";
  panelClassName?: string;
  disabled?: boolean;
  children?: ReactNode;
}) {
  const panelId = useId();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={`${pillBase} ${display || open ? pillActive : pillIdle}`}
      >
        <Icon className="hidden size-4 text-muted 2xl:block" />
        <span className="max-w-40 truncate">{display || label}</span>
        {disabled ? null : (
          <ChevronDown className={`size-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={panelId}
            aria-label={label}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`${panelClass} ${align === "right" ? "right-0" : "left-0"} ${panelClassName}`}
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** A pill whose panel is a single-choice list; picking an option applies it and closes the panel. */
function FilterDropdown({
  icon,
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
  const selected = value ? options.find((option) => option.value === value) : undefined;

  return (
    <FilterPopover
      icon={icon}
      label={label}
      display={selected?.label ?? (value || undefined)}
      open={open}
      onToggle={() => onOpenChange(!open)}
      align={align}
      panelClassName="max-h-80 min-w-52 overflow-y-auto p-1.5"
    >
      <ul role="listbox" aria-label={label}>
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
      </ul>
    </FilterPopover>
  );
}

/**
 * Multi-select location: tick any number of place shortcuts and/or type places (Enter adds each),
 * then "Aplicar". Listings in any of the picked places match.
 */
function LocationFilter({
  value,
  open,
  onOpenChange,
  onApply,
}: {
  value: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (value: string | undefined) => void;
}) {
  const current = parseLocations(value);
  const [places, setPlaces] = useState<string[]>(current);
  const [text, setText] = useState("");

  const display =
    current.length > 1 ? `${placeShortName(current[0])} +${current.length - 1}` : current[0];

  function togglePlace(place: string) {
    setPlaces((list) => (list.includes(place) ? list.filter((item) => item !== place) : withPlace(list, place)));
  }

  function applyPlaces() {
    const typed = text.trim();
    onApply(locationsParam(typed ? withPlace(places, typed) : places));
    onOpenChange(false);
  }

  return (
    <FilterPopover
      icon={MapPin}
      label="Ubicación"
      display={display}
      open={open}
      onToggle={() => {
        if (!open) {
          setPlaces(current);
          setText("");
        }
        onOpenChange(!open);
      }}
      panelClassName="w-[min(28rem,calc(100vw-2rem))] p-4"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          // Enter adds the typed place to the list; with nothing typed it applies the selection.
          const typed = text.trim();
          if (typed) {
            setPlaces((list) => withPlace(list, typed));
            setText("");
          } else {
            applyPlaces();
          }
        }}
      >
        {places.length ? (
          <ul className="mb-4 flex flex-wrap gap-2" aria-label="Ubicaciones seleccionadas">
            {places.map((place) => (
              <li key={place}>
                <button
                  type="button"
                  onClick={() => togglePlace(place)}
                  aria-label={`Quitar ${place}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-sm font-medium text-background transition-opacity hover:opacity-80"
                >
                  {place}
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <LocationFields
          value={text}
          onValueChangeAction={setText}
          onPickAction={togglePlace}
          selected={places}
          placeholder="Escribe un barrio o ciudad y presiona Enter"
        />

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setPlaces([]);
              setText("");
            }}
            disabled={!places.length && !text}
            className="text-sm font-medium text-muted transition-colors hover:text-foreground disabled:opacity-40"
          >
            Quitar todas
          </button>
          <button type="button" onClick={applyPlaces} className={applyButtonClass}>
            Aplicar{places.length > 1 ? ` (${places.length})` : ""}
          </button>
        </div>
      </form>
    </FilterPopover>
  );
}

/** Buying: the price-range slider, applied on "Aplicar". */
function BudgetRangeFilter({
  value,
  open,
  onOpenChange,
  onApply,
}: {
  value: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (value: string | undefined) => void;
}) {
  const current = parseBudgetRange(value) ?? FULL_BUDGET;
  const [draft, setDraft] = useState<BudgetRange>(current);

  return (
    <FilterPopover
      icon={Wallet}
      label="Presupuesto"
      display={budgetRangeLabel(current) || undefined}
      open={open}
      onToggle={() => {
        if (!open) setDraft(current);
        onOpenChange(!open);
      }}
      panelClassName="w-[min(26rem,calc(100vw-2rem))] p-5"
    >
      <BudgetRangePanel hint={budgetHint("comprar")} value={draft} onChangeAction={setDraft} />
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className={applyButtonClass}
          onClick={() => {
            onApply(budgetRangeParam(draft) || undefined);
            onOpenChange(false);
          }}
        >
          Aplicar
        </button>
      </div>
    </FilterPopover>
  );
}

/** Multi-select of common areas; each tick applies right away and the panel stays open. */
function AmenitiesFilter({
  options,
  value,
  open,
  onOpenChange,
  onApply,
}: {
  options: string[];
  value: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (value: string | undefined) => void;
}) {
  const selected = parseAmenityFilter(value);

  function toggle(name: string) {
    const next = selected.includes(name) ? selected.filter((item) => item !== name) : [...selected, name];
    onApply(next.length ? next.join(",") : undefined);
  }

  return (
    <FilterPopover
      icon={Trees}
      label="Zonas comunes"
      display={selected.length ? `Zonas comunes (${selected.length})` : undefined}
      open={open}
      onToggle={() => onOpenChange(!open)}
      align="right"
      panelClassName="max-h-80 w-64 overflow-y-auto p-1.5"
    >
      {options.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted">No hay zonas comunes registradas.</p>
      ) : (
        <ul aria-label="Zonas comunes">
          {options.map((name) => {
            const checked = selected.includes(name);
            return (
              <li key={name}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => toggle(name)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-surface-secondary ${
                    checked ? "font-semibold text-foreground" : "text-foreground/80"
                  }`}
                >
                  <span
                    className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                      checked ? "border-accent bg-accent text-accent-foreground" : "border-separator"
                    }`}
                  >
                    {checked ? <Check className="size-3" /> : null}
                  </span>
                  {name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </FilterPopover>
  );
}

export function SearchFilters({ filters, options }: { filters: PropertyFilters; options: SearchFilterOptions }) {
  const router = useRouter();
  const { navbarRef } = useSearchMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const moreId = useId();
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const activeMore = MORE_FILTER_KEYS.filter((key) => filters[key]).length;
  // Start expanded when the URL already uses one of the extra filters, so it's visible.
  const [moreOpen, setMoreOpen] = useState(activeMore > 0);

  // Dock under the sticky site header, whose height varies by breakpoint and open panels.
  useEffect(() => {
    const navbar = navbarRef.current;
    if (!navbar) return;
    const observer = new ResizeObserver(() => setNavbarHeight(navbar.offsetHeight));
    observer.observe(navbar);
    return () => observer.disconnect();
  }, [navbarRef]);

  // Close the open panel on an outside click or Escape.
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

  function navigate(next: PropertyFilters) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search", { scroll: false });
  }

  function apply(patch: Partial<PropertyFilters>) {
    navigate({ ...filters, ...patch });
  }

  /** Open state for the panel `id`. */
  const panel = (id: string) => ({
    open: openId === id,
    onOpenChange: (open: boolean) => setOpenId(open ? id : null),
  });

  /** Props for a single-choice dropdown bound to the filter `id`. */
  const dropdown = (id: keyof PropertyFilters) => ({
    ...panel(id),
    value: filters[id],
    onSelect: (value: string | undefined) => apply({ [id]: value }),
  });

  const cleared = clearedFilters(filters);
  const hasFilters = (Object.keys(filters) as (keyof PropertyFilters)[]).some(
    (key) => filters[key] && filters[key] !== cleared[key],
  );
  const isProject = filters.tipo === "proyecto";
  const renting = filters.operacion === "arrendar";

  return (
    <div
      className="sticky z-30 border-b border-separator bg-white/95 backdrop-blur-xl"
      style={{ top: navbarHeight }}
    >
      {/* Phones: "Filtros" + "Ordenar", with every filter (and the buy/rent/new mode) in a full-screen sheet. */}
      <div className="px-4 py-2.5 md:hidden">
        <MobileSearchFilters filters={filters} options={options} />
      </div>

      <div ref={containerRef} className="mx-auto hidden max-w-6xl px-4 py-3 sm:px-6 md:block lg:max-w-none">
        <div className="flex flex-wrap items-center justify-center gap-2 xl:flex-nowrap">
          <LocationFilter
            value={filters.ubicacion}
            {...panel("ubicacion")}
            onApply={(ubicacion) => apply({ ubicacion })}
          />
          {isProject ? (
            // "Proyectos nuevos" comes from the search mode tabs, not from this picker.
            <FilterPopover icon={House} label="Tipo" display="Proyectos nuevos" open={false} onToggle={() => {}} disabled />
          ) : (
            <FilterDropdown icon={House} label="Tipo" options={[ANY, ...TYPE_OPTIONS]} {...dropdown("tipo")} />
          )}
          <FilterDropdown icon={BedDouble} label="Habitaciones" options={[ANY, ...ROOM_OPTIONS]} {...dropdown("habitaciones")} />
          <FilterDropdown icon={Bath} label="Baños" options={[ANY, ...BATH_OPTIONS]} {...dropdown("banos")} />
          <FilterDropdown icon={Ruler} label="Área" options={[ANY, ...AREA_OPTIONS]} {...dropdown("area")} />
          {renting ? (
            <FilterDropdown icon={Wallet} label="Presupuesto" options={[ANY, ...RENT_BUDGET_OPTIONS]} {...dropdown("presupuesto")} />
          ) : (
            <BudgetRangeFilter
              value={filters.presupuesto}
              {...panel("presupuesto")}
              onApply={(presupuesto) => apply({ presupuesto })}
            />
          )}
          <FilterDropdown icon={HandCoins} label="VIS / No VIS" options={[ANY, ...AFFORDABLE_OPTIONS]} {...dropdown("asequible")} />

          <button
            type="button"
            onClick={() => {
              setOpenId(null);
              setMoreOpen((open) => !open);
            }}
            aria-expanded={moreOpen}
            aria-controls={moreId}
            className={`${pillBase} ${moreOpen || activeMore ? pillActive : pillIdle}`}
          >
            <SlidersHorizontal className="hidden size-4 text-muted 2xl:block" />
            Más filtros
            {activeMore ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                {activeMore}
              </span>
            ) : null}
            <ChevronDown className={`size-3.5 text-muted transition-transform ${moreOpen ? "rotate-180" : ""}`} />
          </button>

          <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-separator sm:block" />

          <FilterDropdown icon={ArrowUpDown} label="Ordenar" options={SORT_OPTIONS} align="right" {...dropdown("orden")} />

          <button
            type="button"
            onClick={() => navigate(cleared)}
            disabled={!hasFilters}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <X className="size-4" />
            Limpiar filtros
          </button>
        </div>

        <AnimatePresence initial={false}>
          {moreOpen ? (
            <motion.div
              id={moreId}
              key="more-filters"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="mt-3 flex flex-wrap items-center justify-center gap-2 border-t border-separator pt-3"
            >
              <FilterDropdown icon={Layers} label="Estrato" options={[ANY, ...STRATUM_OPTIONS]} {...dropdown("estrato")} />
              <FilterDropdown icon={HardHat} label="Estado" options={[ANY, ...STATUS_OPTIONS]} {...dropdown("estado")} />
              <FilterDropdown icon={ArrowUpDown} label="Ascensores" options={[ANY, ...ELEVATOR_OPTIONS]} {...dropdown("ascensores")} />
              <FilterDropdown
                icon={Building2}
                label="Constructora"
                options={[ANY, ...options.developers.map((name) => ({ value: name, label: name }))]}
                {...dropdown("constructora")}
              />
              <FilterDropdown
                icon={Building}
                label="Cantidad de torres"
                options={[ANY, ...TOWER_COUNT_OPTIONS]}
                {...dropdown("torres")}
              />
              <FilterDropdown
                icon={CalendarClock}
                label="Plazo de entrega"
                options={[ANY, ...DELIVERY_OPTIONS]}
                align="right"
                {...dropdown("entrega")}
              />
              <AmenitiesFilter
                options={options.amenities}
                value={filters.zonas}
                {...panel("zonas")}
                onApply={(zonas) => apply({ zonas })}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
