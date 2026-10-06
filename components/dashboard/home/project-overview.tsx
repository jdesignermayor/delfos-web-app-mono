import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { Card } from "@heroui/react";
import {
  ArrowUpRight,
  Building,
  CircleDollarSign,
  HardHat,
  LayoutGrid,
  MapPinned,
  Minus,
} from "lucide-react";

import type { Count, ProjectStats, Split } from "@/components/dashboard/home/project-stats";
import { CopyPitchButton } from "@/components/dashboard/home/copy-pitch-button";
import { GrowthChart } from "@/components/dashboard/home/growth-chart";

/** Validated pair (light surface): blue / orange, ΔE 24.7 under protanopia. */
const SERIES = ["#2a78d6", "#eb6834"] as const;

const number = new Intl.NumberFormat("es-CO");
const compactCOP = (value: number) =>
  value >= 1_000_000_000
    ? `$${(value / 1_000_000_000).toLocaleString("es-CO", { maximumFractionDigits: 2 })} mil M`
    : `$${Math.round(value / 1_000_000).toLocaleString("es-CO")}M`;
const plural = (count: number, one: string, many: string) => `${number.format(count)} ${count === 1 ? one : many}`;
const shortDate = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "short", year: "numeric" });

type Tone = "indigo" | "emerald" | "amber" | "violet" | "sky" | "rose";
const TONES: Record<Tone, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  sky: "bg-sky-50 text-sky-600",
  rose: "bg-rose-50 text-rose-600",
};

function Panel({ title, hint, children, className = "" }: { title: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <Card className={`rounded-3xl p-6 ${className}`}>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {hint ? <p className="mt-0.5 text-sm text-muted">{hint}</p> : null}
      <div className="mt-5">{children}</div>
    </Card>
  );
}

/**
 * Growth this month (icon + signed text, never colour alone). Any new project
 * is growth, so it's green; last month's figure sits beside it for pace.
 */
