"use client";

import { deleteTrustCompanyAction } from "@/app/actions/trust-companies";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { queryKeys } from "@/lib/query-keys";
import { trustCompanyQueries } from "@/lib/trust-companies/trust-company-queries";

/** Deletes a fiducia after confirming. */
export function DeleteTrustCompanyButton({
  trustCompanyId,
  name,
  redirectTo,
  placement,
}: {
  trustCompanyId: string;
  name: string;
  redirectTo?: string;
  placement?: "row" | "page";
}) {
  return (
    <DeleteEntityButton
      id={trustCompanyId}
      itemName={name}
      entityLabel="la fiducia"
      consequence="Los inmuebles que ya la tienen asignada conservan su nombre, pero no podrá elegirse en inmuebles nuevos."
      action={deleteTrustCompanyAction}
      mutationKey={queryKeys.trustCompanies.detail(trustCompanyId)}
      listKey={trustCompanyQueries.list().queryKey}
      invalidateKey={queryKeys.trustCompanies.all}
      successMessage={`${name} eliminada`}
      redirectTo={redirectTo}
      placement={placement}
    />
  );
}
