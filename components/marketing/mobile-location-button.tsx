"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { CloseIcon, SearchIcon } from "@/components/icons";
import { BudgetRangePanel } from "@/components/marketing/budget-range-panel";
import {
  MultiLocationFields,
  locationsLabel,
  locationsWithText,
} from "@/components/marketing/location-fields";
import {
  BUDGET_OPTIONS,
  BUDGET_RANGE,
  TYPE_LABELS,
  budgetRangeLabel,
  budgetRangeParam,
  type BudgetRange,
  type PropertyType,
} from "@/components/marketing/properties";
import {
  ROOM_CHOICES,
  TYPE_CHOICES,
  budgetChoices,
  budgetHint,
  type Choice,
} from "@/components/marketing/search-choice-panels";
import { useSearchMode } from "@/components/marketing/search-mode-context";
import { SearchModeTabs } from "@/components/marketing/search-mode-tabs";
import { PlaceChip } from "@/components/marketing/search-option-ui";
import {
  SEARCH_BRUTAL,
  SearchStyleProvider,
} from "@/components/marketing/search-style";
import { buildSearchHref } from "@/components/marketing/search-url";

const ANY_BUDGET: BudgetRange = {
  min: BUDGET_RANGE.min,
  max: BUDGET_RANGE.max,
};
/** Types offered in the sheet: "proyecto" is a search mode (the tabs), not a type. */
const SHEET_TYPES = TYPE_CHOICES.filter(
  (choice) => choice.value !== "proyecto",
);

type Section = "ubicacion" | "tipo" | "habitaciones" | "presupuesto";

/** Locks the page behind the full-screen search and closes it with Escape. */
function useFullScreenSheet(open: boolean, onClose: () => void) {
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

/**
 * The sheet is built ahead of time, while the browser is idle after the page loads, and kept in the
 * DOM (hidden, off-screen): opening it is then only a GPU transform, with nothing to render. If a
 * tap comes first, `build` (on pointer down) builds it before the click lands.
 */
function usePrebuilt() {
  const [built, setBuilt] = useState(false);
  useEffect(() => {
    if (built) return;
    if ("requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(() => setBuilt(true), {
        timeout: 3000,
      });
      return () => window.cancelIdleCallback(handle);
    }
    const timer = globalThis.setTimeout(() => setBuilt(true), 1200);
    return () => globalThis.clearTimeout(timer);
  }, [built]);
  return { built, build: () => setBuilt(true) };
}

/**
 * The sheet's open state, one frame behind `open`, so a sheet that was only just built still starts
 * off-screen and slides in (a CSS transition needs a first frame in the closed state).
 */
function useDeferredOpen(open: boolean, built: boolean) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!built) return;
    const frame = requestAnimationFrame(() => setShown(open));
    return () => cancelAnimationFrame(frame);
  }, [open, built]);
  return shown;
}

/**
 * One filter as a quiet row: its name and what's picked; tapping opens its controls right under it
 * (one at a time). The body is always rendered and folds open with a grid-rows transition, so it's
 * smooth and instant; closed bodies are `inert` (no focus, no screen reader).
 */
function SheetRow({
  title,
  value,
  open,
  onToggle,
  brutal,
  children,
}: {
  title: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  brutal: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={
        brutal ? "border-b border-ink/10" : "border-b border-separator"
      }
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex min-h-16 w-full items-center gap-3 text-left ${brutal ? SEARCH_BRUTAL.focus : "outline-none"}`}
      >
        <span
          className={`flex-1 text-lg font-semibold ${brutal ? "text-ink" : "text-foreground"}`}
        >
          {title}
        </span>
        <span
          className={`max-w-[55%] truncate text-base ${brutal ? "text-ink/55" : "text-muted"}`}
        >
          {value}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`size-5 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${brutal ? "text-ink/50" : "text-muted"} ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden" inert={!open}>
          <div className="pb-6 pt-1">{children}</div>
        </div>
      </div>
    </section>
  );
}

/**
 * Mobile-only search: a compact field in the middle of the navbar that opens every filter in a
 * full-screen sheet, on top of everything (including the header). Rendered in a portal: the
 * header's backdrop blur would otherwise trap a `fixed` sheet inside it.
 *
 * Sober and fast: the search mode as one segmented control, then the four filters as quiet rows
 * (name + what's picked) that open one at a time, in the desktop order; picking a type or a room
 * count moves on to the next row. Large type (16px+, 18px titles), 44–64px targets. The location
 * input filters the place shortcuts as you type and doesn't pop the keyboard on open. A sticky
 * footer holds "Limpiar" and "Ver resultados" with the count of filters set.
 *
 * Opening is instant: the sheet is prebuilt off-screen (`usePrebuilt`) and slides up with a CSS
 * transform on the iOS sheet curve (`.mobile-sheet` in globals.css).
 */
