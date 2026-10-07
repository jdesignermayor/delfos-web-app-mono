import { Card, Skeleton } from "@heroui/react";

const TABLE_ROWS = 6;

/**
 * Generic dashboard page placeholder — header plus a table-shaped card,
 * matching the layout most dashboard pages share so content swaps in
 * without a layout jump.
 */
export function DashboardPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>

      <Card className="flex flex-col gap-4 p-5">
        <Skeleton className="h-4 w-full rounded-lg" />
        {Array.from({ length: TABLE_ROWS }, (_, index) => (
          <Skeleton key={index} className="h-9 w-full rounded-lg" />
        ))}
      </Card>
    </div>
  );
}
