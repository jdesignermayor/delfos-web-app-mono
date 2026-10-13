import { queryOptions } from "@tanstack/react-query";

import type { BankListItem } from "@/lib/banks/banks";
import { fetchJson } from "@/lib/fetch-json";
import { queryKeys } from "@/lib/query-keys";

/**
 * TanStack Query options for bancos. Shared by the Server Component that
 * prefetches and the Client Components that read, so both use the same key.
 * Client-safe: only types come from the server-only module.
 */
export const bankQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.banks.list(),
      queryFn: () => fetchJson<BankListItem[]>("/api/banks", "No se pudieron cargar los bancos."),
    }),
};
