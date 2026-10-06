/** Public origin for absolute URLs (Open Graph, canonical, JSON-LD). Override per environment with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://godelfos.co").replace(/\/+$/, "");

export const SITE_NAME = "Delfos";

/** Current year in Colombia, for fresh, query-shaped titles ("… en venta 2026"). */
export const currentYear = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric" }).format(new Date());

/**
 * Landing title/description phrased like real searches (and the Bing queries
 * ChatGPT sends): offer + "en venta" + place + year, then concrete facts.
 * Used as-is when live numbers aren't available.
 */
export const SITE_TITLE = `Apartamentos nuevos en venta en Medellín ${currentYear()} | Delfos`;
export const SITE_DESCRIPTION =
  "Compara proyectos de vivienda nueva en venta en Medellín, Envigado, Sabaneta, Itagüí y La Estrella: precios, tipologías y fechas de entrega. Agenda tu visita.";

/** Brand blue used in generated images (matches the app's accent). */
export const BRAND_COLOR = "#0b84ff";

/** Set NEXT_PUBLIC_NOINDEX=1 on staging/preview deployments to keep them out of search engines. */
export const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === "1";
