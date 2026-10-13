import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/providers/toast-provider";
import type { ActionResult } from "@/lib/forms/action-result";

/**
 * Deletes one record through a Server Action (TanStack Query mutation). On
 * success it drops the row from the cached list right away, toasts,
 * invalidates `invalidateKey` and, when given, navigates to `redirectTo`
 * (e.g. back to the list from an edit page). Failures stay in
 * `mutation.error` so the caller can show them.
 */
export function useDeleteMutation<TId extends string | number>({
  id,
  action,
  mutationKey,
  listKey,
  invalidateKey,
  successMessage,
  redirectTo,
}: {
  id: TId;
  /** A delete Server Action. */
  action: (id: TId) => Promise<ActionResult>;
  mutationKey: QueryKey;
  /** The cached list holding the row (an array of `{ id }`). */
  listKey: QueryKey;
  invalidateKey: QueryKey;
  successMessage: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...mutationKey, "delete"],
    mutationFn: async () => {
      const result = await action(id);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.setQueryData<{ id: TId }[]>(listKey, (rows) => rows?.filter((row) => row.id !== id));
      toast.success(successMessage);
      void queryClient.invalidateQueries({ queryKey: invalidateKey });
      if (redirectTo) router.push(redirectTo);
    },
  });
}
