"use client";

import { useId, useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";

const TIME_ZONE_OFFSET_MS = -5 * 60 * 60 * 1000; // America/Bogota, no DST
const COUNT = 12;

type Granularity = "semanas" | "meses";
type Point = { key: string; label: string; added: number; total: number };

const monthLabel = new Intl.DateTimeFormat("es-CO", { timeZone: "UTC", month: "short" });
const monthLong = new Intl.DateTimeFormat("es-CO", { timeZone: "UTC", month: "long", year: "numeric" });
const dayLabel = new Intl.DateTimeFormat("es-CO", { timeZone: "UTC", day: "numeric", month: "short" });
const number = new Intl.NumberFormat("es-CO");

/** Shifts to Colombian wall-clock time, so UTC getters read local dates. */
const local = (date: Date) => new Date(date.getTime() + TIME_ZONE_OFFSET_MS);

/** Start (local midnight, as a UTC date) of the bucket containing `date`. */
function bucketStart(date: Date, granularity: Granularity) {
  const d = local(date);
  if (granularity === "meses") return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const weekday = (d.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - weekday));
}

function buildPoints(createdAt: string[], granularity: Granularity, now: Date): Point[] {
  const current = bucketStart(now, granularity);
  const starts = Array.from({ length: COUNT }, (_, index) => {
    const offset = COUNT - 1 - index;
    return granularity === "meses"
      ? new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - offset, 1))
      : new Date(current.getTime() - offset * 7 * 24 * 60 * 60 * 1000);
  });
  const keys = starts.map((start) => start.toISOString().slice(0, 10));
  const added = new Map<string, number>();
  let before = 0;
  for (const iso of createdAt) {
    const key = bucketStart(new Date(iso), granularity).toISOString().slice(0, 10);
    if (key < keys[0]) before += 1;
    else added.set(key, (added.get(key) ?? 0) + 1);
  }
  let running = before;
  return starts.map((start, index) => {
    const count = added.get(keys[index]) ?? 0;
    running += count;
    return {
      key: keys[index],
      label: granularity === "meses" ? monthLabel.format(start).replace(".", "") : dayLabel.format(start).replace(".", ""),
      added: count,
      total: running,
    };
  });
}

/** Round axis maximum: 1, 2, 5, 10, 20, 50… at or above `value`. */
function niceMax(value: number) {
  if (value <= 4) return Math.max(value, 2);
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 5, 10].map((step) => step * magnitude).find((step) => step >= value) ?? value;
}

/**
 * Cumulative projects over time: one series as an area with a 2px line, a
 * crosshair that snaps to the nearest bucket, and a tooltip on hover or arrow
 * keys. Weeks/months toggle above the plot.
 */
export function GrowthChart({ createdAt }: { createdAt: string[] }) {
  const [granularity, setGranularity] = useState<Granularity>("semanas");
  const [hover, setHover] = useState<number | null>(null);
  const gradientId = useId();
  // Bucketing uses "now" once per render of the data; the chart is a snapshot of the page load.
  const [now] = useState(() => new Date());
  const points = useMemo(() => buildPoints(createdAt, granularity, now), [createdAt, granularity, now]);

  const max = niceMax(Math.max(1, ...points.map((point) => point.total)));
  const ticks = [max, max / 2, 0];
  const x = (index: number) => (index / (points.length - 1)) * 100;
  const y = (value: number) => 100 - (value / max) * 100;
  const line = points.map((point, index) => `${index ? "L" : "M"}${x(index) * 10},${y(point.total) * 2.6}`).join(" ");
  const area = `${line} L1000,260 L0,260 Z`;
  const active = hover ?? points.length - 1;
  const point = points[active];

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    setHover(Math.round(ratio * (points.length - 1)));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    setHover(Math.min(points.length - 1, Math.max(0, active + step)));
  }

  const growth = points.at(-1)!.total - points[0].total + points[0].added;

  return (
    <figure className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <figcaption>
          <p className="text-base font-semibold text-foreground">Crecimiento de proyectos</p>
          <p className="mt-0.5 text-sm text-muted">
            Total acumulado · <span className="font-semibold text-foreground">+{number.format(growth)}</span> en las últimas{" "}
            {COUNT} {granularity}
          </p>
        </figcaption>
        <div role="group" aria-label="Agrupar por" className="flex rounded-full bg-surface-secondary p-1">
          {(["semanas", "meses"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={granularity === option}
              onClick={() => {
                setGranularity(option);
                setHover(null);
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                granularity === option ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-1 gap-3">
        {/* Y axis: three recessive ticks. */}
        <div className="flex h-64 flex-col justify-between pb-0 text-right text-[11px] tabular-nums text-muted" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {number.format(tick)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div
            tabIndex={0}
            role="img"
            aria-label={`Total de proyectos: ${point.total} en ${point.label}. Usa las flechas para recorrer.`}
            onPointerMove={onPointerMove}
            onPointerLeave={() => setHover(null)}
            onKeyDown={onKeyDown}
            onBlur={() => setHover(null)}
            className="relative h-64 cursor-crosshair rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {/* Gridlines */}
            {ticks.map((tick) => (
              <span
                key={tick}
                aria-hidden="true"
                className={`absolute inset-x-0 border-t ${tick === 0 ? "border-separator" : "border-dashed border-separator/70"}`}
                style={{ top: `${y(tick)}%` }}
              />
            ))}

            <svg viewBox="0 0 1000 260" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
              <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2a78d6" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#2a78d6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill={`url(#${gradientId})`} />
              <path d={line} fill="none" stroke="#2a78d6" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            </svg>

            {/* Crosshair + marker (HTML so they don't stretch with the SVG). */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 w-px bg-foreground/20"
              style={{ left: `${x(active)}%` }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#2a78d6] shadow"
              style={{ left: `${x(active)}%`, top: `${y(point.total)}%` }}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute top-2 z-10 whitespace-nowrap rounded-xl bg-foreground px-3 py-2 text-background shadow-lg ${
                x(active) > 70 ? "-translate-x-[calc(100%+12px)]" : "translate-x-3"
              }`}
              style={{ left: `${x(active)}%` }}
            >
              <p className="text-lg font-semibold leading-tight">{number.format(point.total)} proyectos</p>
              <p className="text-xs opacity-75">
                {granularity === "semanas" ? `Semana del ${point.label}` : monthLong.format(new Date(`${point.key}T00:00:00Z`))}
                {" · "}+{number.format(point.added)} nuevos
              </p>
            </div>
          </div>

          <div className="mt-2 flex justify-between text-[11px] text-muted" aria-hidden="true">
            {points.map((p, index) => (
              <span
                key={p.key}
                // Weeks show every other label; phones show every 4th so they never overlap.
                className={`w-0 whitespace-nowrap text-center ${index % 2 && granularity === "semanas" ? "invisible" : ""} ${
                  index % 4 ? "max-sm:invisible" : ""
                }`}
              >
                <span className={`inline-block -translate-x-1/2 ${granularity === "meses" ? "capitalize" : ""}`}>{p.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>Proyectos agregados y total acumulado por {granularity === "semanas" ? "semana" : "mes"}</caption>
        <thead>
          <tr>
            <th scope="col">Periodo</th>
            <th scope="col">Nuevos</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.key}>
              <th scope="row">{p.key}</th>
              <td>{p.added}</td>
              <td>{p.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