function Delta({ thisMonth, lastMonth }: { thisMonth: number; lastMonth: number }) {
  const Icon = thisMonth > 0 ? ArrowUpRight : Minus;
  const tone = thisMonth > 0 ? "bg-success/10 text-success" : "bg-surface-secondary text-muted";
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${tone}`}>
        <Icon className="size-4" aria-hidden="true" />+{number.format(thisMonth)} este mes
      </span>
      <span className="text-muted">
        {lastMonth > 0 ? `${number.format(lastMonth)} el mes anterior` : "ninguno el mes anterior"}
      </span>
    </div>
  );
}

function StatTile({ icon: Icon, tone, label, value, hint }: { icon: ComponentType<{ className?: string }>; tone: Tone; label: string; value: string; hint: string }) {
  return (
    <Card className="rounded-3xl p-5">
      <span className={`flex size-11 items-center justify-center rounded-2xl ${TONES[tone]}`}>
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted">{hint}</p>
    </Card>
  );
}

/** Ranked horizontal bars, one hue; each bar carries its value at the end. */
function RankBars({ items, unit }: { items: Count[]; unit: [string, string] }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.label} className="group" title={`${item.label}: ${plural(item.count, ...unit)}`}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-foreground">{item.label}</span>
            <span className="shrink-0 tabular-nums text-muted">{plural(item.count, ...unit)}</span>
          </div>
          <div className="h-3 rounded-full bg-surface-secondary">
            <div
              className="h-full rounded-full transition-opacity group-hover:opacity-80"
              style={{ width: `${(item.count / max) * 100}%`, backgroundColor: SERIES[0] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Vertical columns, one hue, value above each; hover lifts the column. */
function Columns({ items, unit }: { items: Count[]; unit: [string, string] }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <div>
      <div className="flex h-48 items-end gap-3 border-b border-separator">
        {items.map((item) => (
          <div key={item.label} className="group flex h-full flex-1 flex-col items-center justify-end" title={`${item.label}: ${plural(item.count, ...unit)}`}>
            <span className="mb-1.5 text-sm font-semibold tabular-nums text-foreground">{item.count || ""}</span>
            <div
              className="w-full max-w-14 rounded-t-[6px] transition-opacity group-hover:opacity-80"
              style={{ height: `${item.count ? Math.max(4, (item.count / max) * 85) : 0}%`, backgroundColor: SERIES[0] }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {items.map((item) => (
          <span key={item.label} className="flex-1 text-center text-xs text-muted">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Two-part proportion bar with a 2px gap, legend and direct counts. */
function SplitBar({ title, split }: { title: string; split: Split }) {
  const total = split.reduce((sum, part) => sum + part.count, 0) || 1;
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="mt-2.5 flex h-4 gap-0.5 overflow-hidden rounded-full bg-surface-secondary">
        {split.map((part, index) =>
          part.count ? (
            <div
              key={part.label}
              title={`${part.label}: ${part.count}`}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${(part.count / total) * 100}%`, backgroundColor: SERIES[index] }}
            />
          ) : null,
        )}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {split.map((part, index) => (
          <li key={part.label} className="flex items-center gap-2">
            <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ backgroundColor: SERIES[index] }} />
            <span className="text-muted">{part.label}</span>
            <span className="font-semibold tabular-nums text-foreground">
              {part.count} · {Math.round((part.count / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProjectOverview({ stats }: { stats: ProjectStats }) {
  const municipalities = stats.byMunicipality.filter((item) => item.label !== "Sin ubicación").length;
  const pitch = `Delfos reúne ${plural(stats.total, "proyecto", "proyectos")} de ${plural(
    stats.developers,
    "constructora",
    "constructoras",
  )} en ${plural(municipalities, "municipio", "municipios")}: ${plural(stats.towers, "torre", "torres")} y ${plural(
    stats.typologies,
    "tipología",
    "tipologías",
  )} publicadas, con precios promedio de ${compactCOP(stats.averagePrice)}.`;

  return (
    <div className="flex flex-col gap-4">
      {/* Hero + growth */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-accent-soft via-white to-white p-7">
          <div>
            <p className="text-sm font-semibold text-accent">Proyectos en la plataforma</p>
            <p className="mt-2 text-7xl font-semibold tracking-tight text-foreground">{number.format(stats.total)}</p>
            <Delta thisMonth={stats.addedThisMonth} lastMonth={stats.addedLastMonth} />
          </div>

          <div className="mt-8 rounded-2xl border border-separator bg-white/80 p-4 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Para presentar a constructoras</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{pitch}</p>
            <CopyPitchButton text={pitch} />
          </div>
        </Card>

        <Card className="rounded-3xl p-7">
          <GrowthChart createdAt={stats.createdAt} />
        </Card>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Building} tone="indigo" label="Constructoras aliadas" value={number.format(stats.developers)} hint="Con al menos un proyecto" />
        <StatTile icon={HardHat} tone="amber" label="Torres publicadas" value={number.format(stats.towers)} hint={`${plural(stats.typologies, "tipología", "tipologías")} en total`} />
        <StatTile icon={MapPinned} tone="emerald" label="Municipios con cobertura" value={number.format(municipalities)} hint="Valle de Aburrá" />
        <StatTile icon={CircleDollarSign} tone="violet" label="Precio promedio" value={compactCOP(stats.averagePrice)} hint={`${plural(stats.photos, "foto", "fotos")} publicadas`} />
      </div>

      {/* Distribution */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Proyectos por constructora" hint="Quién publica más en Delfos">
          <RankBars items={stats.byDeveloper} unit={["proyecto", "proyectos"]} />
        </Panel>
        <Panel title="Proyectos por municipio" hint="Dónde está la oferta">
          <RankBars items={stats.byMunicipality} unit={["proyecto", "proyectos"]} />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Entregas por año" hint="Fecha de entrega del proyecto">
          <Columns items={stats.deliveriesByYear} unit={["proyecto", "proyectos"]} />
        </Panel>
        <Panel title="Rangos de precio" hint="Precio desde, por proyecto">
          <Columns items={stats.priceRanges} unit={["proyecto", "proyectos"]} />
        </Panel>
        <Panel title="Composición del inventario">
          <div className="flex flex-col gap-6">
            <SplitBar title="Estado de obra" split={stats.status} />
            <SplitBar title="Tipo de vivienda" split={stats.housing} />
          </div>
        </Panel>
      </div>

      {/* Latest */}
      <Panel title="Últimos proyectos agregados" hint="Los 5 más recientes">
        <ul className="divide-y divide-separator">
          {stats.recent.map((project) => (
            <li key={project.uuid}>
              <Link
                href={`/propiedades/${project.uuid}`}
                target="_blank"
                className="flex items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-surface-secondary/60"
              >
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${TONES.sky}`}>
                  <LayoutGrid className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{project.title}</span>
                  <span className="block truncate text-sm text-muted">
                    {project.developer} · {project.municipality}
                  </span>
                </span>
                <span className="hidden text-right sm:block">
                  <span className="block font-semibold tabular-nums text-foreground">{compactCOP(project.price)}</span>
                  <span className="block text-xs text-muted">{shortDate.format(new Date(project.createdAt))}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
