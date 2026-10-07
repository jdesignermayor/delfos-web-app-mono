"use client";

import { useOptimistic, useTransition } from "react";
import { Label, Switch } from "@heroui/react";

import { setDeveloperEnabled } from "@/app/actions/developers";
import { useToast } from "@/components/providers/toast-provider";

/** "Habilitada" toggle for one constructora; flips instantly and rolls back if saving fails. */
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
  const [isPending, startTransition] = useTransition();
  const [optimisticEnabled, setOptimisticEnabled] = useOptimistic(isEnabled);

  function handleChange(next: boolean) {
    startTransition(async () => {
      setOptimisticEnabled(next);
      const result = await setDeveloperEnabled(developerId, next);
      if (!result.success) {
        toast.error("No se pudo actualizar", result.error);
        return;
      }
      toast.success(next ? `${developerName} habilitada` : `${developerName} deshabilitada`);
    });
  }

  return (
    <Switch size="sm" isSelected={optimisticEnabled} isDisabled={isPending} onChange={handleChange}>
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Label className="text-sm text-muted">{optimisticEnabled ? "Habilitada" : "Deshabilitada"}</Label>
      </Switch.Content>
    </Switch>
  );
}
