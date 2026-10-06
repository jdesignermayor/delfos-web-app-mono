import type { ComponentType, ReactNode } from "react";
import { ArrowUpDown, BookOpen, CalendarDays, ChevronDown, Fence, Trash } from "lucide-react";

import { BathIcon, BedIcon, BuildingIcon, RulerIcon } from "@/components/icons";
import {
  TYPE_LABELS,
  formatCOP,
  type Property,
  type PropertyDetails,
  type Tower,
  type Typology,
} from "@/components/marketing/properties";
import { formatRange } from "@/lib/typology-ranges";

const monthYear = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" });
const shortMonthYear = new Intl.DateTimeFormat("es-CO", { month: "short", year: "numeric", timeZone: "UTC" });

/** "diciembre de 2026". Dates are stored as YYYY-MM-DD, read in UTC so the month doesn't slip back a day. */
function formatDelivery(date: string | undefined) {
  if (!date) return undefined;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : monthYear.format(parsed);
}


/** "dic 2026", for the compact tower summaries. */
function formatDeliveryShort(date: string | undefined) {
  if (!date) return undefined;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : shortMonthYear.format(parsed).replace(" de ", " ");
}

type Item = { label: string; value: ReactNode };

/** Label/value pairs, skipping the ones without a value. */
function FactList({ items, className = "" }: { items: Item[]; className?: string }) {
  const present = items.filter((item) => item.value != null && item.value !== "");
  if (!present.length) return null;
  return (
    <dl className={`grid gap-x-6 gap-y-4 ${className}`}>
      {present.map((item) => (
        <div key={item.label}>
          <dt className="text-xs text-muted">{item.label}</dt>
          <dd className="mt-0.5 text-sm font-medium text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h3 className="font-display text-2xl font-semibold text-foreground">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Constructora, project and legal facts: who builds it, VIS status, delivery, fiducia… */
export function ProjectDetailsSection({ property, details }: { property: Property; details: PropertyDetails }) {
  const items: Item[] = [
    { label: "Constructora", value: details.developer?.name },
    { label: "Proyecto", value: property.projectName },
    { label: "Tipo de inmueble", value: TYPE_LABELS[property.type] },
    { label: "Tipo de vivienda", value: details.housingType },
    { label: "Estrato", value: property.stratum },
    { label: "Torres", value: details.towerCount ?? (details.towers.length || undefined) },
    { label: "Fecha de entrega", value: formatDelivery(details.deliveryDate) },
    { label: "Gerencia", value: details.constructionCompany },
    { label: "Fiducia", value: details.trustCompany },
    { label: "Banco constructor", value: details.constructionBank },
  ];
  if (!items.some((item) => item.value != null && item.value !== "")) return null;

  return (
    <Section id="proyecto" title="Detalles del proyecto">
      <FactList items={items} className="grid-cols-2 sm:grid-cols-3" />
    </Section>
  );
}

/** Icon + short label, the building block of the tower summaries. */
function Fact({ icon: Icon, children }: { icon: ComponentType<{ className?: string }>; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-4 shrink-0 text-muted" />
      {children}
    </span>
  );
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** "60 m²" or "54–75 m²" across the tower's typologies. */
function areaRange(typologies: Typology[]) {
  const areas = typologies.flatMap((t) => (t.area != null ? [t.area] : []));
  return areas.length ? `${formatRange({ min: Math.min(...areas), max: Math.max(...areas) })} m²` : undefined;
}

function TypologyRow({ typology }: { typology: Typology }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3 text-sm text-foreground">
      <span className="min-w-20 font-semibold">{typology.name || "Tipología"}</span>
      {typology.area != null ? <Fact icon={RulerIcon}>{typology.area} m²</Fact> : null}
      {typology.bedrooms != null ? <Fact icon={BedIcon}>{typology.bedrooms} hab.</Fact> : null}
      {typology.bathrooms != null ? <Fact icon={BathIcon}>{plural(typology.bathrooms, "baño", "baños")}</Fact> : null}
      {typology.hasStudy ? <Fact icon={BookOpen}>Estudio</Fact> : null}
      {typology.hasBalcony ? <Fact icon={Fence}>Balcón</Fact> : null}
    </li>
  );
}

/** Collapsible tower: a one-line summary, expanding to its features and typologies. */
function TowerItem({ tower }: { tower: Tower }) {
  const delivery = formatDeliveryShort(tower.deliveryDate);
  const area = areaRange(tower.typologies);

  return (
    <details className="group rounded-2xl border border-separator open:bg-surface/40">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary">
          <BuildingIcon className="size-5 text-foreground" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-foreground">Torre {tower.number}</span>
          <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
            {delivery ? (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                Entrega {delivery}
              </span>
            ) : null}
            {tower.typologies.length ? (
              <span>{plural(tower.typologies.length, "tipología", "tipologías")}</span>
            ) : null}
            {area ? <span>{area}</span> : null}
          </span>
        </span>
        <ChevronDown className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>

      <div className="border-t border-separator px-4 pb-2 pt-3">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground">
          {tower.elevatorCount != null ? (
            <Fact icon={ArrowUpDown}>{plural(tower.elevatorCount, "ascensor", "ascensores")}</Fact>
          ) : null}
          {tower.hasTrashChute ? <Fact icon={Trash}>Shut de basuras</Fact> : null}
        </div>

        {tower.typologies.length ? (
          <ul className="mt-2 divide-y divide-separator">
            {tower.typologies.map((typology, index) => (
              <TypologyRow key={`${typology.name}-${index}`} typology={typology} />
            ))}
          </ul>
        ) : null}
      </div>
    </details>
  );
}

/** One collapsible row per tower. */
export function TowersSection({ towers }: { towers: Tower[] }) {
  if (!towers.length) return null;
  return (
    <Section id="torres" title="Torres">
      <div className="flex flex-col gap-3">
        {towers.map((tower) => (
          <TowerItem key={tower.number} tower={tower} />
        ))}
      </div>
    </Section>
  );
}

/** Sales room contact info, with tappable phone and email. */
export function SalesRoomSection({ salesRoom }: { salesRoom: PropertyDetails["salesRoom"] }) {
  const items: Item[] = [
    { label: "Dirección", value: salesRoom.address },
    {
      label: "Teléfono",
      value: salesRoom.phone && (
        <a href={`tel:${salesRoom.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
          {salesRoom.phone}
        </a>
      ),
    },
    {
      label: "Correo",
      value: salesRoom.email && (
        <a href={`mailto:${salesRoom.email}`} className="break-all hover:underline">
          {salesRoom.email}
        </a>
      ),
    },
    { label: "Horario", value: salesRoom.hours },
  ];
  if (!items.some((item) => item.value)) return null;

  return (
    <Section id="sala-de-ventas" title="Sala de ventas">
      <FactList items={items} className="grid-cols-1 sm:grid-cols-2" />
    </Section>
  );
}

const withPercent = (amount: number | undefined, percent: number | undefined) =>
  amount != null
    ? `${formatCOP(amount)}${percent != null ? ` (${percent}%)` : ""}`
    : percent != null
      ? `${percent}%`
      : undefined;

/** Compact financing breakdown for the price card. */
export function FinancingSummary({ financing }: { financing: PropertyDetails["financing"] }) {
  const items: Item[] = [
    { label: "Separación", value: financing.separationAmount != null ? formatCOP(financing.separationAmount) : undefined },
    { label: "Cuota inicial", value: withPercent(financing.initialFeeAmount, financing.initialFeePercentage) },
    { label: "Crédito", value: withPercent(financing.creditAmount, financing.creditPercentage) },
  ];
  if (!items.some((item) => item.value)) return null;

  return (
    <div>
      <p className="text-sm font-semibold text-foreground">Financiación</p>
      <FactList items={items} className="mt-3 grid-cols-1" />
    </div>
  );
}
