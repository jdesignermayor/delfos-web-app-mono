import type { CSSProperties } from "react";

import { isHexColor, type BrandColors } from "@/lib/brand-colors";

/**
 * CSS custom properties that tint a property page with the project's palette
 * (consumed by the `brand-*` classes in globals.css): accents and the page's
 * CTAs. Site chrome (navbar, search, logo) keeps Delfos' own accent color.
 */

/** Delfos' ink; very light brand colors are mixed toward it so icons stay legible on white. */
const INK = "#0f172a";
/** Above this relative luminance a color is too light to read as an icon on white. */
const LIGHT_LUMINANCE = 0.4;

function relativeLuminance(hex: string): number {
  const channel = (offset: number) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG contrast ratio between two relative luminances (1–21). */
function contrastRatio(a: number, b: number): number {
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

const WHITE_LUMINANCE = 1;

/** WCAG AA for normal-size text (CTA labels are 16px). */
const MIN_CTA_CONTRAST = 4.5;
/** Darkening beyond this changes the brand's hue too much (yellows turn olive): use dark text instead. */
const MAX_CTA_DARKENING = 0.35;

/** `hex` mixed toward black by `amount` (0–1). */
function darken(hex: string, amount: number): string {
  const channels = [1, 3, 5].map((offset) =>
    Math.round(Number.parseInt(hex.slice(offset, offset + 2), 16) * (1 - amount)),
  );
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * CTA background and label color. White labels read like a CTA, so the brand
 * color is darkened just enough for white to pass AA; colors that would need
 * too much darkening keep their hue with Delfos' dark ink as the label.
 */
function ctaColors(hex: string): { background: string; foreground: string } {
  for (let amount = 0; amount <= MAX_CTA_DARKENING; amount += 0.05) {
    const background = darken(hex, amount);
    if (contrastRatio(relativeLuminance(background), WHITE_LUMINANCE) >= MIN_CTA_CONTRAST) {
      return { background, foreground: "#ffffff" };
    }
  }
  return { background: hex, foreground: INK };
}

/** How colorful a hex color is (0–255): near-black navies and grays score low. */
function chroma(hex: string): number {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  return Math.max(...channels) - Math.min(...channels);
}

/** Below this chroma a color looks gray/black as an icon and wouldn't show the brand. */
const MIN_ICON_CHROMA = 60;

/** Icons carry the primary color; if it's too dull to notice, the most colorful one in the palette. */
function iconColor(primary: string, others: string[]): string {
  if (chroma(primary) >= MIN_ICON_CHROMA) return primary;
  return [primary, ...others].reduce((best, color) => (chroma(color) > chroma(best) ? color : best));
}

/** The color itself when it reads well on white, otherwise a darker shade of it. */
function readableOnWhite(hex: string): string {
  return relativeLuminance(hex) > LIGHT_LUMINANCE ? `color-mix(in oklab, ${hex} 55%, ${INK})` : hex;
}

/**
 * Style for the page wrapper, or undefined without a palette. Missing roles
 * borrow from the others, so any single extracted color is enough. Values
 * are validated hex colors, so nothing user-controlled reaches the CSS.
 */
export function brandThemeStyle(colors: BrandColors | undefined): CSSProperties | undefined {
  if (!colors) return undefined;
  const pick = (...candidates: string[]) => candidates.find(isHexColor);

  const primary = pick(colors.primary, colors.secondary, colors.tertiary);
  if (!primary) return undefined;
  const secondary = pick(colors.secondary, colors.tertiary) ?? primary;
  const tertiary = pick(colors.tertiary, colors.secondary) ?? primary;
  const cta = ctaColors(primary);

  return {
    "--brand-primary": primary,
    "--brand-secondary": secondary,
    "--brand-tertiary": tertiary,
    "--brand-ink": readableOnWhite(iconColor(primary, [secondary, tertiary])),
    // CTAs (e.g. "Hablar con un agente") take the project's primary color.
    "--brand-cta": cta.background,
    "--brand-cta-foreground": cta.foreground,
    "--brand-cta-text": readableOnWhite(primary),
  } as CSSProperties;
}
