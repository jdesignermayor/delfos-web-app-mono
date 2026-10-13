"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Label, Switch } from "@heroui/react";

import { setDeveloperEnabled } from "@/app/actions/developers";
import { useToast } from "@/components/providers/toast-provider";
import { developerQueries } from "@/lib/developers/developer-queries";
import { queryKeys } from "@/lib/query-keys";

/**
 * "Habilitada" toggle for one constructora. Flips the cached list row
 * instantly, rolls it back if saving fails, then refetches to settle.
 */
export function DeveloperEnabledSwitch({
  developerId,
  developerName,
  isEnabled,
}: {
  developerId: number;
  developerName: string;
  isEnabled: boolean;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const listKey = developerQueries.list().queryKey;

  const mutation = useMutation({
    mutationKey: queryKeys.developers.detail(developerId),
    mutationFn: async (next: boolean) => {
      const result = await setDeveloperEnabled(developerId, next);
      if (!result.success) throw new Error(result.error);
    },
    onMutate: async (next) => {
      // Stop an in-flight refetch from overwriting the optimistic value.
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData(listKey);
      queryClient.setQueryData(listKey, (rows) =>
        rows?.map((row) => (row.id === developerId ? { ...row, isEnabled: next } : row)),
      );
      return { previous };
    },
    onError: (error, _next, context) => {
      queryClient.setQueryData(listKey, context?.previous);
      toast.error("No se pudo actualizar", error.message);
    },
    onSuccess: (_data, next) => {
      toast.success(next ? `${developerName} habilitada` : `${developerName} deshabilitada`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.developers.all }),
  });

  return (
    <Switch size="sm" isSelected={isEnabled} isDisabled={mutation.isPending} onChange={(next) => mutation.mutate(next)}>
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Label className="text-sm text-muted">{isEnabled ? "Habilitada" : "Deshabilitada"}</Label>
      </Switch.Content>
    </Switch>
  );
}
