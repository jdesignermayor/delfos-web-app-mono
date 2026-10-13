import { queryOptions } from "@tanstack/react-query";

import { fetchJson } from "@/lib/fetch-json";
import { queryKeys } from "@/lib/query-keys";
import type { TrustCompanyListItem } from "@/lib/trust-companies/trust-companies";

/**
 * TanStack Query options for fiducias. Shared by the Server Component that
 * prefetches and the Client Components that read, so both use the same key.
 * Client-safe: only types come from the server-only module.
 */
export const trustCompanyQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.trustCompanies.list(),
      queryFn: () => fetchJson<TrustCompanyListItem[]>("/api/trust-companies", "No se pudieron cargar las fiducias."),
    }),
};
