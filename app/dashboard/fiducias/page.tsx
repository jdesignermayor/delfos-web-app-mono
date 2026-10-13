import Link from "next/link";
import type { Metadata } from "next";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Card, buttonVariants } from "@heroui/react";

import { ArrowRightIcon } from "@/components/icons";
import { FiduciasTable } from "@/components/dashboard/fiducias/fiducias-table";
import { requireDashboardUser } from "@/lib/auth/dal";
import { canAccessEntity, developerScope } from "@/lib/auth/permissions";
import { listTrustCompanies } from "@/lib/trust-companies/trust-companies";
import { trustCompanyQueries } from "@/lib/trust-companies/trust-company-queries";

export const metadata: Metadata = { title: "Fiducias" };

export default async function FiduciasPage() {
  const user = await requireDashboardUser();
  const canEdit = canAccessEntity(user, "trust_companies", "modify");

  // Prefetch on the server so the table renders with data; the browser
  // cache takes over from there. `queryFn` is overridden because the
  // client one fetches a relative URL that only resolves in the browser.
  // A failed fetch isn't dehydrated: the table retries in the browser and
  // shows the error there.
  const queryClient = new QueryClient();
  await queryClient
    .query({ ...trustCompanyQueries.list(), queryFn: () => listTrustCompanies(developerScope(user)) })
    .catch(() => undefined);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fiducias</h1>
          <p className="mt-1 text-sm text-muted">Gestiona las fiducias del sistema</p>
        </div>
        <Link href="/dashboard/fiducias/new" className={buttonVariants({ variant: "primary", size: "sm" })}>
          Nueva fiducia
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>

      <Card className="p-5">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <FiduciasTable canEdit={canEdit} />
        </HydrationBoundary>
      </Card>
    </div>
  );
}
