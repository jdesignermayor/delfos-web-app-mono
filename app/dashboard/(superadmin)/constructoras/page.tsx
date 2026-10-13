import Link from "next/link";
import type { Metadata } from "next";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Card, buttonVariants } from "@heroui/react";

import { ArrowRightIcon } from "@/components/icons";
import { ConstructorasTable } from "@/components/dashboard/constructoras/constructoras-table";
import { developerQueries } from "@/lib/developers/developer-queries";
import { listDevelopers } from "@/lib/developers/developers";

export const metadata: Metadata = { title: "Constructoras" };

export default async function ConstructorasPage() {
  // Prefetch on the server so the table renders with data; the browser
  // cache takes over from there. `queryFn` is overridden because the
  // client one fetches a relative URL that only resolves in the browser.
  // A failed fetch isn't dehydrated: the table retries in the browser and
  // shows the error there.
  const queryClient = new QueryClient();
  await queryClient.query({ ...developerQueries.list(), queryFn: listDevelopers }).catch(() => undefined);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Constructoras</h1>
          <p className="mt-1 text-sm text-muted">Gestiona las constructoras del sistema</p>
        </div>
        <Link href="/dashboard/constructoras/new" className={buttonVariants({ variant: "primary", size: "sm" })}>
          Nueva constructora
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>

      <Card className="p-5">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ConstructorasTable />
        </HydrationBoundary>
      </Card>
    </div>
  );
}
