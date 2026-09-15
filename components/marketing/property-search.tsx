"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

const optionButtonClass = (active: boolean) =>
  `rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
    active
      ? "border-foreground bg-foreground text-background"
      : "border-separator bg-surface text-foreground hover:border-accent hover:text-accent"
  }`;

export function PropertySearch() {
  const router = useRouter();
  const { mode } = useSearchMode();
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-3xl">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setActiveField(null);
          runSearch();
        }}
      >
        <div className="overflow-hidden rounded-3xl border border-separator bg-surface shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          {/* Segment row */}
          <div className="flex flex-col divide-y divide-separator md:flex-row md:items-center md:divide-x md:divide-y-0 md:p-1.5">
            <button
              type="button"
              onClick={() => toggleField("ubicacion")}
              className={`flex flex-1 flex-col gap-0.5 rounded-full px-6 py-3 text-left transition-colors ${
                activeField === "ubicacion" ? "bg-surface-secondary" : "hover:bg-surface-secondary"
              }`}
            >
              <span className="text-xs font-semibold text-foreground">Ubicación</span>
              <span className="truncate text-sm text-muted">
                {ubicacion || "Barrio, proyecto o ciudad"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => mode !== "proyecto" && toggleField("tipo")}
              disabled={mode === "proyecto"}
              className={`flex flex-1 flex-col gap-0.5 rounded-full px-6 py-3 text-left transition-colors disabled:opacity-50 ${
                activeField === "tipo" ? "bg-surface-secondary" : "hover:bg-surface-secondary"
              }`}
            >
              <span className="text-xs font-semibold text-foreground">Tipo</span>
              <span className="truncate text-sm text-muted">
                {tipo ? TYPE_LABELS[tipo as PropertyType] : "Cualquiera"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleField("habitaciones")}
              className={`flex flex-1 flex-col gap-0.5 rounded-full px-6 py-3 text-left transition-colors ${
                activeField === "habitaciones" ? "bg-surface-secondary" : "hover:bg-surface-secondary"
              }`}
            >
              <span className="text-xs font-semibold text-foreground">Habitaciones</span>
              <span className="truncate text-sm text-muted">
                {habitaciones ? `${habitaciones}+` : "Cualquiera"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleField("presupuesto")}
              className={`flex flex-1 flex-col gap-0.5 rounded-full px-6 py-3 text-left transition-colors ${
                activeField === "presupuesto" ? "bg-surface-secondary" : "hover:bg-surface-secondary"
              }`}
            >
              <span className="text-xs font-semibold text-foreground">Presupuesto</span>
              <span className="truncate text-sm text-muted">
                {budgetOptions.find((option) => option.value === activeBudget)?.label ?? "Cualquiera"}
              </span>
            </button>

            <div className="flex justify-end px-3 py-3 md:justify-center md:px-1.5">
              <button
                type="submit"
                aria-label="Buscar"
                className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm transition-[background-color,transform] hover:bg-accent-hover active:scale-[0.96] md:size-11"
              >
                <SearchIcon className="size-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Option panel */}
        {activeField ? (
          <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-3xl border border-separator bg-surface p-5 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)]">
            {activeField === "ubicacion" ? (
              <div className="flex flex-col gap-3">
                <input
                  autoFocus
                  type="text"
                  value={ubicacion}
                  onChange={(event) => setUbicacion(event.target.value)}
                  placeholder="Barrio, proyecto o ciudad"
                  className="w-full rounded-xl border border-separator bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
                />
                <div className="flex flex-wrap gap-2">
                  {MEDELLIN_AREAS.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        const location = `${area}, Medellín`;
                        setUbicacion(location);
                        setActiveField(null);
                        runSearch(location);
                      }}
                      className={optionButtonClass(ubicacion === `${area}, Medellín`)}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
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
          </div>
        ) : null}
      </form>
    </div>
  );
}
