"use client";

import type { QueryKey } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { AlertDialog, Button, useOverlayState } from "@heroui/react";

import { SHARP_BUTTON_CLASS } from "@/components/dashboard/row-actions";
import { UNDO_WINDOW_MS, useDeleteMutation } from "@/hooks/use-delete-mutation";
import type { ActionResult } from "@/lib/forms/action-result";

export type DeleteEntityButtonProps<TId extends string | number, TSnapshot> = {
  id: TId;
  /** Shown in the confirmation and toasts, e.g. the constructora's name. */
  itemName: string;
  /** Singular, with its article: "la constructora", "el banco"… */
  entityLabel: string;
  /** What else happens (or doesn't) when deleting, shown under the warning. */
  consequence?: string;
  action: (id: TId) => Promise<{ success: true; data: TSnapshot } | { success: false; error: string }>;
  restoreAction: (snapshot: TSnapshot) => Promise<ActionResult>;
  mutationKey: QueryKey;
  listKey: QueryKey;
  invalidateKey: QueryKey;
  redirectTo?: string;
  /** "row": icon-only, for a list's actions column. "page": icon + label, for an edit page's header. */
  placement?: "row" | "page";
};

/**
 * Sharp trash button that asks for confirmation in an alert dialog, then
 * deletes through a Server Action and offers "Deshacer" for a few seconds.
 * Errors (e.g. "still in use") are shown inside the dialog so the user can
 * read them before closing it.
 */
export function DeleteEntityButton<TId extends string | number, TSnapshot>({
  id,
  itemName,
  entityLabel,
  consequence,
  action,
  restoreAction,
  mutationKey,
  listKey,
  invalidateKey,
  redirectTo,
  placement = "row",
}: DeleteEntityButtonProps<TId, TSnapshot>) {
  const overlay = useOverlayState();
  const mutation = useDeleteMutation({
    id,
    itemName,
    action,
    restoreAction,
    mutationKey,
    listKey,
    invalidateKey,
    redirectTo,
  });

  function handleOpenChange(isOpen: boolean) {
    // Start each confirmation clean; never close mid-delete.
    if (mutation.isPending) return;
    if (isOpen) mutation.reset();
    overlay.setOpen(isOpen);
  }

  return (
    <AlertDialog isOpen={overlay.isOpen} onOpenChange={handleOpenChange}>
      {placement === "row" ? (
        <Button
          size="sm"
          variant="ghost"
          isIconOnly
          aria-label={`Eliminar ${itemName}`}
          className={`${SHARP_BUTTON_CLASS} text-danger`}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      ) : (
        <Button size="sm" variant="danger-soft" className={SHARP_BUTTON_CLASS}>
          <Trash2 className="size-4" aria-hidden />
          Eliminar
        </Button>
      )}

      <AlertDialog.Backdrop>
        <AlertDialog.Container size="sm" placement="center">
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>¿Eliminar {entityLabel}?</AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body className="space-y-2 text-sm">
              <p>
                Vas a eliminar <strong>{itemName}</strong>. Podrás deshacerlo durante {UNDO_WINDOW_MS / 1000} segundos.
              </p>
              {consequence ? <p className="text-muted">{consequence}</p> : null}
              {mutation.error ? (
                <p className="rounded-lg bg-danger/10 px-3 py-2 text-danger" role="alert">
                  {mutation.error.message}
                </p>
              ) : null}
            </AlertDialog.Body>

            <AlertDialog.Footer>
              <Button
                variant="tertiary"
                className={SHARP_BUTTON_CLASS}
                onPress={() => handleOpenChange(false)}
                isDisabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                className={SHARP_BUTTON_CLASS}
                onPress={() => mutation.mutate()}
                isDisabled={mutation.isPending || mutation.isSuccess}
              >
                <Trash2 className="size-4" aria-hidden />
                {mutation.isPending ? "Eliminando…" : "Eliminar"}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
