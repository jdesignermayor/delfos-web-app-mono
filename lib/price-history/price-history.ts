/** One row of a project's price log (`property_price_history`). Safe on client and server. */
export type PriceHistoryEntry = {
  id: number;
  /** COP. */
  price: number;
  /** The price before this change; `null` for the first recorded price. */
  previousPrice: number | null;
  /** ISO timestamp. */
  changedAt: string;
  /** Name (or email) of who saved it; `null` for prices recorded before the log existed. */
  changedBy: string | null;
};

/** `properties.price` as a number of pesos ("464000000" → 464000000); `null` when it isn't one. */
export function parsePrice(value: string | number | null | undefined): number | null {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}
