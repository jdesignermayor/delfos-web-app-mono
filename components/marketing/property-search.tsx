"use client";

import { useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { BedIcon, HomeIcon, MapPinIcon, SearchIcon, WalletIcon } from "@/components/icons";
import { LocationFields } from "@/components/marketing/location-fields";
import { DROPDOWN_MOTION } from "@/components/marketing/motion-presets";
import {
  BUDGET_OPTIONS,
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
import { buildSearchHref } from "@/components/marketing/search-url";
import { useClickOutside } from "@/hooks/use-click-outside";

type Field = "ubicacion" | "tipo" | "habitaciones" | "presupuesto";

/** What the visitor has picked so far, keyed like the /search query params. */
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

function initialDraft(filters: PropertyFilters | undefined): Draft {
  return {
    ubicacion: filters?.ubicacion ?? "",
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
}: {
  draft: Draft;
  mode: SearchMode;
  compact: boolean;
  budgetLabel: string;
}): Segment[] {
  const labels = compact ? LABELS.compact : LABELS.full;
  const isProject = mode === "proyecto";
  const typeLabel = draft.tipo ? TYPE_LABELS[draft.tipo as PropertyType] : "";

  return [
    { field: "ubicacion", icon: MapPinIcon, label: labels.ubicacion, value: draft.ubicacion, placeholder: "Barrio, proyecto o ciudad" },
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
          compact ? "px-2.5 py-1.5" : "px-3 py-2.5"
        } ${
          active
            ? "bg-white shadow-[0_8px_24px_-10px_rgba(15,23,42,0.4)] ring-1 ring-separator"
            : "hover:bg-surface-secondary/70"
        }`}
      >
        <span
          className={`flex ${compact ? "size-7" : "size-10"} shrink-0 items-center justify-center rounded-full transition-colors ${
            active || value ? "bg-accent text-accent-foreground" : "bg-accent-soft text-accent"
          }`}
        >
          <Icon className={compact ? "size-3.5" : "size-5"} />
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

function SearchSubmitButton({ compact }: { compact: boolean }) {
  return (
    <div className={`flex shrink-0 ${compact ? "p-1" : "p-1.5"} md:p-0 md:pl-1`}>
      <button
        type="submit"
        aria-label="Buscar"
        className={`flex w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-accent-foreground shadow-lg shadow-accent/30 transition-[background-color,transform] hover:bg-accent-hover active:scale-[0.97] ${
          compact ? "h-10 md:w-10" : "h-12 px-6 text-sm md:w-auto"
        }`}
      >
        <SearchIcon className={compact ? "size-4" : "size-5"} />
        {compact ? <span className="md:hidden">Buscar</span> : "Buscar"}
      </button>
    </div>
  );
}

export function PropertySearch({
  compact = false,
  initialFilters,
  onSearchAction,
}: {
  compact?: boolean;
  /** Pre-fills the fields, e.g. with the search currently shown on /search. */
  initialFilters?: PropertyFilters;
  /** Called right before navigating to the results — lets a caller (e.g. a search overlay) close itself. */
  onSearchAction?: () => void;
}) {
  const router = useRouter();
  const { mode } = useSearchMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeField, setActiveField] = useState<Field | null>(null);
  const [draft, setDraft] = useState<Draft>(() => initialDraft(initialFilters));

  useClickOutside(containerRef, () => setActiveField(null));

  const budgetOperation = budgetOperationFor(mode);
  const budgetOptions = BUDGET_OPTIONS.filter((option) => option.operation === budgetOperation);
  // A budget bucket only applies while its operation is selected; otherwise it
  // falls back to "no budget" without needing to reset state in an effect.
  const activeBudget = budgetOptions.some((option) => option.value === draft.presupuesto) ? draft.presupuesto : "";
  const budgetLabel = budgetOptions.find((option) => option.value === activeBudget)?.label ?? "";

  const segments = buildSegments({ draft, mode, compact, budgetLabel });

  function runSearch(location = draft.ubicacion) {
    onSearchAction?.();
    router.push(
      buildSearchHref({
        mode,
        location,
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

  /** Stores a pick and closes its panel. */
  function select(field: Field, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setActiveField(null);
  }

  function pickLocation(location: string) {
    select("ubicacion", location);
    runSearch(location);
  }

  function renderPanel(field: Field) {
    switch (field) {
      case "ubicacion":
        return (
          <LocationFields
            value={draft.ubicacion}
            onValueChangeAction={(value) => setDraft((current) => ({ ...current, ubicacion: value }))}
            onPickAction={pickLocation}
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
        return (
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
    <div ref={containerRef} className={`relative w-full ${compact ? "max-w-2xl" : "mx-auto max-w-4xl"}`}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setActiveField(null);
          runSearch();
        }}
      >
        <div
          className={`overflow-hidden rounded-3xl border border-separator bg-white transition-shadow md:rounded-full ${
            compact
              ? "shadow-[0_4px_16px_-8px_rgba(15,23,42,0.22)] hover:shadow-[0_8px_24px_-10px_rgba(15,23,42,0.3)]"
              : "shadow-[0_18px_50px_-24px_rgba(15,23,42,0.35)]"
          }`}
        >
          <div className={`flex flex-col gap-1 p-1.5 md:flex-row md:items-center ${compact ? "md:p-1" : "md:p-2"}`}>
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
            <SearchSubmitButton compact={compact} />
          </div>
        </div>

        <AnimatePresence>
          {activeField ? (
            <motion.div
              key={activeField}
              {...DROPDOWN_MOTION}
              className="absolute inset-x-0 top-full z-20 mt-2 origin-top rounded-3xl border border-separator bg-white p-5 text-left shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)]"
            >
              {renderPanel(activeField)}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </form>
    </div>
  );
}
