/**
 * Mock catalogue of listings used by the marketing site and the /search
 * results page. There is no backend yet — this is deterministic sample data
 * so the search flow can be demoed end to end.
 */

export type Operation = "comprar" | "arrendar";
export type PropertyType = "apartamento" | "casa" | "apartaestudio" | "proyecto";

export type Property = {
  slug: string;
  title: string;
  /** Development / project name, when the listing belongs to one. */
  projectName?: string;
  neighborhood: string;
  city: string;
  operation: Operation;
  type: PropertyType;
  /** Price in Colombian pesos. For arriendo it is the monthly value. */
  price: number;
  beds: number;
  baths: number;
  parking: number;
  /** Built area in m². */
  area: number;
  /** Vivienda de Interés Social / Prioritario — the "affordable" filter. */
  affordable: boolean;
  status: "Sobre planos" | "Listo para estrenar" | "Usado";
  /** Hue used to tint the placeholder thumbnail. */
  hue: number;
  /** Approximate location, used to place the property on the map. Absent until a pin is set. */
  lat?: number;
  lng?: number;
  /** Photo URL. When absent, cards fall back to the tinted placeholder. */
  image?: string;
  /** Gallery photo URLs for the property detail page. Falls back to tinted placeholders when absent. */
  images?: string[];
  /** Short marketing description shown on the detail page. */
  description?: string;
  /** Building/unit amenities shown in the "Servicios" section of the detail page. */
  amenities?: string[];
  /** Complete address of the property. */
  address?: string;
  /** Socioeconomic stratum (estrato 1–6). */
  stratum?: number;
};

/** Default map view — roughly the centre of the Aburrá Valley. */
export const MEDELLIN_CENTER = { lat: 6.23, lng: -75.58 };

export const TYPE_LABELS: Record<PropertyType, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  apartaestudio: "Apartaestudio",
  proyecto: "Proyecto sobre planos",
};

export const OPERATION_LABELS: Record<Operation, string> = {
  comprar: "En venta",
  arrendar: "En arriendo",
};

export const MEDELLIN_AREAS = [
  "El Poblado",
  "Laureles",
  "Envigado",
  "Sabaneta",
  "Belén",
  "La América",
  "Estadio",
  "Ciudad del Río",
  "Calasanz",
  "Robledo",
];

export const PROPERTIES: Property[] = [
  {
    slug: "mirador-de-la-frontera",
    lat: 6.2079,
    lng: -75.5668,
    title: "Mirador de la Frontera",
    neighborhood: "El Poblado",
    city: "Medellín",
    operation: "comprar",
    type: "proyecto",
    price: 890_000_000,
    beds: 3,
    baths: 3,
    parking: 2,
    area: 98,
    affordable: false,
    status: "Sobre planos",
    hue: 210,
    address: "Carrera 43A # 12-56, El Poblado, Medellín, Antioquia",
  },
  {
    slug: "nogal-living",
    lat: 6.2441,
    lng: -75.5921,
    title: "Nogal Living",
    neighborhood: "Laureles",
    city: "Medellín",
    operation: "comprar",
    type: "apartamento",
    price: 640_000_000,
    beds: 2,
    baths: 2,
    parking: 1,
    area: 74,
    affordable: false,
    status: "Listo para estrenar",
    hue: 160,
    address: "Calle 75 # 52-123, Laureles, Medellín, Antioquia",
  },
  {
    slug: "parques-de-sabaneta",
    lat: 6.1522,
    lng: -75.6162,
    title: "Parques de Sabaneta",
    neighborhood: "Sabaneta",
    city: "Medellín",
    operation: "comprar",
    type: "proyecto",
    price: 335_000_000,
    beds: 3,
    baths: 2,
    parking: 1,
    area: 62,
    affordable: true,
    status: "Sobre planos",
    hue: 32,
    address: "Avenida Bolívar # 88-45, Sabaneta, Medellín, Antioquia",
  },
  {
    slug: "altos-de-belen",
    lat: 6.2308,
    lng: -75.6047,
    title: "Altos de Belén",
    neighborhood: "Belén",
    city: "Medellín",
    operation: "comprar",
    type: "apartamento",
    price: 268_000_000,
    beds: 2,
    baths: 1,
    parking: 1,
    area: 54,
    affordable: true,
    status: "Listo para estrenar",
    hue: 280,
    address: "Calle 35 # 65-89, Belén, Medellín, Antioquia",
  },
  {
    slug: "casa-jardin-envigado",
    lat: 6.1698,
    lng: -75.5838,
    title: "Casa Jardín Envigado",
    neighborhood: "Envigado",
    city: "Medellín",
    operation: "comprar",
    type: "casa",
    price: 1_250_000_000,
    beds: 4,
    baths: 4,
    parking: 3,
    area: 210,
    affordable: false,
    status: "Usado",
    hue: 12,
  },
  {
    slug: "loft-ciudad-del-rio",
    lat: 6.2246,
    lng: -75.5748,
    title: "Loft Ciudad del Río",
    neighborhood: "Ciudad del Río",
    city: "Medellín",
    operation: "arrendar",
    type: "apartaestudio",
    price: 2_450_000,
    beds: 1,
    baths: 1,
    parking: 1,
    area: 38,
    affordable: false,
    status: "Listo para estrenar",
    hue: 190,
  },
  {
    slug: "apartamento-la-america",
    lat: 6.2472,
    lng: -75.6051,
    title: "Apartamento La América",
    neighborhood: "La América",
    city: "Medellín",
    operation: "arrendar",
    type: "apartamento",
    price: 1_650_000,
    beds: 3,
    baths: 2,
    parking: 1,
    area: 68,
    affordable: false,
    status: "Usado",
    hue: 130,
  },
  {
    slug: "estudio-estadio",
    lat: 6.2533,
    lng: -75.5901,
    title: "Estudio Estadio",
    neighborhood: "Estadio",
    city: "Medellín",
    operation: "arrendar",
    type: "apartaestudio",
    price: 1_180_000,
    beds: 1,
    baths: 1,
    parking: 0,
    area: 32,
    affordable: true,
    status: "Usado",
    hue: 48,
  },
  {
    slug: "torres-de-calasanz",
    lat: 6.2629,
    lng: -75.6109,
    title: "Torres de Calasanz",
    neighborhood: "Calasanz",
    city: "Medellín",
    operation: "comprar",
    type: "proyecto",
    price: 312_000_000,
    beds: 3,
    baths: 2,
    parking: 1,
    area: 60,
    affordable: true,
    status: "Sobre planos",
    hue: 258,
  },
  {
    slug: "verde-robledo",
    lat: 6.2788,
    lng: -75.5905,
    title: "Verde Robledo",
    neighborhood: "Robledo",
    city: "Medellín",
    operation: "arrendar",
    type: "apartamento",
    price: 2_100_000,
    beds: 2,
    baths: 2,
    parking: 1,
    area: 58,
    affordable: false,
    status: "Listo para estrenar",
    hue: 96,
  },
];

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** `$ 890.000.000` for venta, `$ 2.450.000 / mes` for arriendo. */
export function formatPrice(property: Pick<Property, "price" | "operation">) {
  const value = currency.format(property.price);
  return property.operation === "arrendar" ? `${value} / mes` : value;
}

