"use client";

import { deleteBankAction, restoreBankAction } from "@/app/actions/banks";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { bankQueries } from "@/lib/banks/bank-queries";
import { queryKeys } from "@/lib/query-keys";

/** Deletes a banco after confirming, with a few seconds to undo. */
export function DeleteBankButton({
  bankId,
  name,
  redirectTo,
  placement,
}: {
  bankId: string;
  name: string;
  redirectTo?: string;
  placement?: "row" | "page";
}) {
  return (
    <DeleteEntityButton
      id={bankId}
      itemName={name}
      entityLabel="el banco"
      consequence="El banco constructor de los inmuebles es texto libre, así que no se ve afectado."
      action={deleteBankAction}
      restoreAction={restoreBankAction}
      mutationKey={queryKeys.banks.detail(bankId)}
      listKey={bankQueries.list().queryKey}
      invalidateKey={queryKeys.banks.all}
      redirectTo={redirectTo}
      placement={placement}
    />
  );
}
