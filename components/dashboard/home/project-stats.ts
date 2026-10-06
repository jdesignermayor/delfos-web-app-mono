import type { Json, Tables } from "@/supabase/types";

export type ProjectRow = Pick<
  Tables<"properties">,
  | "uuid"
  | "title"
  | "created_at"
  | "developer_id"
  | "tower_count"
  | "city"
  | "location"
  | "price"
  | "housing_type"
  | "delivery_date"
  | "typologies"
  | "additional_images"
> & { developer: { name: string } | null };

export type Count = { label: string; count: number };
export type Split = { label: string; count: number }[];

export type RecentProject = {
  uuid: string;
  title: string;
  developer: string;
  municipality: string;
  createdAt: string;
  price: number;
};

export type ProjectStats = {
  total: number;
  addedThisMonth: number;
  addedLastMonth: number;
  /** ISO creation timestamps, for the client-side growth chart (weeks / months). */
  createdAt: string[];
  developers: number;
  towers: number;
  typologies: number;
  photos: number;
  averagePrice: number;
  byDeveloper: Count[];
  byMunicipality: Count[];
  deliveriesByYear: Count[];
  priceRanges: Count[];
  status: Split;
  housing: Split;
  recent: RecentProject[];
};

export const TIME_ZONE = "America/Bogota";
const monthKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit" });

/** "2026-10", in Colombian time so a project created late on the 31st counts in that month. */
export const monthKey = (date: Date) => monthKeyFormat.format(date).slice(0, 7);

const stripAccents = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** City when set, else the municipality part of `location` ("La Estrella, Antioquia"). */
const municipalityOf = (row: Pick<ProjectRow, "city" | "location">) =>
  row.city?.trim() || row.location?.split(",")[0]?.trim() || "Sin ubicación";

function typologyCount(typologies: Json) {
  if (!typologies || typeof typologies !== "object" || Array.isArray(typologies)) return 0;
  let count = 0;
  for (const tower of Object.values(typologies)) if (Array.isArray(tower)) count += tower.length;
  return count;
}

/** Counts by label, largest first; past `limit` the tail folds into "Otras". */
function countBy(labels: string[], limit = 6): Count[] {
  const counts = new Map<string, { label: string; count: number }>();
  for (const label of labels) {
    // "Medellín" and "Medellin" are the same place.
    const key = stripAccents(label).toLowerCase();
    const entry = counts.get(key) ?? { label, count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }
  const sorted = [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"));
  if (sorted.length <= limit) return sorted;
  const rest = sorted.slice(limit - 1).reduce((sum, item) => sum + item.count, 0);
  return [...sorted.slice(0, limit - 1), { label: "Otras", count: rest }];
}

const PRICE_RANGES = [
  { label: "< $400M", max: 400_000_000 },
  { label: "$400–500M", max: 500_000_000 },
  { label: "$500–600M", max: 600_000_000 },
  { label: "$600–700M", max: 700_000_000 },
  { label: "$700M+", max: Infinity },
];

/**
 * Everything the dashboard home shows. Each `properties` row is one project
 * (a development such as "Bantue Apartamentos").
 */
export function computeProjectStats(rows: ProjectRow[], now = new Date()): ProjectStats {
  const thisMonth = monthKey(now);
  const lastMonthDate = new Date(now);
  lastMonthDate.setUTCDate(1);
  lastMonthDate.setUTCMonth(lastMonthDate.getUTCMonth() - 1);
  const lastMonth = monthKey(lastMonthDate);

  const created = rows.flatMap((row) => (row.created_at ? [row.created_at] : []));
  const prices = rows.map((row) => Number(row.price)).filter((price) => Number.isFinite(price) && price > 0);
  const offPlan = rows.filter((row) => row.delivery_date && new Date(row.delivery_date) > now).length;
  const affordable = rows.filter((row) => /^\s*vi[sp]\b/i.test(row.housing_type ?? "")).length;

  return {
    total: rows.length,
    addedThisMonth: created.filter((date) => monthKey(new Date(date)) === thisMonth).length,
    addedLastMonth: created.filter((date) => monthKey(new Date(date)) === lastMonth).length,
    createdAt: created,
    developers: new Set(rows.map((row) => row.developer_id).filter((id) => id != null)).size,
    towers: rows.reduce((sum, row) => sum + (row.tower_count ?? 0), 0),
    typologies: rows.reduce((sum, row) => sum + typologyCount(row.typologies), 0),
    photos: rows.reduce((sum, row) => sum + 1 + (row.additional_images?.length ?? 0), 0),
    averagePrice: prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0,
    byDeveloper: countBy(rows.map((row) => row.developer?.name ?? "Sin constructora")),
    byMunicipality: countBy(rows.map(municipalityOf)),
    deliveriesByYear: countBy(rows.flatMap((row) => (row.delivery_date ? [row.delivery_date.slice(0, 4)] : [])), 99).sort(
      (a, b) => a.label.localeCompare(b.label),
    ),
    priceRanges: PRICE_RANGES.map((range, index) => ({
      label: range.label,
      count: prices.filter((price) => price < range.max && price >= (PRICE_RANGES[index - 1]?.max ?? 0)).length,
    })),
    status: [
      { label: "Sobre planos", count: offPlan },
      { label: "Listo para entregar", count: rows.length - offPlan },
    ],
    housing: [
      { label: "No VIS", count: rows.length - affordable },
      { label: "VIS / VIP", count: affordable },
    ],
    recent: [...rows]
      .filter((row) => row.created_at)
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
      .slice(0, 5)
      .map((row) => ({
        uuid: row.uuid,
        title: row.title,
        developer: row.developer?.name ?? "Sin constructora",
        municipality: municipalityOf(row),
        createdAt: row.created_at ?? "",
        price: Number(row.price),
      })),
  };
}
