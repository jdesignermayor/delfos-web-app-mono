"use client";

import type { QueryKey } from "@tanstack/react-query";
import { AlertDialog, Button, useOverlayState } from "@heroui/react";

import { useDeleteMutation } from "@/hooks/use-delete-mutation";
import type { ActionResult } from "@/lib/forms/action-result";

export type DeleteEntityButtonProps<TId extends string | number> = {
  id: TId;
  /** Shown in the confirmation, e.g. the constructora's name. */
  itemName: string;
  /** Singular, with its article: "la constructora", "la fiducia"… */
  entityLabel: string;
  /** What else happens (or doesn't) when deleting, shown under the warning. */
  consequence?: string;
  action: (id: TId) => Promise<ActionResult>;
  mutationKey: QueryKey;
  listKey: QueryKey;
  invalidateKey: QueryKey;
  successMessage: string;
  redirectTo?: string;
  /** "row" for a list's actions column, "page" for an edit page's header. */
  placement?: "row" | "page";
};

/**
 * "Eliminar" button that asks for confirmation in an alert dialog, then
 * deletes through a Server Action. Errors (e.g. "still in use") are shown
 * inside the dialog so the user can read them before closing it.
 */
export function DeleteEntityButton<TId extends string | number>({
  id,
  itemName,
  entityLabel,
  consequence,
  action,
  mutationKey,
  listKey,
  invalidateKey,
  successMessage,
  redirectTo,
  placement = "row",
}: DeleteEntityButtonProps<TId>) {
  const overlay = useOverlayState();
  const mutation = useDeleteMutation({ id, action, mutationKey, listKey, invalidateKey, successMessage, redirectTo });

  function handleOpenChange(isOpen: boolean) {
    // Start each confirmation clean; never close mid-delete.
    if (mutation.isPending) return;
    if (isOpen) mutation.reset();
    overlay.setOpen(isOpen);
  }

  return (
    <AlertDialog isOpen={overlay.isOpen} onOpenChange={handleOpenChange}>
      <Button
        size="sm"
        variant={placement === "page" ? "danger-soft" : "ghost"}
        className={placement === "row" ? "text-danger" : undefined}
      >
        Eliminar
      </Button>

      <AlertDialog.Backdrop>
        <AlertDialog.Container size="sm" placement="center">
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>¿Eliminar {entityLabel}?</AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body className="space-y-2 text-sm">
              <p>
                Vas a eliminar <strong>{itemName}</strong>. Esta acción no se puede deshacer.
              </p>
              {consequence ? <p className="text-muted">{consequence}</p> : null}
              {mutation.error ? (
                <p className="rounded-lg bg-danger/10 px-3 py-2 text-danger" role="alert">
                  {mutation.error.message}
                </p>
              ) : null}
            </AlertDialog.Body>

            <AlertDialog.Footer>
              <Button variant="tertiary" onPress={() => handleOpenChange(false)} isDisabled={mutation.isPending}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onPress={() => mutation.mutate()}
                isDisabled={mutation.isPending || mutation.isSuccess}
              >
                {mutation.isPending ? "Eliminando…" : "Eliminar"}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
