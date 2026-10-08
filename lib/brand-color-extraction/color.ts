/** Color parsing and comparison for brand-color extraction (no dependencies). */

export type Rgb = { r: number; g: number; b: number };

/** Every color literal we understand inside CSS text: hex, rgb()/rgba(), hsl()/hsla(). */
export const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|rgba?\([^()]*\)|hsla?\([^()]*\)/gi;

/** Colors mostly transparent are decoration (overlays, shadows), not brand colors. */
const MIN_ALPHA = 0.5;

const clamp = (value: number, max = 255) => Math.min(max, Math.max(0, value));

function parseHex(value: string): Rgb | null {
  let hex = value.slice(1);
  if (hex.length === 3 || hex.length === 4) hex = [...hex].map((char) => char + char).join("");
  if (hex.length !== 6 && hex.length !== 8) return null;
  if (hex.length === 8 && Number.parseInt(hex.slice(6, 8), 16) / 255 < MIN_ALPHA) return null;
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

/** "0.5", "50%" → 0..1 */
function parseAlpha(value: string | undefined): number {
  if (!value) return 1;
  return value.endsWith("%") ? Number.parseFloat(value) / 100 : Number.parseFloat(value);
}

/** Splits "rgb(1, 2, 3 / 50%)" or "rgb(1 2 3 / .5)" into its numeric parts. */
function functionArgs(value: string): string[] {
  const inner = value.slice(value.indexOf("(") + 1, -1);
  return inner.split(/[\s,/]+/).filter(Boolean);
}

function parseRgbFunction(value: string): Rgb | null {
  const [r, g, b, alpha] = functionArgs(value);
  if (b === undefined || parseAlpha(alpha) < MIN_ALPHA) return null;
  const channel = (part: string) =>
    part.endsWith("%") ? (Number.parseFloat(part) / 100) * 255 : Number.parseFloat(part);
  const rgb = { r: channel(r), g: channel(g), b: channel(b) };
  if (Object.values(rgb).some(Number.isNaN)) return null;
  return { r: Math.round(clamp(rgb.r)), g: Math.round(clamp(rgb.g)), b: Math.round(clamp(rgb.b)) };
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

function parseHslFunction(value: string): Rgb | null {
  const [h, s, l, alpha] = functionArgs(value);
  if (l === undefined || parseAlpha(alpha) < MIN_ALPHA) return null;
  const hue = Number.parseFloat(h);
  const saturation = clamp(Number.parseFloat(s), 100) / 100;
  const lightness = clamp(Number.parseFloat(l), 100) / 100;
  if ([hue, saturation, lightness].some(Number.isNaN)) return null;
  return hslToRgb(((hue % 360) + 360) % 360, saturation, lightness);
}

/** Parses one color literal; null for anything unsupported, mostly transparent or using var(). */
export function parseColor(value: string): Rgb | null {
  const literal = value.trim().toLowerCase();
  if (literal.includes("var(")) return null;
  if (literal.startsWith("#")) return parseHex(literal);
  if (literal.startsWith("rgb")) return parseRgbFunction(literal);
  if (literal.startsWith("hsl")) return parseHslFunction(literal);
  return null;
}

/** All colors written in a CSS value or stylesheet chunk. */
export function colorsIn(text: string): Rgb[] {
  return (text.match(COLOR_LITERAL) ?? []).map(parseColor).filter((color): color is Rgb => color !== null);
}

export function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** Saturation and lightness (0..1) — enough to tell brand colors from grays. */
export function saturationLightness({ r, g, b }: Rgb): { saturation: number; lightness: number } {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const lightness = (max + min) / 2;
  const delta = max - min;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return { saturation, lightness };
}

/** Colorful enough to be a brand color: not white, black or gray. */
export function isChromatic(color: Rgb): boolean {
  const { saturation, lightness } = saturationLightness(color);
  return saturation >= 0.25 && lightness >= 0.12 && lightness <= 0.9;
}

/** Near-white backgrounds never make a useful brand color, even as a last resort. */
export function isNearWhite(color: Rgb): boolean {
  return saturationLightness(color).lightness > 0.94;
}

/** Perceptual-ish distance ("redmean"); below ~60 two colors read as the same. */
export function colorDistance(a: Rgb, b: Rgb): number {
  const meanRed = (a.r + b.r) / 2;
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt((2 + meanRed / 256) * dr * dr + 4 * dg * dg + (2 + (255 - meanRed) / 256) * db * db);
}
