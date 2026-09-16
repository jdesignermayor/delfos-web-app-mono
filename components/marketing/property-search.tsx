"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { SearchIcon } from "@/components/icons";
import { useSearchMode } from "@/components/marketing/search-mode-context";
import {
  BUDGET_OPTIONS,
  MEDELLIN_AREAS,
  TYPE_LABELS,
  type Operation,
  type PropertyType,
} from "@/components/marketing/properties";

type Field = "ubicacion" | "tipo" | "habitaciones" | "presupuesto";

const ROOM_OPTIONS = ["1", "2", "3", "4"];

const TYPE_OPTIONS = Object.entries(TYPE_LABELS) as [PropertyType, string][];

export const optionButtonClass = (active: boolean) =>
  `rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
    active
      ? "border-foreground bg-foreground text-background"
      : "border-separator bg-surface text-foreground hover:border-accent hover:text-accent"
  }`;

/** Location input + neighborhood chips, shared by the full search and the mobile quick-search button. */
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
    <div className="flex flex-col gap-3">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(event) => onValueChangeAction(event.target.value)}
        placeholder="Barrio, proyecto o ciudad"
        className="w-full rounded-xl border border-separator bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
      />
      <div className="flex flex-wrap gap-2">
        {MEDELLIN_AREAS.map((area) => {
          const location = `${area}, Medellín`;
          return (
            <button
              key={area}
              type="button"
              onClick={() => onPickAction(location)}
              className={optionButtonClass(value === location)}
            >
              {area}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const LABELS = {
  full: { ubicacion: "Ubicación", tipo: "Tipo", habitaciones: "Habitaciones", presupuesto: "Presupuesto" },
  compact: { ubicacion: "Ubic.", tipo: "Tipo", habitaciones: "Hab.", presupuesto: "Presup." },
} as const;

export function PropertySearch({
  compact = false,
  onSearchAction,
}: {
  compact?: boolean;
  /** Called right before navigating to the results — lets a caller (e.g. a search overlay) close itself. */
  onSearchAction?: () => void;
}) {
  const router = useRouter();
  const { mode } = useSearchMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const labels = compact ? LABELS.compact : LABELS.full;

  const [activeField, setActiveField] = useState<Field | null>(null);
  const [ubicacion, setUbicacion] = useState("");
  const [tipo, setTipo] = useState("");
  const [habitaciones, setHabitaciones] = useState("");
  const [presupuesto, setPresupuesto] = useState("");

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

    router.push(`/search?${params.toString()}`);
  }

  function toggleField(field: Field) {
    setActiveField((current) => (current === field ? null : field));
  }

  const segmentPad = compact ? "px-4 py-2" : "px-6 py-3";
  const labelSize = compact ? "text-[11px]" : "text-xs";
  const valueSize = compact ? "text-xs" : "text-sm";
  const buttonSize = compact ? "size-10" : "size-12 md:size-11";
  const iconSize = compact ? "size-4" : "size-5";

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${compact ? "max-w-2xl" : "mx-auto max-w-3xl"}`}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setActiveField(null);
          runSearch();
        }}
      >
        <div
          className={`overflow-hidden rounded-3xl border border-separator bg-white ${
            compact ? "shadow-sm" : "shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]"
          }`}
        >
          {/* Segment row */}
          <div
            className={`flex flex-col divide-y divide-separator md:flex-row md:items-center md:divide-x md:divide-y-0 ${
              compact ? "md:p-1" : "md:p-1.5"
            }`}
          >
            <button
              type="button"
              onClick={() => toggleField("ubicacion")}
              className={`flex flex-1 flex-col gap-0.5 rounded-full ${segmentPad} text-left transition-colors ${
                activeField === "ubicacion" ? "bg-surface-secondary" : "hover:bg-surface-secondary"
              }`}
            >
              <span className={`${labelSize} font-semibold text-foreground`}>{labels.ubicacion}</span>
              <span className={`truncate ${valueSize} text-muted`}>
                {ubicacion || "Barrio, proyecto o ciudad"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => mode !== "proyecto" && toggleField("tipo")}
              disabled={mode === "proyecto"}
              className={`flex flex-1 flex-col gap-0.5 rounded-full ${segmentPad} text-left transition-colors disabled:opacity-50 ${
                activeField === "tipo" ? "bg-surface-secondary" : "hover:bg-surface-secondary"
              }`}
            >
              <span className={`${labelSize} font-semibold text-foreground`}>{labels.tipo}</span>
              <span className={`truncate ${valueSize} text-muted`}>
                {tipo ? TYPE_LABELS[tipo as PropertyType] : "Cualquiera"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleField("habitaciones")}
              className={`flex flex-1 flex-col gap-0.5 rounded-full ${segmentPad} text-left transition-colors ${
                activeField === "habitaciones" ? "bg-surface-secondary" : "hover:bg-surface-secondary"
              }`}
            >
              <span className={`${labelSize} font-semibold text-foreground`}>{labels.habitaciones}</span>
              <span className={`truncate ${valueSize} text-muted`}>
                {habitaciones ? `${habitaciones}+` : "Cualquiera"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleField("presupuesto")}
              className={`flex flex-1 flex-col gap-0.5 rounded-full ${segmentPad} text-left transition-colors ${
                activeField === "presupuesto" ? "bg-surface-secondary" : "hover:bg-surface-secondary"
              }`}
            >
              <span className={`${labelSize} font-semibold text-foreground`}>{labels.presupuesto}</span>
              <span className={`truncate ${valueSize} text-muted`}>
                {budgetOptions.find((option) => option.value === activeBudget)?.label ?? "Cualquiera"}
              </span>
            </button>

            <div className={`flex justify-end ${compact ? "px-1.5 py-1.5" : "px-3 py-3"} md:justify-center md:px-1.5`}>
              <button
                type="submit"
                aria-label="Buscar"
                className={`flex ${buttonSize} items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm transition-[background-color,transform] hover:bg-accent-hover active:scale-[0.96]`}
              >
                <SearchIcon className={iconSize} />
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
              className="absolute inset-x-0 top-full z-20 mt-2 origin-top rounded-3xl border border-separator bg-white p-5 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)]"
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
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTipo("");
                      setActiveField(null);
                    }}
                    className={optionButtonClass(tipo === "")}
                  >
                    Cualquiera
                  </button>
                  {TYPE_OPTIONS.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setTipo(value);
                        setActiveField(null);
                      }}
                      className={optionButtonClass(tipo === value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}

              {activeField === "habitaciones" ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHabitaciones("");
                      setActiveField(null);
                    }}
                    className={optionButtonClass(habitaciones === "")}
                  >
                    Cualquiera
                  </button>
                  {ROOM_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setHabitaciones(value);
                        setActiveField(null);
                      }}
                      className={optionButtonClass(habitaciones === value)}
                    >
                      {value}+
                    </button>
                  ))}
                </div>
              ) : null}

              {activeField === "presupuesto" ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPresupuesto("");
                      setActiveField(null);
                    }}
                    className={optionButtonClass(activeBudget === "")}
                  >
                    Cualquiera
                  </button>
                  {budgetOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setPresupuesto(option.value);
                        setActiveField(null);
                      }}
                      className={optionButtonClass(activeBudget === option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </form>
    </div>
  );
}
