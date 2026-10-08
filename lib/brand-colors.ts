/** Base colors of a project's brand, stored in `properties.brand_colors`. */
export const BRAND_COLOR_KEYS = ["primary", "secondary", "tertiary"] as const;

export type BrandColorKey = (typeof BRAND_COLOR_KEYS)[number];

/** Hex values ("#1a2b3c"); "" while a color isn't set. */
export type BrandColors = Record<BrandColorKey, string>;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value);
}

/** Reads the stored JSON into the form's shape, ignoring anything that isn't a hex color. */
export function parseBrandColors(value: unknown): BrandColors {
  const source = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  return Object.fromEntries(
    BRAND_COLOR_KEYS.map((key) => {
      const color = source[key];
      return [key, typeof color === "string" && isHexColor(color) ? color.toLowerCase() : ""];
    }),
  ) as BrandColors;
}

/** Only the valid colors, lowercased, so `brand_colors` holds just what was set. */
export function cleanBrandColors(colors: Partial<BrandColors> | undefined): Partial<BrandColors> {
  return Object.fromEntries(
    BRAND_COLOR_KEYS.flatMap((key) => {
      const color = colors?.[key]?.trim() ?? "";
      return isHexColor(color) ? [[key, color.toLowerCase()]] : [];
    }),
  );
}
