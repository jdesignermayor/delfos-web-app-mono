import { History, TrendingDown, TrendingUp } from "lucide-react";

import type { PriceHistoryEntry } from "@/lib/price-history/price-history";

const currency = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Bogota",
});
const percent = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1, signDisplay: "always" });

/** "+5,2 %" / "−3 %" with an arrow, green when the price went down and red when it went up. */
function Change({ price, previousPrice }: { price: number; previousPrice: number | null }) {
  if (previousPrice === null) return <span className="text-xs text-muted">Precio inicial</span>;
  if (previousPrice === 0) return null;
  const change = ((price - previousPrice) / previousPrice) * 100;
  const up = change > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? "text-danger" : "text-success"}`}>
      <Icon className="size-3.5" />
      {percent.format(change)} %
    </span>
  );
}

/**
 * The project's price log (`property_price_history`), newest first. Read-only on purpose: rows are
 * only ever added, by saving the property with a different price.
 */
export function PriceHistory({ entries }: { entries: PriceHistoryEntry[] | undefined }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <History className="size-4 text-muted" />
        <h3 className="text-sm font-semibold">Historial de precios</h3>
      </div>
      <p className="mt-1 text-xs text-muted">
        Se registra solo al guardar un precio diferente. Los registros no se pueden editar ni borrar.
      </p>

      {entries?.length ? (
        <div className="mt-3 overflow-x-auto rounded-lg border border-separator">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-separator bg-surface-secondary text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-2.5 font-medium">Fecha del cambio</th>
                <th className="px-4 py-2.5 font-medium">Precio</th>
                <th className="px-4 py-2.5 font-medium">Precio anterior</th>
                <th className="px-4 py-2.5 font-medium">Variación</th>
                <th className="px-4 py-2.5 font-medium">Cambiado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator">
              {entries.map((entry, index) => (
                <tr key={entry.id}>
                  <td className="px-4 py-2.5 text-muted">
                    <time dateTime={entry.changedAt}>{dateTime.format(new Date(entry.changedAt))}</time>
                  </td>
                  <td className="px-4 py-2.5 font-medium">
                    {currency.format(entry.price)}
                    {index === 0 ? <span className="ml-2 text-xs font-normal text-muted">(actual)</span> : null}
                  </td>
                  <td className="px-4 py-2.5 text-muted">
                    {entry.previousPrice === null ? "—" : currency.format(entry.previousPrice)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Change price={entry.price} previousPrice={entry.previousPrice} />
                  </td>
                  <td className="px-4 py-2.5 text-muted">{entry.changedBy ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">Aún no hay cambios de precio registrados.</p>
      )}
    </div>
  );
}
