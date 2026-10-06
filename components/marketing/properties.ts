import type { NumberRange } from "@/lib/typology-ranges";

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
  /** Bedroom / bathroom / built-area (m²) ranges across the project's typologies. Absent when unknown. */
  beds?: NumberRange;
  baths?: NumberRange;
  parking?: number;
  area?: NumberRange;
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
  /** Project, financing and sales-room data. Only real (DB) listings have it. */
  details?: PropertyDetails;
  /** SEO/ads fields from the dashboard's SEO step. Only real (DB) listings have it. */
  seo?: PropertySeo;
};

/** `properties.seo`, per platform; every field is optional (only filled ones are stored). */
export type PropertySeo = {
  meta: Partial<Record<"ogTitle" | "ogDescription" | "ogImage" | "pixelId" | "campaign", string>>;
  google: Partial<Record<"metaTitle" | "slug" | "metaDescription" | "keywords" | "canonicalUrl" | "adsConversionId", string>>;
  youtube: Partial<Record<"videoUrl" | "videoTitle" | "tags" | "videoDescription", string>>;
  linkedin: Partial<Record<"title" | "insightTagId" | "description" | "image", string>>;
};

/** A unit layout offered in one tower of the project. */
export type Typology = {
  name: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  hasStudy?: boolean;
  hasBalcony?: boolean;
};

export type Tower = {
  /** 1-based tower number, from the `tower-N` key. */
  number: number;
  /** ISO date (YYYY-MM-DD). */
  deliveryDate?: string;
  elevatorCount?: number;
  hasTrashChute?: boolean;
  typologies: Typology[];
};

export type PropertyDetails = {
  /** Constructora (`developer_id`) and the phone used for the WhatsApp contact button. */
  developer?: { name: string; phone?: string };
  /** "VIS" / "No VIS". */
  housingType?: string;
  /** Gerencia. */
  constructionCompany?: string;
  trustCompany?: string;
  constructionBank?: string;
  /** ISO date (YYYY-MM-DD). */
  deliveryDate?: string;
  towerCount?: number;
  towers: Tower[];
  financing: {
    initialFeePercentage?: number;
    initialFeeAmount?: number;
    creditPercentage?: number;
    creditAmount?: number;
    separationAmount?: number;
  };
  salesRoom: {
    address?: string;
    phone?: string;
    email?: string;
    hours?: string;
  };
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

/** Neighbourhoods inside Medellín, searched as "<barrio>, Medellín". */
export const MEDELLIN_AREAS = [
  "El Poblado",
  "Laureles",
  "Belén",
  "La América",
  "Estadio",
  "Ciudad del Río",
  "Calasanz",
  "Robledo",
];

/** Municipalities of the Aburrá Valley, searched by name alone (they aren't part of Medellín). */
export const NEARBY_MUNICIPALITIES = ["Envigado", "Sabaneta", "Itagüí", "La Estrella", "Bello"];

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
    beds: { min: 3, max: 3 },
    baths: { min: 3, max: 3 },
    parking: 2,
    area: { min: 98, max: 98 },
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
    beds: { min: 2, max: 2 },
    baths: { min: 2, max: 2 },
    parking: 1,
    area: { min: 74, max: 74 },
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
    beds: { min: 3, max: 3 },
    baths: { min: 2, max: 2 },
    parking: 1,
    area: { min: 62, max: 62 },
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
    beds: { min: 2, max: 2 },
    baths: { min: 1, max: 1 },
    parking: 1,
    area: { min: 54, max: 54 },
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
    beds: { min: 4, max: 4 },
    baths: { min: 4, max: 4 },
    parking: 3,
    area: { min: 210, max: 210 },
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
    beds: { min: 1, max: 1 },
    baths: { min: 1, max: 1 },
    parking: 1,
    area: { min: 38, max: 38 },
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
    beds: { min: 3, max: 3 },
    baths: { min: 2, max: 2 },
    parking: 1,
    area: { min: 68, max: 68 },
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
    beds: { min: 1, max: 1 },
    baths: { min: 1, max: 1 },
    parking: 0,
    area: { min: 32, max: 32 },
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
    beds: { min: 3, max: 3 },
    baths: { min: 2, max: 2 },
    parking: 1,
    area: { min: 60, max: 60 },
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
    beds: { min: 2, max: 2 },
    baths: { min: 2, max: 2 },
    parking: 1,
    area: { min: 58, max: 58 },
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

/** `$ 139.320.000` — any peso amount, no decimals. */
export function formatCOP(value: number) {
  return currency.format(value);
}

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
  /** Refinements only offered by the /search filter bar (not by the main search). */
  banos?: string;
  area?: string;
  estrato?: string;
  estado?: string;
  orden?: string;
};

