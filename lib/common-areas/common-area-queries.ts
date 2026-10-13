import { queryOptions } from "@tanstack/react-query";

import type { CommonAreaListItem } from "@/lib/common-areas/common-areas";
import { fetchJson } from "@/lib/fetch-json";
import { queryKeys } from "@/lib/query-keys";

/**
 * TanStack Query options for zonas comunes. Shared by the Server Component
 * that prefetches and the Client Components that read, so both use the same
 * key. Client-safe: only types come from the server-only module.
 */
export const commonAreaQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.commonAreas.list(),
      queryFn: () => fetchJson<CommonAreaListItem[]>("/api/common-areas", "No se pudieron cargar las zonas comunes."),
    }),
};
