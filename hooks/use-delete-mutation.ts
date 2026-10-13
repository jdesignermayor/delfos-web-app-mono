import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/providers/toast-provider";
import type { ActionResult } from "@/lib/forms/action-result";

/** How long "Deshacer" stays available after a delete. */
export const UNDO_WINDOW_MS = 7000;

type DeleteResult<TSnapshot> = { success: true; data: TSnapshot } | { success: false; error: string };

/**
 * Deletes one record through a Server Action (TanStack Query mutation). On
 * success it drops the row from the cached list right away, invalidates
 * `invalidateKey`, navigates to `redirectTo` when given, and shows a toast
 * offering "Deshacer" for `UNDO_WINDOW_MS`: pressing it sends the deleted
 * row's snapshot to `restoreAction`. Failures stay in `mutation.error` so
 * the caller can show them.
 */
export function useDeleteMutation<TId extends string | number, TSnapshot>({
  id,
  itemName,
  action,
  restoreAction,
  mutationKey,
  listKey,
  invalidateKey,
  redirectTo,
}: {
  id: TId;
  /** Used in the toasts: "«<itemName>» se eliminó / se restauró". */
  itemName: string;
  /** A delete Server Action that returns the deleted row's snapshot. */
  action: (id: TId) => Promise<DeleteResult<TSnapshot>>;
  /** A restore Server Action that re-creates the row from that snapshot. */
  restoreAction: (snapshot: TSnapshot) => Promise<ActionResult>;
  mutationKey: QueryKey;
  /** The cached list holding the row (an array of `{ id }`). */
  listKey: QueryKey;
  invalidateKey: QueryKey;
  redirectTo?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Runs from the toast, after this component may have unmounted (its row
  // is gone from the list), so it only uses the query client and the toast.
  async function undo(snapshot: TSnapshot) {
    const result = await restoreAction(snapshot).catch(() => null);
    if (!result?.success) {
      toast.error("No se pudo deshacer", result?.error ?? "Intenta de nuevo.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: invalidateKey });
    toast.success(`«${itemName}» se restauró`);
  }

  return useMutation({
    mutationKey: [...mutationKey, "delete"],
    mutationFn: async () => {
      const result = await action(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (snapshot) => {
      queryClient.setQueryData<{ id: TId }[]>(listKey, (rows) => rows?.filter((row) => row.id !== id));
      void queryClient.invalidateQueries({ queryKey: invalidateKey });
      toast.show({
        type: "success",
        title: `«${itemName}» se eliminó`,
        description: `Puedes deshacerlo durante ${UNDO_WINDOW_MS / 1000} segundos.`,
        duration: UNDO_WINDOW_MS,
        action: { label: "Deshacer", onPress: () => void undo(snapshot) },
      });
      if (redirectTo) router.push(redirectTo);
    },
  });
}
