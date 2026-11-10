import type { UseQueryResult } from "@tanstack/react-query";
import { Button, Skeleton } from "@heroui/react";
import { CircleAlert, Inbox, RotateCw } from "lucide-react";

const SKELETON_ROWS = 5;

/** Icon + title + optional detail, centered: the shared shape of the empty and error states. */
function StateMessage({
  icon: Icon,
  tone,
  title,
  detail,
  children,
}: {
  icon: typeof Inbox;
  tone: "muted" | "danger";
  title: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <span
        className={`flex size-12 items-center justify-center rounded-2xl ${
          tone === "danger" ? "bg-danger/10 text-danger" : "bg-surface-secondary text-muted"
        }`}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {detail ? <p className="mt-1 max-w-md text-sm text-muted">{detail}</p> : null}
      </div>
      {children}
    </div>
  );
}

/**
 * Renders a list query's loading (row skeletons shaped like the table), error (with retry) and
 * empty states, and hands the rows to `children` once there are some.
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
  if (query.isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <span role="status" className="sr-only">
          {loadingMessage}
        </span>
        <Skeleton className="h-4 w-full rounded-lg" />
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div role="alert">
        <StateMessage icon={CircleAlert} tone="danger" title="No se pudo cargar la lista" detail={query.error.message}>
          <Button size="sm" variant="outline" onPress={() => query.refetch()} isDisabled={query.isRefetching}>
            <RotateCw className={`size-4 ${query.isRefetching ? "motion-safe:animate-spin" : ""}`} aria-hidden />
            {query.isRefetching ? "Reintentando…" : "Reintentar"}
          </Button>
        </StateMessage>
      </div>
    );
  }

  if (query.data.length === 0) return <StateMessage icon={Inbox} tone="muted" title={emptyMessage} />;

  return children(query.data);
}
