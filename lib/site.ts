/** Public origin for absolute URLs (Open Graph, canonical, JSON-LD). Override per environment with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://godelfos.co").replace(/\/+$/, "");

export const SITE_NAME = "Delfos";

/** Landing title/description: what people search for (new housing, Medellín, Valle de Aburrá) up front. */
export const SITE_TITLE = "Delfos | Proyectos de vivienda nueva en Medellín y el Valle de Aburrá";
export const SITE_DESCRIPTION =
  "Encuentra apartamentos y casas nuevas para comprar en Medellín, Envigado, Sabaneta, Itagüí y La Estrella. Compara proyectos sobre planos, precios, tipologías y fechas de entrega de las mejores constructoras.";

/** Brand blue used in generated images (matches the app's accent). */
export const BRAND_COLOR = "#0b84ff";

/** Set NEXT_PUBLIC_NOINDEX=1 on staging/preview deployments to keep them out of search engines. */
export const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === "1";
