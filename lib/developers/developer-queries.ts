import { queryOptions } from "@tanstack/react-query";

import type { DeveloperListItem } from "@/lib/developers/developers";
import { fetchJson } from "@/lib/fetch-json";
import { queryKeys } from "@/lib/query-keys";

/**
 * TanStack Query options for constructoras. Shared by the Server Component
 * that prefetches and the Client Components that read, so both use the same
 * key. Client-safe: only types come from the server-only module.
 */
export const developerQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.developers.list(),
      queryFn: () => fetchJson<DeveloperListItem[]>("/api/developers", "No se pudieron cargar las constructoras."),
    }),
};
