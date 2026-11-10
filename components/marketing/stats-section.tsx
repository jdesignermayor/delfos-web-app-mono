import type { ComponentType } from "react";

import { BuildingIcon, TagIcon, KeyIcon } from "@/components/icons";
import { getLandingStats } from "@/lib/data/landing";
import { millions, yearRange } from "@/lib/landing-seo";

type Stat = { icon: ComponentType<{ className?: string }>; value: string; label: string };

/**
 * Live proof strip: the same memoized numbers the page metadata uses, so what the page claims always
 * matches the listings. Each stat only shows when its number exists; with no data the strip is omitted.
 */
export async function StatsSection() {
  const stats = await getLandingStats();
  if (!stats) return null;

  const candidates: (Stat | false | null)[] = [
    {
      icon: BuildingIcon,
      value: stats.count.toLocaleString("es-CO"),
      label: stats.count === 1 ? "proyecto de vivienda nueva" : "proyectos de vivienda nueva",
    },
    stats.minPrice > 0 && { icon: TagIcon, value: `Desde ${millions(stats.minPrice)}`, label: "precio de entrada" },
    stats.deliveryYears && { icon: KeyIcon, value: yearRange(stats.deliveryYears), label: "años de entrega" },
  ];
  const items = candidates.filter((item): item is Stat => Boolean(item));

  return (
    <section aria-label="Delfos en cifras" className="border-y border-separator bg-surface-secondary">
      <dl className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6 sm:py-12">
        {items.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex items-center gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Icon className="size-5" />
            </div>
            <div className="flex flex-col-reverse">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="font-display text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Same footprint as the loaded strip, so streaming it in causes no layout shift. */
export function StatsSectionSkeleton() {
  return (
    <div aria-hidden="true" className="border-y border-separator bg-surface-secondary">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6 sm:py-12">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="size-11 shrink-0 animate-pulse rounded-xl bg-default" />
            <div className="flex flex-col gap-2">
              <div className="h-7 w-28 animate-pulse rounded-md bg-default sm:h-8" />
              <div className="h-4 w-36 animate-pulse rounded-md bg-default" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