/** Built-area buckets (m²) for the `area` filter. */
export const AREA_OPTIONS = [
  { value: "0-50", label: "Hasta 50 m²", min: 0, max: 50 },
  { value: "50-80", label: "50 – 80 m²", min: 50, max: 80 },
  { value: "80-120", label: "80 – 120 m²", min: 80, max: 120 },
  { value: "120-", label: "Más de 120 m²", min: 120, max: Infinity },
] as const;

export const STATUS_OPTIONS: { value: string; label: Property["status"] }[] = [
  { value: "sobre-planos", label: "Sobre planos" },
  { value: "listo", label: "Listo para estrenar" },
  { value: "usado", label: "Usado" },
];

export const SORT_OPTIONS = [
  { value: "", label: "Relevancia" },
  { value: "precio-asc", label: "Menor precio" },
  { value: "precio-desc", label: "Mayor precio" },
  { value: "entrega", label: "Entrega más pronta" },
] as const;

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

/** Lowercase and accent-free, so "medellin" finds "Medellín". */
const normalizeText = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * "Proyectos nuevos" covers every new development — off-plan or ready to move
 * in — not just listings typed as "proyecto". Real listings are always typed
 * by their unit (apartamento, casa…), so matching on type alone found nothing.
 */
export function isNewProject(property: Pick<Property, "type" | "status">) {
  return property.type === "proyecto" || property.status !== "Usado";
}

export function filterProperties(
  filters: PropertyFilters,
  source: Property[] = PROPERTIES,
): Property[] {
  const tokens = normalizeText(filters.ubicacion ?? "").split(/[\s,]+/).filter(Boolean);
  const minBeds = filters.habitaciones ? Number.parseInt(filters.habitaciones, 10) : 0;
  const budgetCap = filters.presupuesto ? BUDGET_MAX[filters.presupuesto] : undefined;
  const minBaths = filters.banos ? Number.parseInt(filters.banos, 10) : 0;
  const areaBucket = AREA_OPTIONS.find((option) => option.value === filters.area);
  const stratum = filters.estrato ? Number.parseInt(filters.estrato, 10) : 0;
  const status = STATUS_OPTIONS.find((option) => option.value === filters.estado)?.label;

  return source.filter((property) => {
    if (filters.operacion && property.operation !== filters.operacion) return false;
    if (filters.tipo === "proyecto" ? !isNewProject(property) : filters.tipo && property.type !== filters.tipo) {
      return false;
    }
    if (filters.asequible === "si" && !property.affordable) return false;
    // A project matches when at least one of its typologies has enough bedrooms.
    if (minBeds && (!property.beds || property.beds.max < minBeds)) return false;
    if (budgetCap && property.price > budgetCap) return false;
    if (minBaths && (!property.baths || property.baths.max < minBaths)) return false;
    // A project matches when any of its typologies falls in the bucket.
    if (areaBucket && (!property.area || property.area.max < areaBucket.min || property.area.min >= areaBucket.max)) {
      return false;
    }
    if (stratum && property.stratum !== stratum) return false;
    if (status && property.status !== status) return false;
    if (tokens.length) {
      const haystack = normalizeText(
        [property.title, property.projectName, property.neighborhood, property.city, property.address]
          .filter(Boolean)
          .join(" "),
      );
      if (!tokens.every((token) => haystack.includes(token))) return false;
    }
    return true;
  });
}

/** Applies the `orden` filter; "relevancia" keeps the source order (newest first). */
export function sortProperties(properties: Property[], orden: string | undefined): Property[] {
  const sorted = [...properties];
  if (orden === "precio-asc") sorted.sort((a, b) => a.price - b.price);
  else if (orden === "precio-desc") sorted.sort((a, b) => b.price - a.price);
  else if (orden === "entrega") {
    const time = (p: Property) => (p.details?.deliveryDate ? Date.parse(p.details.deliveryDate) : Infinity);
    sorted.sort((a, b) => time(a) - time(b));
  }
  return sorted;
}

export function buildSearchQuery(filters: PropertyFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
