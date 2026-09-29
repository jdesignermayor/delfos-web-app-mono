import type { Json } from "@/supabase/types";

/** Inclusive numeric range, e.g. the smallest and largest typology of a project. */
export type NumberRange = { min: number; max: number };

/** "54–98", or "54" when both ends match. */
export function formatRange({ min, max }: NumberRange) {
  const fmt = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 1 });
  return min === max ? fmt(min) : `${fmt(min)}–${fmt(max)}`;
}

function toRange(values: number[]): NumberRange | undefined {
  return values.length ? { min: Math.min(...values), max: Math.max(...values) } : undefined;
}

/**
 * Area, bedroom and bathroom ranges across every typology of every tower in
 * `properties.typologies` (`{ "tower-1": Typology[], ... }`). These replace the
 * per-property area/bedrooms/bathrooms columns.
 */
export function typologyRanges(typologies: Json) {
  const list =
    typologies && typeof typologies === "object" && !Array.isArray(typologies)
      ? Object.values(typologies).flatMap((tower) => (Array.isArray(tower) ? tower : []))
      : [];

  const numbers = (key: "area" | "bedrooms" | "bathrooms") =>
    list.flatMap((item) => {
      const raw = item && typeof item === "object" && !Array.isArray(item) ? item[key] : null;
      const n = Number(String(raw ?? "").replace(",", "."));
      return raw != null && raw !== "" && Number.isFinite(n) ? [n] : [];
    });

  return {
    area: toRange(numbers("area")),
    bedrooms: toRange(numbers("bedrooms")),
    bathrooms: toRange(numbers("bathrooms")),
  };
}
