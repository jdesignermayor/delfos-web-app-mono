import type { Metadata } from "next";

import { SiteNavbar } from "@/components/marketing/site-navbar";
import { SearchModeProvider } from "@/components/marketing/search-mode-context";
import { SearchFilters } from "@/components/marketing/search-filters";
import { SearchResults } from "@/components/marketing/search-results";
import {
  filterProperties,
  MORE_FILTER_KEYS,
  parseLocations,
  placeShortName,
  sortProperties,
  type Property,
  type PropertyFilters,
} from "@/components/marketing/properties";
import { getDbProperties } from "@/components/marketing/property-adapter";
import { getCurrentUser } from "@/supabase/roles";
import { NOINDEX, currentYear } from "@/lib/site";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type SearchParams = Record<string, string | string[] | undefined>;

function parseFilters(params: SearchParams): PropertyFilters {
  return {
    operacion: first(params.operacion),
    ubicacion: first(params.ubicacion),
    tipo: first(params.tipo),
    habitaciones: first(params.habitaciones),
    presupuesto: first(params.presupuesto),
    asequible: first(params.asequible),
    banos: first(params.banos),
    area: first(params.area),
    estrato: first(params.estrato),
    estado: first(params.estado),
    ascensores: first(params.ascensores),
    constructora: first(params.constructora),
    torres: first(params.torres),
    entrega: first(params.entrega),
    zonas: first(params.zonas),
    orden: first(params.orden),
  };
}

/** Values for the filter bar's Constructora and Zonas comunes pickers, from every listing. */
function filterOptions(properties: Property[]) {
  const sorted = (values: (string | undefined)[]) =>
    [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))].sort((a, b) =>
      a.localeCompare(b, "es"),
    );
  return {
    developers: sorted(properties.map((property) => property.details?.developer?.name)),
    amenities: sorted(properties.flatMap((property) => property.amenities ?? [])),
  };
}

const TYPE_TITLE: Record<string, string> = {
  apartamento: "Apartamentos",
  casa: "Casas",
  apartaestudio: "Apartaestudios",
  proyecto: "Proyectos de vivienda nueva",
};

/**
 * Title/description shaped like the search itself ("Apartamentos nuevos en
 * venta en La Estrella 2026"), with the live result count. Only the core
 * filters (operation, type, place) make an indexable page; refinements like
 * baths or sort order are `noindex` so near-duplicates don't dilute it.
 */
export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  const results = filterProperties(filters, await getDbProperties());
  const renting = filters.operacion === "arrendar";
  // One place reads in full ("El Poblado, Medellín"); several by their short names ("El Poblado y Envigado").
  const places = parseLocations(filters.ubicacion);
  const place =
    places.length > 1
      ? new Intl.ListFormat("es", { type: "conjunction" }).format(places.map(placeShortName))
      : places[0] || "Medellín";
  const kind = TYPE_TITLE[filters.tipo ?? ""] ?? (renting ? "Apartamentos" : "Apartamentos nuevos");
  const title = `${kind} ${renting ? "en arriendo" : "en venta"} en ${place} ${currentYear()}`;
  const description =
    results.length > 0
      ? `${results.length} ${results.length === 1 ? "opción" : "opciones"} de ${kind.toLowerCase()} ${renting ? "en arriendo" : "en venta"} en ${place}, con precios, mapa, tipologías y fechas de entrega. Filtra y agenda tu visita en Delfos.`
      : `Busca ${kind.toLowerCase()} ${renting ? "en arriendo" : "en venta"} en ${place} con mapa y filtros en Delfos.`;

  const core = new URLSearchParams();
  for (const key of ["operacion", "tipo", "ubicacion"] as const) {
    const value = filters[key];
    if (value) core.set(key, value);
  }
  const canonical = core.size ? `/search?${core.toString()}` : "/search";
  const refined = Boolean(
    places.length > 1 ||
      filters.habitaciones ||
      filters.presupuesto ||
      filters.asequible ||
      filters.banos ||
      filters.area ||
      filters.orden ||
      MORE_FILTER_KEYS.some((key) => filters[key]),
  );

  return {
    title,
    description,
    alternates: { canonical },
    robots: NOINDEX || refined || results.length === 0 ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { type: "website", locale: "es_CO", siteName: "Delfos", url: canonical, title, description, images: ["/og/landing"] },
    twitter: { card: "summary_large_image", title, description, images: ["/og/landing"] },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = parseFilters(await searchParams);

  const properties = await getDbProperties();
  const results = sortProperties(filterProperties(filters, properties), filters.orden);

  return (
    <div
      className="light flex min-h-[100dvh] flex-col bg-white text-foreground pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 lg:h-[100dvh] lg:min-h-0 lg:overflow-hidden"
      style={{ colorScheme: "light" }}
    >
      <SearchModeProvider
        initialMode={
          filters.tipo === "proyecto" ? "proyecto" : filters.operacion === "arrendar" ? "arrendar" : "comprar"
        }
      >
        <SiteNavbar searchInPage searchFilters={filters} userPromise={getCurrentUser()} />
        <SearchFilters filters={filters} options={filterOptions(properties)} />
        <SearchResults results={results} />
      </SearchModeProvider>
    </div>
  );
}