export function MobileLocationButton({ brutal = false }: { brutal?: boolean }) {
  const router = useRouter();
  const { mode } = useSearchMode();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section | null>("ubicacion");
  // Picked places plus the text still being typed; listings in any of the places match.
  const [places, setPlaces] = useState<string[]>([]);
  const [ubicacion, setUbicacion] = useState("");
  const [tipo, setTipo] = useState("");
  const [habitaciones, setHabitaciones] = useState("");
  const [budget, setBudget] = useState<BudgetRange>(ANY_BUDGET);
  const [rentBudget, setRentBudget] = useState("");
  const { built, build } = usePrebuilt();
  const shown = useDeferredOpen(open, built);

  const isRent = mode === "arrendar";
  const isProject = mode === "proyecto";
  const rentOptions = BUDGET_OPTIONS.filter(
    (option) => option.operation === "arrendar",
  );
  const presupuesto = isRent ? rentBudget : budgetRangeParam(budget);
  const budgetLabel = isRent
    ? (rentOptions.find((option) => option.value === rentBudget)?.label ?? "")
    : budgetRangeLabel(budget);
  const placeLabel = locationsLabel(places, ubicacion);
  const typeLabel = !isProject && tipo ? TYPE_LABELS[tipo as PropertyType] : "";
  const roomsLabel = habitaciones ? `${habitaciones}+ hab.` : "";
  const activeCount = [placeLabel, typeLabel, roomsLabel, budgetLabel].filter(
    Boolean,
  ).length;
  const summary = [placeLabel, typeLabel, roomsLabel]
    .filter(Boolean)
    .join(" · ");

  const close = useCallback(() => setOpen(false), []);
  useFullScreenSheet(open, close);

  function toggleSection(next: Section) {
    setSection((current) => (current === next ? null : next));
  }

  function clearAll() {
    setPlaces([]);
    setUbicacion("");
    setTipo("");
    setHabitaciones("");
    setBudget(ANY_BUDGET);
    setRentBudget("");
  }

  function search() {
    setOpen(false);
    router.push(
      buildSearchHref({
        mode,
        location: locationsWithText(places, ubicacion),
        tipo: isProject ? undefined : tipo,
        habitaciones,
        presupuesto: presupuesto || undefined,
      }),
    );
  }

  /** Chips where exactly one is on; picking one can move on to the next row. */
  function chips(
    choices: Choice[],
    value: string,
    onPick: (value: string) => void,
  ) {
    return (
      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => (
          <PlaceChip
            key={choice.value || "any"}
            icon={choice.icon}
            tone={choice.tone}
            label={choice.label}
            selected={value === choice.value}
            onClick={() => onPick(choice.value)}
          />
        ))}
      </div>
    );
  }

  const sheet = (
    // `brutal` (landing): the sheet and every piece inside follow the minimal brutalist look.
    <SearchStyleProvider value={brutal}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar propiedades"
        aria-hidden={!shown}
        inert={!shown}
        data-open={shown}
        className="mobile-sheet light fixed inset-0 z-[70] flex flex-col bg-white"
        style={{ colorScheme: "light" }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            search();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <header
            className={`flex shrink-0 items-center justify-between gap-4 px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] ${
              brutal ? "border-b border-ink/10" : "border-b border-separator"
            }`}
          >
            <h2
              className={`font-display text-xl font-semibold tracking-tight ${brutal ? "text-ink" : "text-foreground"}`}
            >
              Buscar
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar búsqueda"
              className={`-mr-2 flex size-12 items-center justify-center transition-colors ${
                brutal
                  ? `text-ink active:bg-ink/[0.06] ${SEARCH_BRUTAL.focus}`
                  : "rounded-full text-foreground active:bg-surface-secondary"
              }`}
            >
              <CloseIcon className="size-6" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto overscroll-contain px-4">
            <nav
              aria-label="Qué quieres hacer"
              className={`mb-2 mt-4 flex gap-1 p-1 ${brutal ? "bg-ink/[0.04]" : "rounded-full bg-surface-secondary"}`}
            >
              <SearchModeTabs variant={brutal ? "brutalMobile" : "mobile"} />
            </nav>

            <SheetRow
              title="Ubicación"
              value={placeLabel || "Cualquiera"}
              open={section === "ubicacion"}
              onToggle={() => toggleSection("ubicacion")}
              brutal={brutal}
            >
              <MultiLocationFields
                places={places}
                onPlacesChangeAction={setPlaces}
                text={ubicacion}
                onTextChangeAction={setUbicacion}
                autoFocus={false}
                scrollRows
              />
            </SheetRow>

            {isProject ? null : (
              <SheetRow
                title="Tipo"
                value={typeLabel || "Cualquiera"}
                open={section === "tipo"}
                onToggle={() => toggleSection("tipo")}
                brutal={brutal}
              >
                {chips(SHEET_TYPES, tipo, (value) => {
                  setTipo(value);
                  setSection("habitaciones");
                })}
              </SheetRow>
            )}

            <SheetRow
              title="Habitaciones"
              value={roomsLabel || "Todas"}
              open={section === "habitaciones"}
              onToggle={() => toggleSection("habitaciones")}
              brutal={brutal}
            >
              {/* Equal segments in one row: fastest to compare and tap. */}
              <div
                className="grid grid-cols-5 gap-2"
                role="group"
                aria-label="Mínimo de habitaciones"
              >
                {ROOM_CHOICES.map((choice) => {
                  const selected = habitaciones === choice.value;
                  return (
                    <button
                      key={choice.value || "any"}
                      type="button"
                      aria-pressed={selected}
                      aria-label={
                        choice.value
                          ? `${choice.label} ${choice.hint}`
                          : "Todas las habitaciones"
                      }
                      onClick={() => {
                        setHabitaciones(choice.value);
                        setSection("presupuesto");
                      }}
                      className={
                        brutal
                          ? `min-h-12 border text-base font-semibold transition-colors duration-200 ${SEARCH_BRUTAL.focus} ${
                              selected
                                ? "border-ink bg-ink text-white"
                                : "border-ink/15 bg-white text-ink active:bg-ink/[0.06]"
                            }`
                          : `min-h-12 rounded-xl border text-base font-semibold transition-colors ${
                              selected
                                ? "border-foreground bg-foreground text-background"
                                : "border-separator text-foreground"
                            }`
                      }
                    >
                      {choice.value ? choice.label : "Todas"}
                    </button>
                  );
                })}
              </div>
            </SheetRow>

            <SheetRow
              title="Presupuesto"
              value={budgetLabel || "Cualquiera"}
              open={section === "presupuesto"}
              onToggle={() => toggleSection("presupuesto")}
              brutal={brutal}
            >
              {isRent ? (
                <>
                  <p
                    className={`mb-3 text-base ${brutal ? "text-ink/55" : "text-muted"}`}
                  >
                    {budgetHint("arrendar")}
                  </p>
                  {chips(budgetChoices(rentOptions), rentBudget, setRentBudget)}
                </>
              ) : (
                // The panel brings its own "Presupuesto" header; the row already names it.
                <div className="[&>div:first-child]:hidden">
                  <BudgetRangePanel
                    hint={budgetHint("comprar")}
                    value={budget}
                    onChangeAction={setBudget}
                  />
                </div>
              )}
            </SheetRow>
          </div>

          {/* Sticky actions, thumb-reachable. */}
          <div
            className={`flex shrink-0 items-center gap-2 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 ${
              brutal
                ? "border-t border-ink/10 bg-white"
                : "border-t border-separator bg-white"
            }`}
          >
            <button
              type="button"
              onClick={clearAll}
              disabled={activeCount === 0}
              className={`min-h-14 shrink-0 px-3 text-base font-semibold transition-opacity disabled:opacity-35 ${
                brutal ? `text-ink ${SEARCH_BRUTAL.focus}` : "text-foreground"
              }`}
            >
              Limpiar
            </button>
            <button
              type="submit"
              className={
                brutal
                  ? `flex min-h-14 flex-1 items-center justify-center gap-2.5 bg-ink px-4 text-lg font-semibold text-white transition-[background-color,scale] duration-150 active:scale-[0.98] active:bg-ink/85 ${SEARCH_BRUTAL.focus}`
                  : "flex min-h-14 flex-1 items-center justify-center gap-2.5 rounded-full bg-accent px-4 text-lg font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
              }
            >
              Ver resultados{activeCount ? ` (${activeCount})` : ""}
            </button>
          </div>
        </form>
      </div>
    </SearchStyleProvider>
  );

  return (
    <>
      <button
        type="button"
        onPointerDown={build}
        onClick={() => {
          build();
          setOpen(true);
        }}
        aria-label="Buscar propiedades"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={
          brutal
            ? // Landing header: a square field with a thin ink border, 48px tall.
              "flex min-h-12 w-full items-center gap-2.5 border-[1.5px] border-ink bg-white px-3.5 py-1.5 text-left text-ink transition-colors active:bg-delfos-sky outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            : "flex min-h-12 w-full items-center gap-2.5 rounded-full border border-separator bg-white px-4 py-2 text-left text-foreground shadow-[0_2px_10px_-4px_rgba(15,23,42,0.18)]"
        }
      >
        <SearchIcon className="size-5 shrink-0 text-foreground" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[15px] font-semibold">
            {summary || "¿Dónde quieres vivir?"}
          </span>
          <span
            className={`truncate text-[13px] ${brutal ? "text-ink/60" : "text-muted"}`}
          >
            {budgetLabel || "Barrio, tipo, habitaciones, precio"}
          </span>
        </span>
      </button>

      {/* Prebuilt in <body> (see `usePrebuilt`); only ever built on the client, after hydration. */}
      {built ? createPortal(sheet, document.body) : null}
    </>
  );
}
