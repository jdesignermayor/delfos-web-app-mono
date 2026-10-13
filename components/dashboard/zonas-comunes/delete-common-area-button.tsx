"use client";

import { deleteCommonAreaAction } from "@/app/actions/common-areas";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { commonAreaQueries } from "@/lib/common-areas/common-area-queries";
import { queryKeys } from "@/lib/query-keys";

/** Deletes a zona común after confirming. */
export function DeleteCommonAreaButton({
  commonAreaId,
  name,
  redirectTo,
  placement,
}: {
  commonAreaId: string;
  name: string;
  redirectTo?: string;
  placement?: "row" | "page";
}) {
  return (
    <DeleteEntityButton
      id={commonAreaId}
      itemName={name}
      entityLabel="la zona común"
      consequence="Los inmuebles que ya la incluyen la conservan, pero no podrá elegirse en inmuebles nuevos."
      action={deleteCommonAreaAction}
      mutationKey={queryKeys.commonAreas.detail(commonAreaId)}
      listKey={commonAreaQueries.list().queryKey}
      invalidateKey={queryKeys.commonAreas.all}
      successMessage={`${name} eliminada`}
      redirectTo={redirectTo}
      placement={placement}
    />
  );
}
