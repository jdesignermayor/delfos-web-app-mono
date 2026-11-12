"use client";

import { useEffect, useId, useRef, useState, type ComponentType, type FocusEvent, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

import { BedIcon, HomeIcon, MapPinIcon, SearchIcon, WalletIcon } from "@/components/icons";
import { BudgetRangePanel } from "@/components/marketing/budget-range-panel";
import { MultiLocationFields, locationsLabel, locationsWithText } from "@/components/marketing/location-fields";
import { BRUTAL_DROPDOWN_MOTION, DROPDOWN_MOTION } from "@/components/marketing/motion-presets";
import {
  BUDGET_OPTIONS,
  BUDGET_RANGE,
  budgetRangeLabel,
  budgetRangeParam,
  parseBudgetRange,
  parseLocations,
  TYPE_LABELS,
  type Operation,
  type PropertyFilters,
  type PropertyType,
} from "@/components/marketing/properties";
import {
  ChoicePanel,
  ROOM_CHOICES,
  TYPE_CHOICES,
  budgetChoices,
  budgetHint,
} from "@/components/marketing/search-choice-panels";
import { useSearchMode, type SearchMode } from "@/components/marketing/search-mode-context";
import { SEARCH_BRUTAL, SearchStyleProvider } from "@/components/marketing/search-style";
import { buildSearchHref } from "@/components/marketing/search-url";
import { useClickOutside } from "@/hooks/use-click-outside";

type Field = "ubicacion" | "tipo" | "habitaciones" | "presupuesto";

/**
 * What the visitor has picked so far, keyed like the /search query params. `ubicacion` is only the
 * text still being typed; the picked places live in their own list.
 */
type Draft = Record<Field, string>;

type Segment = {
  field: Field;
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  placeholder: string;
  disabled?: boolean;
};

const LABELS = {
  full: { ubicacion: "Ubicación", tipo: "Tipo", habitaciones: "Habitaciones", presupuesto: "Presupuesto" },
  compact: { ubicacion: "Ubic.", tipo: "Tipo", habitaciones: "Hab.", presupuesto: "Presup." },
} as const;

/** The order the filters are walked through, one after another. */
const STEP_ORDER: Field[] = ["ubicacion", "tipo", "habitaciones", "presupuesto"];

function initialDraft(filters: PropertyFilters | undefined): Draft {
  return {
    ubicacion: "",
    // "proyecto" comes from the search mode, not the type picker.
    tipo: filters?.tipo === "proyecto" ? "" : (filters?.tipo ?? ""),
    habitaciones: filters?.habitaciones ?? "",
    presupuesto: filters?.presupuesto ?? "",
  };
}

function budgetOperationFor(mode: SearchMode): Operation {
  return mode === "arrendar" ? "arrendar" : "comprar";
}

function buildSegments({
  draft,
  mode,
  compact,
  budgetLabel,
  locationLabel,
}: {
  draft: Draft;
  mode: SearchMode;
  compact: boolean;
  budgetLabel: string;
  locationLabel: string;
}): Segment[] {
  const labels = compact ? LABELS.compact : LABELS.full;
  const isProject = mode === "proyecto";
  const typeLabel = draft.tipo ? TYPE_LABELS[draft.tipo as PropertyType] : "";

  return [
    { field: "ubicacion", icon: MapPinIcon, label: labels.ubicacion, value: locationLabel, placeholder: "Barrio, proyecto o ciudad" },
    {
      field: "tipo",
      icon: HomeIcon,
      label: labels.tipo,
      value: isProject ? "Proyectos nuevos" : typeLabel,
      placeholder: "Cualquiera",
      disabled: isProject,
    },
    {
      field: "habitaciones",
      icon: BedIcon,
      label: labels.habitaciones,
      value: draft.habitaciones ? `${draft.habitaciones}+` : "",
      placeholder: "Cualquiera",
    },
    { field: "presupuesto", icon: WalletIcon, label: labels.presupuesto, value: budgetLabel, placeholder: "Cualquiera" },
  ];
}

/**
 * Minimal segment: no icon, a quiet sans label over a large, readable value, short centred hairline
 * dividers. The open one gets a faint ink wash, a chevron that flips, and an ink bar that slides
 * along the bottom from the previously open segment (shared layout animation).
 */
function BrutalSearchSegment({
  segment,
  active,
  compact,
  showDivider,
  onToggle,
}: {
  segment: Segment;
  active: boolean;
  compact: boolean;
  showDivider: boolean;
  onToggle: () => void;
}) {
  const { field, label, value, placeholder, disabled } = segment;
  return (
    <div className={`flex md:min-w-0 md:items-center ${field === "ubicacion" ? "flex-[1.4]" : "flex-1"}`}>
      {showDivider ? <span aria-hidden="true" className="hidden h-8 w-px shrink-0 bg-ink/25 md:block" /> : null}
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-expanded={active}
        className={`group relative flex min-w-0 flex-1 flex-col justify-center self-stretch text-left transition-colors duration-200 disabled:cursor-default ${SEARCH_BRUTAL.focus} focus-visible:-outline-offset-2 ${
          compact ? "gap-0 px-3 py-1.5" : "gap-1.5 px-6 py-4 md:py-5"
        } ${active ? "bg-ink/[0.07]" : "hover:bg-ink/[0.04] disabled:hover:bg-transparent"}`}
      >
        <span className={compact ? "text-[11px] font-semibold text-ink/70" : SEARCH_BRUTAL.label}>{label}</span>
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={`min-w-0 flex-1 truncate ${compact ? "text-sm" : "text-xl leading-snug"} ${value ? "font-semibold text-ink" : "font-medium text-ink/55"}`}
          >
            {value || placeholder}
          </span>
          {disabled || compact ? null : (
            <ChevronDown
              aria-hidden="true"
              strokeWidth={2.25}
              className={`size-5 shrink-0 text-ink/60 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:text-ink ${active ? "rotate-180 text-ink" : ""}`}
            />
          )}
        </span>
        {active ? (
          <motion.span
            layoutId="segment-indicator"
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[3px] bg-ink"
            transition={{ type: "spring", stiffness: 520, damping: 38 }}
          />
        ) : null}
      </button>
    </div>
  );
}

/**
 * The CTA: a brand-yellow block with ink type, flush with the frame's right edge and split from the
 * fields by an ink rule ("Buscar" spelled out unless compact). Matte pastel yellow + ink is ~14:1.
 */
function BrutalSubmitButton({ compact, buttonRef }: { compact: boolean; buttonRef: RefObject<HTMLButtonElement | null> }) {
  return (
    <button
      ref={buttonRef}
      type="submit"
      aria-label="Buscar"
      className={`group flex shrink-0 items-center justify-center gap-2.5 border-t-[1.5px] border-ink bg-brut-yellow font-semibold text-ink transition-[background-color,scale] duration-200 hover:bg-[#e2d095] active:scale-[0.97] active:duration-75 md:border-l-[1.5px] md:border-t-0 ${SEARCH_BRUTAL.focus} ${
        compact ? "h-10 md:h-auto md:w-11" : "h-16 text-lg md:h-auto md:px-10"
      }`}
    >
      <SearchIcon
        className={`transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-12 group-hover:scale-115 group-active:scale-90 ${compact ? "size-4" : "size-6"}`}
      />
      <span className={compact ? "md:hidden" : ""}>Buscar</span>
    </button>
  );
}

/**
 * The landing's resting state (`collapsible`): one quiet line (a magnifier, where you would like to
 * live or what is picked so far, how many filters are set) and the yellow search block. Hovering,
 * clicking or tabbing into it opens the full bar.
 */
function CollapsedSearchRow({
  summary,
  filterCount,
  onOpen,
  folded,
  compact,
}: {
  summary: string;
  filterCount: number;
  onOpen: () => void;
  /** The full bar is open: this line is folded away and out of the tab order. */
  folded: boolean;
  /** The navbar's version: shorter and smaller. */
  compact: boolean;
}) {
  return (
    <div className={`flex items-stretch ${compact ? "h-10" : "h-14"}`} aria-hidden={folded || undefined}>
      <button
        type="button"
        tabIndex={folded ? -1 : 0}
        onClick={onOpen}
        onFocus={folded ? undefined : onOpen}
        className={`flex min-w-0 flex-1 items-center text-left ${compact ? "gap-2 px-3" : "gap-3 px-5"} ${SEARCH_BRUTAL.focus} focus-visible:-outline-offset-2`}
      >
        <SearchIcon className={`shrink-0 text-ink ${compact ? "size-4" : "size-5"}`} />
        <span
          className={`min-w-0 flex-1 truncate ${compact ? "text-sm" : "text-base"} ${summary ? "font-semibold text-ink" : "font-medium text-ink/55"}`}
        >
          {summary || "¿Dónde quieres vivir?"}
        </span>
        {filterCount > 0 ? (
          <span className="shrink-0 bg-ink px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-white">
            {filterCount} {filterCount === 1 ? "filtro" : "filtros"}
          </span>
        ) : null}
      </button>
      <button
        type="submit"
        aria-label="Buscar"
        tabIndex={-1}
        className={`group flex shrink-0 items-center justify-center border-l-[1.5px] border-ink bg-brut-yellow text-ink transition-colors duration-200 hover:bg-[#e2d095] ${compact ? "w-10" : "w-14"}`}
      >
        <SearchIcon
          className={`transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110 ${compact ? "size-4" : "size-5"}`}
        />
      </button>
    </div>
  );
}

/** One clickable segment of the search pill (icon, label and current value). */
function SearchSegment({
  segment,
  active,
  compact,
  showDivider,
  onToggle,
}: {
  segment: Segment;
  active: boolean;
  compact: boolean;
  showDivider: boolean;
  onToggle: () => void;
}) {
  const { field, icon: Icon, label, value, placeholder, disabled } = segment;
  return (
    <div
      // Location holds free text, so it gets a bit more room than the pickers.
      className={`flex items-center md:min-w-0 ${field === "ubicacion" ? "flex-[1.4]" : "flex-1"}`}
    >
      {showDivider ? <span aria-hidden="true" className="hidden h-8 w-px shrink-0 bg-separator md:block" /> : null}
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-expanded={active}
        className={`group flex min-w-0 flex-1 items-center gap-3 rounded-full text-left transition-[background-color,box-shadow] disabled:cursor-default ${
          compact ? "px-2.5 py-1.5" : "px-3 py-2.5 md:py-1.5"
        } ${
          active
            ? "bg-white shadow-[0_8px_24px_-10px_rgba(15,23,42,0.4)] ring-1 ring-separator"
            : "hover:bg-surface-secondary/70"
        }`}
      >
        <span
          className={`flex ${compact ? "size-7" : "size-10 md:size-9"} shrink-0 items-center justify-center rounded-full transition-colors ${
            active || value ? "bg-accent text-accent-foreground" : "bg-accent-soft text-accent"
          }`}
        >
          <Icon className={compact ? "size-3.5" : "size-5 md:size-[18px]"} />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className={`${compact ? "text-[11px]" : "text-xs"} font-semibold text-foreground`}>{label}</span>
          <span
            className={`truncate ${compact ? "text-xs" : "text-sm"} ${
              value ? "font-semibold text-foreground" : "text-foreground/60"
            }`}
          >
            {value || placeholder}
          </span>
        </span>
      </button>
    </div>
  );
}

function SearchSubmitButton({ compact, buttonRef }: { compact: boolean; buttonRef: RefObject<HTMLButtonElement | null> }) {
  return (
    <div className={`flex shrink-0 ${compact ? "p-1" : "p-1.5"} md:p-0 ${compact ? "md:pl-1" : "md:pl-2 md:pr-0.5"}`}>
      <button
        ref={buttonRef}
        type="submit"
        aria-label="Buscar"
        className={`flex w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-accent-foreground shadow-lg shadow-accent/30 transition-[background-color,transform] hover:bg-accent-hover active:scale-[0.97] ${
          compact ? "h-10 md:w-10" : "h-12 px-6 text-sm md:h-10 md:w-10 md:px-0 md:shadow-md md:shadow-accent/25"
        }`}
      >
        <SearchIcon className={compact ? "size-4" : "size-5 md:size-[18px]"} />
        <span className="md:hidden">Buscar</span>
      </button>
    </div>
  );
}

export function PropertySearch({
  compact = false,
  initialFilters,
  onSearchAction,
  brutal = false,
  align = "center",
  collapsible = false,
}: {
  compact?: boolean;
  /**
   * Landing hero (brutal only): rests as one minimal line and opens into the full bar on hover,
   * click or keyboard focus, and while a filter panel is open. The container carries
   * `data-search-expanded` while open, so a parent can grow with it.
   */
  collapsible?: boolean;
  /** Where the full-size bar sits in its row: centred (default) or flush left, e.g. under a left-set headline. */
  align?: "center" | "start";
  /**
   * The landing's minimal brutalism: a square bar in a thin ink frame, flush segments with mono
   * labels, an ink "Buscar" block, and square dropdown panels (every piece inside follows, through
   * `SearchStyleProvider`).
   */
  brutal?: boolean;
  /** Pre-fills the fields, e.g. with the search currently shown on /search. */
  initialFilters?: PropertyFilters;
  /** Called right before navigating to the results — lets a caller (e.g. a search overlay) close itself. */
  onSearchAction?: () => void;
}) {
  const router = useRouter();
  const { mode } = useSearchMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutId = useId();
  const submitRef = useRef<HTMLButtonElement>(null);
  const [activeField, setActiveField] = useState<Field | null>(null);
  const [draft, setDraft] = useState<Draft>(() => initialDraft(initialFilters));
  // Several places can be picked; listings in any of them match.
  const [places, setPlaces] = useState<string[]>(() => parseLocations(initialFilters?.ubicacion));

  useClickOutside(containerRef, () => setActiveField(null));

  // Collapsible: open while hovered, while focus is inside, or while a panel is open. Leaving waits a
  // beat, so brushing past the edge does not snap it shut.
  const [hovered, setHovered] = useState(false);
  const [focusedInside, setFocusedInside] = useState(false);
  const expanded = !collapsible || hovered || focusedInside || activeField !== null;
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fullRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  function openFromCollapsed() {
    setFocusedInside(true);
    // Keyboard or click: carry focus into the full bar's first field once it is no longer inert.
    requestAnimationFrame(() =>
      fullRowRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true }),
    );
  }
  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusedInside(false);
  }

  const budgetOperation = budgetOperationFor(mode);
  // Buying uses the price-range slider; renting keeps the monthly-rent buckets.
  const usesBudgetRange = budgetOperation === "comprar";
  const budgetOptions = BUDGET_OPTIONS.filter((option) => option.operation === budgetOperation);
  const budgetRange = parseBudgetRange(draft.presupuesto) ?? { min: BUDGET_RANGE.min, max: BUDGET_RANGE.max };
  // A budget only applies while its operation is selected; otherwise it falls
  // back to "no budget" without needing to reset state in an effect.
  const activeBudget = usesBudgetRange
    ? budgetRangeParam(budgetRange)
    : budgetOptions.some((option) => option.value === draft.presupuesto)
      ? draft.presupuesto
      : "";
  const budgetLabel = usesBudgetRange
    ? budgetRangeLabel(budgetRange)
    : (budgetOptions.find((option) => option.value === activeBudget)?.label ?? "");

  const segments = buildSegments({ draft, mode, compact, budgetLabel, locationLabel: locationsLabel(places, draft.ubicacion) });
  const pickedFilters = segments.filter((segment) => segment.field !== "ubicacion" && segment.value && !segment.disabled).length;

  function runSearch() {
    onSearchAction?.();
    router.push(
      buildSearchHref({
        mode,
        location: locationsWithText(places, draft.ubicacion),
        tipo: draft.tipo,
        habitaciones: draft.habitaciones,
        presupuesto: activeBudget,
        current: initialFilters,
      }),
    );
  }

  function toggleField(field: Field) {
    setActiveField((current) => (current === field ? null : field));
  }

  /** The filters in the order they're walked through (the type step is skipped for new projects). */
  const steps = STEP_ORDER.filter((field) => !(field === "tipo" && mode === "proyecto"));

  /**
   * Moves the visitor on to the next filter, so they can fill the search in one pass. After the last
   * one the panel closes and "Buscar" takes focus with a nudge: the next thing to do.
   */
  function advance(from: Field) {
    const next = steps[steps.indexOf(from) + 1];
    if (next) {
      setActiveField(next);
      return;
    }
    setActiveField(null);
    const button = submitRef.current;
    if (!button) return;
    button.focus({ preventScroll: true });
    button.classList.remove("submit-nudge");
    void button.offsetWidth; // restart the animation
    button.classList.add("submit-nudge");
  }

  /** Stores a pick and opens the next filter. */
  function select(field: Field, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    advance(field);
  }

  /**
   * Under every panel: where the visitor is in the sequence, and the way forward — "Siguiente" after
   * places (they're multi-select, so picking doesn't move on), "Omitir" on the single-pick steps,
   * and "Ver resultados" on the last one.
   */
  function renderFooter(field: Field) {
    const index = steps.indexOf(field);
    const next = steps[index + 1];
    const isLast = !next;
    const nextLabel = next ? LABELS.full[next] : "";
    const hasValue = field === "ubicacion" ? places.length > 0 || draft.ubicacion.trim() !== "" : false;
    const forwardLabel = isLast ? "Ver resultados" : field === "ubicacion" && hasValue ? `Siguiente: ${nextLabel}` : `Omitir · ${nextLabel}`;
    const primary = isLast || (field === "ubicacion" && hasValue);

    return (
      <div
        className={`mt-6 flex items-center justify-between gap-4 pt-4 ${brutal ? "border-t-[1.5px] border-ink/10" : "border-t border-separator"}`}
      >
        <div className="flex items-center gap-3">
          {/* Progress: one bar per step, filled up to this one. */}
          <span aria-hidden="true" className="flex gap-1">
            {steps.map((step, i) => (
              <span
                key={step}
                className={`h-1.5 w-5 transition-colors duration-300 ${brutal ? "" : "rounded-full"} ${
                  i <= index ? (brutal ? "bg-ink" : "bg-accent") : brutal ? "bg-ink/15" : "bg-accent-soft"
                }`}
              />
            ))}
          </span>
          <span className={brutal ? "text-sm font-medium text-ink/60" : "text-xs font-medium text-muted"}>
            Paso {index + 1} de {steps.length}
          </span>
        </div>
        <button
          type={isLast ? "submit" : "button"}
          onClick={isLast ? undefined : () => advance(field)}
          className={
            brutal
              ? `group inline-flex min-h-12 items-center gap-2 px-5 text-base font-semibold transition-[background-color,color,scale] duration-200 active:scale-[0.96] active:duration-75 ${SEARCH_BRUTAL.focus} ${
                  primary ? "bg-ink text-white hover:bg-ink/85" : "text-ink/70 hover:bg-ink/[0.05] hover:text-ink"
                }`
              : `group inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors ${
                  primary ? "bg-accent text-accent-foreground hover:bg-accent-hover" : "text-foreground/70 hover:bg-surface-secondary hover:text-foreground"
                }`
          }
        >
          {forwardLabel}
          <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.25} />
        </button>
      </div>
    );
  }


  function renderPanel(field: Field) {
    switch (field) {
      case "ubicacion":
        return (
          // Picking places only fills the field (the panel stays open for more); the search runs on "Buscar".
          <MultiLocationFields
            places={places}
            onPlacesChangeAction={setPlaces}
            text={draft.ubicacion}
            onTextChangeAction={(value) => setDraft((current) => ({ ...current, ubicacion: value }))}
          />
        );
      case "tipo":
        return (
          <ChoicePanel
            title="Tipo de inmueble"
            hint="¿Qué estás buscando?"
            gridClassName="sm:grid-cols-2 lg:grid-cols-3"
            choices={TYPE_CHOICES}
            value={draft.tipo}
            onSelect={(value) => select("tipo", value)}
          />
        );
      case "habitaciones":
        return (
          <ChoicePanel
            title="Habitaciones"
            hint="Mínimo de habitaciones que necesitas"
            gridClassName="grid-cols-2 sm:grid-cols-5"
            choices={ROOM_CHOICES}
            value={draft.habitaciones}
            onSelect={(value) => select("habitaciones", value)}
          />
        );
      case "presupuesto":
        return usesBudgetRange ? (
          <BudgetRangePanel
            hint={budgetHint(budgetOperation)}
            value={budgetRange}
            onChangeAction={(range) => setDraft((current) => ({ ...current, presupuesto: budgetRangeParam(range) }))}
          />
        ) : (
          <ChoicePanel
            title="Presupuesto"
            hint={budgetHint(budgetOperation)}
            gridClassName="sm:grid-cols-2 lg:grid-cols-3"
            choices={budgetChoices(budgetOptions)}
            value={activeBudget}
            onSelect={(value) => select("presupuesto", value)}
          />
        );
    }
  }

  return (
    <SearchStyleProvider value={brutal}>
      {/* Scopes the sliding segment indicator to this bar (the hero and the navbar each have one). */}
      <LayoutGroup id={layoutId}>
      <div
        ref={containerRef}
        data-search-expanded={collapsible && expanded ? "" : undefined}
        onPointerEnter={
          collapsible
            ? (event) => {
                if (event.pointerType !== "mouse") return;
                clearTimeout(leaveTimer.current);
                setHovered(true);
              }
            : undefined
        }
        onPointerLeave={
          collapsible
            ? (event) => {
                if (event.pointerType !== "mouse") return;
                clearTimeout(leaveTimer.current);
                leaveTimer.current = setTimeout(() => setHovered(false), 260);
              }
            : undefined
        }
        onFocus={collapsible ? () => setFocusedInside(true) : undefined}
        onBlur={collapsible ? handleBlur : undefined}
        className={`relative w-full ${
          collapsible
            ? // The navbar's bar sets its own width (narrow at rest, full when open); the hero's parent does it there.
              compact
              ? "mx-auto max-w-xs transition-[max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-[search-expanded]:max-w-2xl motion-reduce:transition-none"
              : ""
            : compact
              ? "max-w-2xl"
              : align === "start"
                ? "max-w-5xl"
                : "mx-auto max-w-3xl"
        }`}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setActiveField(null);
            runSearch();
          }}
        >
          {brutal && collapsible ? (
            // Two stacked rows that trade height (grid 0fr / 1fr) while the parent trades width: the
            // minimal line folds away as the full bar unfolds. The folded full bar is inert; the folded
            // minimal line only leaves the tab order (making it inert would drop the focus it hands on).
            <div className={SEARCH_BRUTAL.frame}>
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  expanded ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <CollapsedSearchRow
                    summary={locationsLabel(places, draft.ubicacion)}
                    filterCount={pickedFilters}
                    onOpen={openFromCollapsed}
                    folded={expanded}
                    compact={compact}
                  />
                </div>
              </div>
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  expanded ? "grid-rows-[1fr] opacity-100 delay-75" : "grid-rows-[0fr] opacity-0"
                }`}
                inert={!expanded}
              >
                <div ref={fullRowRef} className="min-h-0 overflow-hidden">
                  <div className="flex flex-col divide-y-[1.5px] divide-ink/15 md:flex-row md:divide-y-0">
                    {segments.map((segment, index) => (
                      <BrutalSearchSegment
                        key={segment.field}
                        segment={segment}
                        active={activeField === segment.field}
                        compact={compact}
                        showDivider={index > 0}
                        onToggle={() => toggleField(segment.field)}
                      />
                    ))}
                    <BrutalSubmitButton compact={compact} buttonRef={submitRef} />
                  </div>
                </div>
              </div>
            </div>
          ) : brutal ? (
            // Square bar, thin ink frame, no shadow; segments stacked with hairlines on phones, flush in a row from md.
            <div className={`flex flex-col divide-y-[1.5px] divide-ink/15 md:flex-row md:divide-y-0 ${SEARCH_BRUTAL.frame}`}>
              {segments.map((segment, index) => (
                <BrutalSearchSegment
                  key={segment.field}
                  segment={segment}
                  active={activeField === segment.field}
                  compact={compact}
                  showDivider={index > 0}
                  onToggle={() => toggleField(segment.field)}
                />
              ))}
              <BrutalSubmitButton compact={compact} buttonRef={submitRef} />
            </div>
          ) : (
            <div
              className={`overflow-hidden rounded-3xl border border-separator bg-white transition-shadow md:rounded-full ${
                compact
                  ? "shadow-[0_4px_16px_-8px_rgba(15,23,42,0.22)] hover:shadow-[0_8px_24px_-10px_rgba(15,23,42,0.3)]"
                  : "shadow-[0_18px_50px_-24px_rgba(15,23,42,0.35)]"
              }`}
            >
              <div className={`flex flex-col gap-1 p-1.5 md:flex-row md:items-center ${compact ? "md:p-1" : "md:p-1.5"}`}>
                {segments.map((segment, index) => (
                  <SearchSegment
                    key={segment.field}
                    segment={segment}
                    active={activeField === segment.field}
                    compact={compact}
                    showDivider={index > 0}
                    onToggle={() => toggleField(segment.field)}
                  />
                ))}
                <SearchSubmitButton compact={compact} buttonRef={submitRef} />
              </div>
            </div>
          )}

          <AnimatePresence>
            {activeField ? (
              <motion.div
                key={activeField}
                {...(brutal ? BRUTAL_DROPDOWN_MOTION : DROPDOWN_MOTION)}
                className={
                  brutal
                    ? // Square panel, thin ink frame, flat: no offset shadow, no color.
                      "absolute inset-x-0 top-full z-20 mt-2 origin-top border-[1.5px] border-ink bg-white p-5 text-left sm:p-6"
                    : "absolute inset-x-0 top-full z-20 mt-2 origin-top rounded-3xl border border-separator bg-white p-5 text-left shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)]"
                }
              >
                {renderPanel(activeField)}
                {renderFooter(activeField)}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </form>
      </div>
      </LayoutGroup>
    </SearchStyleProvider>
  );
}
