import type { Metadata } from "next";

import { SiteNavbar } from "@/components/marketing/site-navbar";
import { SearchModeProvider } from "@/components/marketing/search-mode-context";
import { SearchFilters } from "@/components/marketing/search-filters";
import { SearchResults } from "@/components/marketing/search-results";
import {
  filterProperties,
  type PropertyFilters,
} from "@/components/marketing/properties";
import { getDbProperties } from "@/components/marketing/property-adapter";
import { getCurrentUser } from "@/supabase/roles";

export const metadata: Metadata = {
  title: "Buscar propiedades",
  description:
    "Busca vivienda nueva y usada para comprar o arrendar en Colombia con Delfos, con mapa y filtros.",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters: PropertyFilters = {
    operacion: first(params.operacion),
    ubicacion: first(params.ubicacion),
    tipo: first(params.tipo),
    habitaciones: first(params.habitaciones),
    presupuesto: first(params.presupuesto),
    asequible: first(params.asequible),
  };

  const results = filterProperties(filters, await getDbProperties());

  return (
    <div
      className="light flex min-h-[100dvh] flex-col bg-background text-foreground lg:h-[100dvh] lg:min-h-0 lg:overflow-hidden"
      style={{ colorScheme: "light" }}
    >
      <SearchModeProvider initialMode={filters.operacion === "arrendar" ? "arrendar" : "comprar"}>
        <SiteNavbar alwaysShowSearch userPromise={getCurrentUser()} />
        <SearchFilters filters={filters} />
        <SearchResults results={results} />
      </SearchModeProvider>
    </div>
  );
}
