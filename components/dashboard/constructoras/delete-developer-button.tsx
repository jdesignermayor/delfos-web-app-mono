"use client";

import { deleteDeveloperAction } from "@/app/actions/developers";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { developerQueries } from "@/lib/developers/developer-queries";
import { queryKeys } from "@/lib/query-keys";

/** Deletes a constructora after confirming; refused while anything still references it. */
export function DeleteDeveloperButton({
  developerId,
  name,
  redirectTo,
  placement,
}: {
  developerId: number;
  name: string;
  redirectTo?: string;
  placement?: "row" | "page";
}) {
  return (
    <DeleteEntityButton
      id={developerId}
      itemName={name}
      entityLabel="la constructora"
      consequence="Solo se puede eliminar si no tiene usuarios, proyectos, inmuebles ni fiducias propias. Si solo quieres bloquear el acceso, deshabilítala."
      action={deleteDeveloperAction}
      mutationKey={queryKeys.developers.detail(developerId)}
      listKey={developerQueries.list().queryKey}
      invalidateKey={queryKeys.developers.all}
      successMessage={`${name} eliminada`}
      redirectTo={redirectTo}
      placement={placement}
    />
  );
}
