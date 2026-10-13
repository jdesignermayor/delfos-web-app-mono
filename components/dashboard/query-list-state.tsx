import type { UseQueryResult } from "@tanstack/react-query";
import { Button } from "@heroui/react";

/**
 * Renders a list query's loading, error (with retry) and empty states, and
 * hands the rows to `children` once there are some.
 */
export function QueryListState<TRow>({
  query,
  loadingMessage,
  emptyMessage,
  children,
}: {
  query: UseQueryResult<TRow[]>;
  loadingMessage: string;
  emptyMessage: string;
  children: (rows: TRow[]) => React.ReactNode;
}) {
  if (query.isPending) return <p className="text-center text-muted">{loadingMessage}</p>;

  if (query.isError) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-danger">{query.error.message}</p>
        <Button size="sm" variant="outline" onPress={() => query.refetch()} isDisabled={query.isRefetching}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (query.data.length === 0) return <p className="text-center text-muted">{emptyMessage}</p>;

  return children(query.data);
}
