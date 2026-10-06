"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BedDouble,
  BedSingle,
  Building,
  Check,
  Coins,
  Gem,
  Hammer,
  House,
  LayoutGrid,
  MapPin,
  PiggyBank,
  Search,
  Sofa,
  Sparkles,
  Trees,
  Wallet,
} from "lucide-react";

import { BedIcon, HomeIcon, MapPinIcon, SearchIcon, WalletIcon } from "@/components/icons";
import { useSearchMode } from "@/components/marketing/search-mode-context";
import {
  BUDGET_OPTIONS,
  MEDELLIN_AREAS,
  NEARBY_MUNICIPALITIES,
  TYPE_LABELS,
  type Operation,
  type PropertyFilters,
  type PropertyType,
} from "@/components/marketing/properties";

type Field = "ubicacion" | "tipo" | "habitaciones" | "presupuesto";
type SegmentIcon = ComponentType<{ className?: string }>;

const ROOM_OPTIONS = ["1", "2", "3", "4"];

const REFINEMENT_KEYS = ["banos", "area", "estrato", "estado", "orden", "asequible"] as const;

const TYPE_OPTIONS = Object.entries(TYPE_LABELS) as [PropertyType, string][];

type Tone = "slate" | "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet" | "teal";

/** Matte tinted tiles: a soft fill with a deeper icon colour of the same hue, no gradients. */
const TONES: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-600",
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
  violet: "bg-violet-50 text-violet-600",
  teal: "bg-teal-50 text-teal-600",
};

type LucideIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

function PanelHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function IconTile({ icon: Icon, tone, size = "md" }: { icon: LucideIcon; tone: Tone; size?: "sm" | "md" }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${TONES[tone]} ${
        size === "sm" ? "size-6 rounded-lg" : "size-10 rounded-xl"
      }`}
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-5"} strokeWidth={1.75} />
    </span>
  );
}

/** A selectable option: coloured icon tile, label and optional hint, with a check when selected. */
function OptionCard({
  icon,
  tone,
  label,
  hint,
  selected,
  onClick,
}: {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  hint?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
        selected ? "border-foreground bg-surface-secondary/50" : "border-separator hover:border-foreground/30 hover:bg-surface-secondary/40"
      }`}
    >
      <IconTile icon={icon} tone={tone} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{label}</span>
        {hint ? <span className="block truncate text-xs text-muted">{hint}</span> : null}
      </span>
      {selected ? (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}

/** Small pill with a coloured icon, for the location shortcuts. */
function PlaceChip({
  icon,
  tone,
  label,
  selected,
  onClick,
}: {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-medium transition-colors ${
        selected ? "border-foreground bg-surface-secondary/50 text-foreground" : "border-separator text-foreground/80 hover:border-foreground/30 hover:text-foreground"
      }`}
    >
      <IconTile icon={icon} tone={tone} size="sm" />
      {label}
    </button>
  );
}

/** Location input + place shortcuts, shared by the full search and the mobile quick-search button. */
export function LocationFields({
  value,
  onValueChangeAction,
  onPickAction,
}: {
  value: string;
  onValueChangeAction: (value: string) => void;
  onPickAction: (location: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <label className="relative block">
        <span className="sr-only">Barrio, proyecto o ciudad</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(event) => onValueChangeAction(event.target.value)}
          placeholder="Barrio, proyecto o ciudad"
          className="w-full rounded-2xl border border-separator bg-white py-3 pl-11 pr-4 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25"
        />
      </label>

      <div>
        <p className="mb-2.5 text-xs font-semibold text-muted">Barrios de Medellín</p>
        <div className="flex flex-wrap gap-2">
          {MEDELLIN_AREAS.map((area) => {
            const location = `${area}, Medellín`;
            return (
              <PlaceChip
                key={area}
                icon={MapPin}
                tone="indigo"
                label={area}
                selected={value === location}
                onClick={() => onPickAction(location)}
              />
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-xs font-semibold text-muted">Municipios cercanos</p>
        <div className="flex flex-wrap gap-2">
          {NEARBY_MUNICIPALITIES.map((municipality) => (
            <PlaceChip
              key={municipality}
              icon={Trees}
              tone="emerald"
              label={municipality}
              selected={value === municipality}
              onClick={() => onPickAction(municipality)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const TYPE_STYLES: Record<PropertyType, { icon: LucideIcon; tone: Tone; hint: string }> = {
  apartamento: { icon: Building, tone: "indigo", hint: "En edificio o conjunto" },
  casa: { icon: House, tone: "emerald", hint: "Con más espacio propio" },
  apartaestudio: { icon: Sofa, tone: "amber", hint: "Compacto, un ambiente" },
  proyecto: { icon: Hammer, tone: "rose", hint: "Vivienda nueva en obra" },
};

const ROOM_TONES: Tone[] = ["sky", "indigo", "violet", "teal"];
const BUDGET_STYLES: { icon: LucideIcon; tone: Tone }[] = [
  { icon: Coins, tone: "emerald" },
  { icon: PiggyBank, tone: "sky" },
  { icon: Wallet, tone: "violet" },
  { icon: Gem, tone: "amber" },
];

const LABELS = {
  full: { ubicacion: "Ubicación", tipo: "Tipo", habitaciones: "Habitaciones", presupuesto: "Presupuesto" },
  compact: { ubicacion: "Ubic.", tipo: "Tipo", habitaciones: "Hab.", presupuesto: "Presup." },
} as const;

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
  const labels = compact ? LABELS.compact : LABELS.full;

  const [activeField, setActiveField] = useState<Field | null>(null);
  const [ubicacion, setUbicacion] = useState(initialFilters?.ubicacion ?? "");
  const [tipo, setTipo] = useState(initialFilters?.tipo === "proyecto" ? "" : (initialFilters?.tipo ?? ""));
  const [habitaciones, setHabitaciones] = useState(initialFilters?.habitaciones ?? "");
  const [presupuesto, setPresupuesto] = useState(initialFilters?.presupuesto ?? "");

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setActiveField(null);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const budgetOperation: Operation = mode === "arrendar" ? "arrendar" : "comprar";
  const budgetOptions = useMemo(
    () => BUDGET_OPTIONS.filter((option) => option.operation === budgetOperation),
    [budgetOperation],
  );

  // A budget bucket only applies while its operation is selected; otherwise it
  // falls back to "no budget" without needing to reset state in an effect.
  const activeBudget = budgetOptions.some((option) => option.value === presupuesto)
    ? presupuesto
    : "";

  function runSearch(overrideLocation?: string) {
    onSearchAction?.();
    const params = new URLSearchParams();
    params.set("operacion", mode === "arrendar" ? "arrendar" : "comprar");
    if (mode === "proyecto") params.set("tipo", "proyecto");
    else if (tipo) params.set("tipo", tipo);

    const location = overrideLocation ?? ubicacion;
    if (location.trim()) params.set("ubicacion", location.trim());
    if (habitaciones) params.set("habitaciones", habitaciones);
    if (activeBudget) params.set("presupuesto", activeBudget);
    // Keep the /search filter-bar refinements when searching again from here.
    for (const key of REFINEMENT_KEYS) {
      const value = initialFilters?.[key];
      if (value) params.set(key, value);
    }

    router.push(`/search?${params.toString()}`);
  }

  function toggleField(field: Field) {
    setActiveField((current) => (current === field ? null : field));
  }

  const iconBox = compact ? "size-7" : "size-10";
  const iconSize = compact ? "size-3.5" : "size-5";

  const segments: { field: Field; icon: SegmentIcon; label: string; value: string; placeholder: string; disabled?: boolean }[] = [
    { field: "ubicacion", icon: MapPinIcon, label: labels.ubicacion, value: ubicacion, placeholder: "Barrio, proyecto o ciudad" },
    {
      field: "tipo",
      icon: HomeIcon,
      label: labels.tipo,
      value: mode === "proyecto" ? "Proyectos nuevos" : tipo ? TYPE_LABELS[tipo as PropertyType] : "",
      placeholder: "Cualquiera",
      disabled: mode === "proyecto",
    },
    { field: "habitaciones", icon: BedIcon, label: labels.habitaciones, value: habitaciones ? `${habitaciones}+` : "", placeholder: "Cualquiera" },
    {
      field: "presupuesto",
      icon: WalletIcon,
      label: labels.presupuesto,
      value: budgetOptions.find((option) => option.value === activeBudget)?.label ?? "",
      placeholder: "Cualquiera",
    },
  ];

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${compact ? "max-w-2xl" : "mx-auto max-w-4xl"}`}
    >
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
          {/* Segment row */}
          <div className={`flex flex-col gap-1 p-1.5 md:flex-row md:items-center ${compact ? "md:p-1" : "md:p-2"}`}>
            {segments.map(({ field, icon: Icon, label, value, placeholder, disabled }, index) => {
              const active = activeField === field;
              return (
                <div
                  key={field}
                  // Location holds free text, so it gets a bit more room than the pickers.
                  className={`flex items-center md:min-w-0 ${field === "ubicacion" ? "flex-[1.4]" : "flex-1"}`}
                >
                  {index > 0 ? (
                    <span aria-hidden="true" className="hidden h-8 w-px shrink-0 bg-separator md:block" />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => !disabled && toggleField(field)}
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
                      className={`flex ${iconBox} shrink-0 items-center justify-center rounded-full transition-colors ${
                        active || value ? "bg-accent text-accent-foreground" : "bg-accent-soft text-accent"
                      }`}
                    >
                      <Icon className={iconSize} />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className={`${compact ? "text-[11px]" : "text-xs"} font-semibold text-foreground`}>
                        {label}
                      </span>
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
            })}

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
          </div>
        </div>

        {/* Option panel */}
        <AnimatePresence>
          {activeField ? (
            <motion.div
              key={activeField}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-x-0 top-full z-20 mt-2 origin-top rounded-3xl border border-separator bg-white p-5 text-left shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)]"
            >
              {activeField === "ubicacion" ? (
                <LocationFields
                  value={ubicacion}
                  onValueChangeAction={setUbicacion}
                  onPickAction={(location) => {
                    setUbicacion(location);
                    setActiveField(null);
                    runSearch(location);
                  }}
                />
              ) : null}

              {activeField === "tipo" ? (
                <>
                  <PanelHeader title="Tipo de inmueble" hint="¿Qué estás buscando?" />
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <OptionCard
                      icon={LayoutGrid}
                      tone="slate"
                      label="Cualquiera"
                      hint="Todos los tipos"
                      selected={tipo === ""}
                      onClick={() => {
                        setTipo("");
                        setActiveField(null);
                      }}
                    />
                    {TYPE_OPTIONS.map(([value, label]) => (
                      <OptionCard
                        key={value}
                        icon={TYPE_STYLES[value].icon}
                        tone={TYPE_STYLES[value].tone}
                        label={label}
                        hint={TYPE_STYLES[value].hint}
                        selected={tipo === value}
                        onClick={() => {
                          setTipo(value);
                          setActiveField(null);
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : null}

              {activeField === "habitaciones" ? (
                <>
                  <PanelHeader title="Habitaciones" hint="Mínimo de habitaciones que necesitas" />
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <OptionCard
                      icon={LayoutGrid}
                      tone="slate"
                      label="Todas"
                      selected={habitaciones === ""}
                      onClick={() => {
                        setHabitaciones("");
                        setActiveField(null);
                      }}
                    />
                    {ROOM_OPTIONS.map((value, index) => (
                      <OptionCard
                        key={value}
                        icon={value === "1" ? BedSingle : BedDouble}
                        tone={ROOM_TONES[index]}
                        label={`${value}+`}
                        hint={value === "1" ? "habitación" : "habitaciones"}
                        selected={habitaciones === value}
                        onClick={() => {
                          setHabitaciones(value);
                          setActiveField(null);
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : null}

              {activeField === "presupuesto" ? (
                <>
                  <PanelHeader
                    title="Presupuesto"
                    hint={budgetOperation === "arrendar" ? "Canon mensual máximo" : "Precio total máximo"}
                  />
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <OptionCard
                      icon={Sparkles}
                      tone="slate"
                      label="Cualquiera"
                      hint="Sin límite de precio"
                      selected={activeBudget === ""}
                      onClick={() => {
                        setPresupuesto("");
                        setActiveField(null);
                      }}
                    />
                    {budgetOptions.map((option, index) => (
                      <OptionCard
                        key={option.value}
                        icon={BUDGET_STYLES[index % BUDGET_STYLES.length].icon}
                        tone={BUDGET_STYLES[index % BUDGET_STYLES.length].tone}
                        label={option.label}
                        selected={activeBudget === option.value}
                        onClick={() => {
                          setPresupuesto(option.value);
                          setActiveField(null);
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </form>
    </div>
  );
}