/** Compact price for map pins — `$890 M` for venta, `$2,4 M` for arriendo. */
export function formatPriceShort(property: Pick<Property, "price" | "operation">) {
  const millions = property.price / 1_000_000;
  if (property.operation === "arrendar") {
    return `$${millions.toLocaleString("es-CO", { maximumFractionDigits: 1 })} M`;
  }
  return `$${Math.round(millions).toLocaleString("es-CO")} M`;
}

export type PropertyFilters = {
  operacion?: string;
  ubicacion?: string;
  tipo?: string;
  habitaciones?: string;
  presupuesto?: string;
  asequible?: string;
};

/** Upper bounds (COP) for each budget bucket the search box offers. */
const BUDGET_MAX: Record<string, number> = {
  "venta-300": 300_000_000,
  "venta-500": 500_000_000,
  "venta-800": 800_000_000,
  "venta-1200": 1_200_000_000,
  "arriendo-1500": 1_500_000,
  "arriendo-2500": 2_500_000,
  "arriendo-4000": 4_000_000,
};

export const BUDGET_OPTIONS: { value: string; label: string; operation: Operation }[] = [
  { value: "venta-300", label: "Hasta $300M", operation: "comprar" },
  { value: "venta-500", label: "Hasta $500M", operation: "comprar" },
  { value: "venta-800", label: "Hasta $800M", operation: "comprar" },
  { value: "venta-1200", label: "Hasta $1.200M", operation: "comprar" },
  { value: "arriendo-1500", label: "Hasta $1.5M / mes", operation: "arrendar" },
  { value: "arriendo-2500", label: "Hasta $2.5M / mes", operation: "arrendar" },
  { value: "arriendo-4000", label: "Hasta $4M / mes", operation: "arrendar" },
];

export function getPropertyBySlug(slug: string): Property | undefined {
  return PROPERTIES.find((property) => property.slug === slug);
}

export function filterProperties(
  filters: PropertyFilters,
  source: Property[] = PROPERTIES,
): Property[] {
  const query = filters.ubicacion?.trim().toLowerCase();
  const minBeds = filters.habitaciones ? Number.parseInt(filters.habitaciones, 10) : 0;
  const budgetCap = filters.presupuesto ? BUDGET_MAX[filters.presupuesto] : undefined;

  return source.filter((property) => {
    if (filters.operacion && property.operation !== filters.operacion) return false;
    if (filters.tipo && property.type !== filters.tipo) return false;
    if (filters.asequible === "si" && !property.affordable) return false;
    if (minBeds && property.beds < minBeds) return false;
    if (budgetCap && property.price > budgetCap) return false;
    if (query) {
      const haystack = `${property.title} ${property.neighborhood} ${property.city}`.toLowerCase();
      const tokens = query.split(/[\s,]+/).filter(Boolean);
      if (!tokens.every((token) => haystack.includes(token))) return false;
    }
    return true;
  });
}

export function buildSearchQuery(filters: PropertyFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
