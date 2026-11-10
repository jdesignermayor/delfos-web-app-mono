"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpDown, Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";

import { CloseIcon } from "@/components/icons";
import { BudgetRangePanel } from "@/components/marketing/budget-range-panel";
import { LocationFields } from "@/components/marketing/location-fields";
import {
  AFFORDABLE_OPTIONS,
  AREA_OPTIONS,
  BUDGET_OPTIONS,
  BUDGET_RANGE,
  budgetRangeParam,
  DELIVERY_OPTIONS,
  ELEVATOR_OPTIONS,
  locationsParam,
  parseAmenityFilter,
  parseBudgetRange,
  parseLocations,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  TOWER_COUNT_OPTIONS,
  TYPE_LABELS,
  withPlace,
  type PropertyFilters,
} from "@/components/marketing/properties";
import { budgetHint } from "@/components/marketing/search-choice-panels";
import { SEARCH_MODES, useSearchMode, type SearchMode } from "@/components/marketing/search-mode-context";

type Option = { value: string; label: string };

const TYPE_OPTIONS: Option[] = (["apartamento", "casa", "apartaestudio"] as const).map((value) => ({
  value,
  label: TYPE_LABELS[value],
}));
const ROOM_OPTIONS: Option[] = ["1", "2", "3", "4"].map((n) => ({ value: n, label: `${n}+` }));
const BATH_OPTIONS: Option[] = ["1", "2", "3"].map((n) => ({ value: n, label: `${n}+` }));
const STRATUM_OPTIONS: Option[] = ["1", "2", "3", "4", "5", "6"].map((n) => ({ value: n, label: n }));
const RENT_BUDGET_OPTIONS: Option[] = BUDGET_OPTIONS.filter((option) => option.operation === "arrendar");

/** Filters that don't count as "applied" in the button badge: the mode and the sort order. */
function activeCount(filters: PropertyFilters) {
  return (Object.keys(filters) as (keyof PropertyFilters)[]).filter((key) => {
    if (!filters[key] || key === "operacion" || key === "orden") return false;
    return !(key === "tipo" && filters.tipo === "proyecto");
  }).length;
}

const modeOf = (filters: PropertyFilters): SearchMode =>
  filters.tipo === "proyecto" ? "proyecto" : filters.operacion === "arrendar" ? "arrendar" : "comprar";

