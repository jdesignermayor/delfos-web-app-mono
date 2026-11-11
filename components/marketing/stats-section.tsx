import { LiveIcon, type LiveIconName } from "@/components/marketing/live-icon";
import { getLandingStats } from "@/lib/data/landing";
import { millions, yearRange } from "@/lib/landing-seo";

type Stat = { icon: LiveIconName; value: string; label: string };

/** Ink band, split by white rules: rows on phones (compact), three columns from `sm` up. */
const BAND = "border-b-[3px] border-ink bg-ink text-white";
const GRID = "mx-auto grid w-full max-w-6xl divide-y-2 divide-white/25 px-4 sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0 sm:px-6";
const CELL = "flex items-center gap-4 py-5 sm:flex-col sm:items-start sm:gap-3 sm:px-6 sm:py-10 sm:first:pl-0";

/**
 * Live proof strip: the same memoized numbers the page metadata uses, so what the page claims always
 * matches the listings. Each stat only shows when its number exists; with no data the strip is omitted.
 */
export async function StatsSection() {
  const stats = await getLandingStats();
  if (!stats) return null;

  const candidates: (Stat | false | null)[] = [
    {
      icon: "layers",
      value: stats.count.toLocaleString("es-CO"),
      label: stats.count === 1 ? "proyecto de vivienda nueva" : "proyectos de vivienda nueva",
    },
    stats.minPrice > 0 && { icon: "dollar", value: `Desde ${millions(stats.minPrice)}`, label: "precio de entrada" },
    stats.deliveryYears && { icon: "calendar", value: yearRange(stats.deliveryYears), label: "años de entrega" },
  ];
  const items = candidates.filter((item): item is Stat => Boolean(item));

  return (
    <section aria-label="Delfos en cifras" className={BAND}>
      <dl className={GRID}>
        {items.map(({ icon, value, label }) => (
          <div key={label} className={CELL}>
            {/* Not clickable, so its icon plays once as it scrolls into view. */}
            <div className="flex size-12 shrink-0 items-center justify-center border-[1.5px] border-white text-brut-yellow shadow-[2px_2px_0_0_var(--color-brut-yellow)]">
              <LiveIcon name={icon} size={24} />
            </div>
            <div className="flex min-w-0 flex-col-reverse">
              <dt className="font-mono text-xs uppercase tracking-widest text-white/80">{label}</dt>
              <dd className="font-display text-2xl font-bold tracking-tight tabular-nums text-brut-yellow sm:text-4xl">
                {value}
              </dd>
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
    <div aria-hidden="true" className={BAND}>
      <div className={GRID}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={CELL}>
            <div className="size-12 shrink-0 animate-pulse bg-white/15 motion-reduce:animate-none" />
            <div className="flex flex-col gap-2">
              <div className="h-7 w-28 animate-pulse bg-white/15 motion-reduce:animate-none sm:h-9" />
              <div className="h-3 w-36 animate-pulse bg-white/15 motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