function toQuery(filters: PropertyFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

/** Locks the page behind the sheet and closes it with Escape. */
function useSheetLock(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-separator py-5 last:border-b-0">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors ${
        selected ? "border-foreground bg-foreground text-background" : "border-separator text-foreground/80"
      }`}
    >
      {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
      {children}
    </button>
  );
}

/** Single choice; tapping the selected chip again clears it ("cualquiera"). */
function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: readonly Option[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Chip
          key={option.value}
          selected={value === option.value}
          onClick={() => onChange(value === option.value ? undefined : option.value)}
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
}

/**
 * Phones: the bar is just "Filtros" and "Ordenar"; "Filtros" opens every filter full screen, applied
 * together with "Ver resultados". Rendered in a portal so the sticky bar's blur can't trap it.
 */
export function MobileSearchFilters({
  filters,
  options,
}: {
  filters: PropertyFilters;
  options: { developers: string[]; amenities: string[] };
}) {
  const router = useRouter();
  const { setMode } = useSearchMode();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PropertyFilters>(filters);
  const [placeText, setPlaceText] = useState("");

  const close = useCallback(() => setOpen(false), []);
  useSheetLock(open, close);

  const count = activeCount(filters);
  const draftMode = modeOf(draft);
  const renting = draftMode === "arrendar";
  const places = parseLocations(draft.ubicacion);
  const amenities = parseAmenityFilter(draft.zonas);

  function openSheet() {
    setDraft(filters);
    setPlaceText("");
    setOpen(true);
  }

  const set = (patch: Partial<PropertyFilters>) => setDraft((current) => ({ ...current, ...patch }));

  function changeMode(mode: SearchMode) {
    setDraft((current) => {
      const wasRenting = current.operacion === "arrendar";
      const willRent = mode === "arrendar";
      return {
        ...current,
        operacion: willRent ? "arrendar" : "comprar",
        tipo: mode === "proyecto" ? "proyecto" : current.tipo === "proyecto" ? undefined : current.tipo,
        // Buying budgets are price ranges, renting ones monthly buckets: they don't carry over.
        presupuesto: wasRenting === willRent ? current.presupuesto : undefined,
      };
    });
  }

  function addTypedPlace() {
    const typed = placeText.trim();
    if (!typed) return;
    set({ ubicacion: locationsParam(withPlace(places, typed)) });
    setPlaceText("");
  }

  function togglePlace(place: string) {
    set({ ubicacion: locationsParam(places.includes(place) ? places.filter((item) => item !== place) : withPlace(places, place)) });
  }

  function toggleAmenity(name: string) {
    const next = amenities.includes(name) ? amenities.filter((item) => item !== name) : [...amenities, name];
    set({ zonas: next.length ? next.join(",") : undefined });
  }

  function showResults() {
    const typed = placeText.trim();
    const next = typed ? { ...draft, ubicacion: locationsParam(withPlace(places, typed)) } : draft;
    setMode(modeOf(next));
    setOpen(false);
    router.push(toQuery(next), { scroll: false });
  }

  function clearAll() {
    setDraft((current) => ({ operacion: current.operacion, tipo: current.tipo === "proyecto" ? "proyecto" : undefined }));
    setPlaceText("");
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openSheet}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-separator bg-white px-4 text-sm font-semibold text-foreground"
        >
          <SlidersHorizontal className="size-4" />
          Filtros
          {count ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              {count}
            </span>
          ) : null}
        </button>

        {/* A native select: the phone's own picker is the best UI for a short list. */}
        <label className="relative flex h-10 shrink-0 items-center rounded-full border border-separator bg-white pl-3.5 pr-8 text-sm font-semibold text-foreground">
          <ArrowUpDown className="mr-2 size-4 text-muted" />
          <span className="sr-only">Ordenar</span>
          {SORT_OPTIONS.find((option) => option.value === (filters.orden ?? ""))?.label ?? "Ordenar"}
          <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted" />
          <select
            value={filters.orden ?? ""}
            onChange={(event) => router.push(toQuery({ ...filters, orden: event.target.value || undefined }), { scroll: false })}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {open
        ? createPortal(
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filtros"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="light fixed inset-0 z-[70] flex flex-col bg-white"
              style={{ colorScheme: "light" }}
            >
              <header className="flex shrink-0 items-center justify-between gap-4 border-b border-separator px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
                <h2 className="font-display text-lg font-semibold text-foreground">Filtros</h2>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Cerrar filtros"
                  className="flex size-10 items-center justify-center rounded-full bg-surface-secondary text-foreground"
                >
                  <CloseIcon className="size-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto overscroll-contain px-4">
                <Section title="Operación">
                  <ChipGroup
                    options={SEARCH_MODES}
                    value={draftMode}
                    onChange={(value) => changeMode((value as SearchMode | undefined) ?? draftMode)}
                  />
                </Section>

                <Section title="Ubicación">
                  {places.length ? (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {places.map((place) => (
                        <button
                          key={place}
                          type="button"
                          onClick={() => togglePlace(place)}
                          aria-label={`Quitar ${place}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-sm font-medium text-background"
                        >
                          {place}
                          <X className="size-3.5" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      addTypedPlace();
                    }}
                  >
                    <LocationFields
                      value={placeText}
                      onValueChangeAction={setPlaceText}
                      onPickAction={togglePlace}
                      selected={places}
                      placeholder="Escribe un barrio o ciudad y presiona Enter"
                    />
                  </form>
                </Section>

                {draftMode === "proyecto" ? null : (
                  <Section title="Tipo">
                    <ChipGroup options={TYPE_OPTIONS} value={draft.tipo} onChange={(tipo) => set({ tipo })} />
                  </Section>
                )}

                <Section title="Habitaciones">
                  <ChipGroup options={ROOM_OPTIONS} value={draft.habitaciones} onChange={(habitaciones) => set({ habitaciones })} />
                </Section>

                <Section title="Baños">
                  <ChipGroup options={BATH_OPTIONS} value={draft.banos} onChange={(banos) => set({ banos })} />
                </Section>

                <Section title="Área">
                  <ChipGroup options={AREA_OPTIONS} value={draft.area} onChange={(area) => set({ area })} />
                </Section>

                {renting ? (
                  <Section title="Presupuesto">
                    <ChipGroup options={RENT_BUDGET_OPTIONS} value={draft.presupuesto} onChange={(presupuesto) => set({ presupuesto })} />
                  </Section>
                ) : (
                  <section className="border-b border-separator py-5">
                    <BudgetRangePanel
                      hint={budgetHint("comprar")}
                      value={parseBudgetRange(draft.presupuesto) ?? { min: BUDGET_RANGE.min, max: BUDGET_RANGE.max }}
                      onChangeAction={(range) => set({ presupuesto: budgetRangeParam(range) || undefined })}
                    />
                  </section>
                )}

                <Section title="VIS / No VIS">
                  <ChipGroup options={AFFORDABLE_OPTIONS} value={draft.asequible} onChange={(asequible) => set({ asequible })} />
                </Section>

                <Section title="Estrato">
                  <ChipGroup options={STRATUM_OPTIONS} value={draft.estrato} onChange={(estrato) => set({ estrato })} />
                </Section>

                <Section title="Estado">
                  <ChipGroup options={STATUS_OPTIONS} value={draft.estado} onChange={(estado) => set({ estado })} />
                </Section>

                <Section title="Ascensores">
                  <ChipGroup options={ELEVATOR_OPTIONS} value={draft.ascensores} onChange={(ascensores) => set({ ascensores })} />
                </Section>

                {options.developers.length ? (
                  <Section title="Constructora">
                    <ChipGroup
                      options={options.developers.map((name) => ({ value: name, label: name }))}
                      value={draft.constructora}
                      onChange={(constructora) => set({ constructora })}
                    />
                  </Section>
                ) : null}

                <Section title="Cantidad de torres">
                  <ChipGroup options={TOWER_COUNT_OPTIONS} value={draft.torres} onChange={(torres) => set({ torres })} />
                </Section>

                <Section title="Plazo de entrega">
                  <ChipGroup options={DELIVERY_OPTIONS} value={draft.entrega} onChange={(entrega) => set({ entrega })} />
                </Section>

                {options.amenities.length ? (
                  <Section title="Zonas comunes">
                    <div className="flex flex-wrap gap-2">
                      {options.amenities.map((name) => (
                        <Chip key={name} selected={amenities.includes(name)} onClick={() => toggleAmenity(name)}>
                          {name}
                        </Chip>
                      ))}
                    </div>
                  </Section>
                ) : null}
              </div>

              <footer className="flex shrink-0 items-center gap-3 border-t border-separator px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
                <button type="button" onClick={clearAll} className="px-2 text-sm font-semibold text-foreground underline underline-offset-4">
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={showResults}
                  className="flex flex-1 items-center justify-center rounded-full bg-accent px-4 py-3 text-base font-semibold text-accent-foreground"
                >
                  Ver resultados
                </button>
              </footer>
            </motion.div>,
            document.body,
          )
        : null}
    </>
  );
}
