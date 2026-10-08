"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { confirmFiduciasReviewedAction } from "@/app/actions/onboarding";
import { SECONDARY_ACTION } from "@/components/dashboard/onboarding/onboarding-step";
import { useToast } from "@/components/providers/toast-provider";

/** "Ya las revisé" — completes the fiducias step of the onboarding. */
export function ConfirmFiduciasButton() {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await confirmFiduciasReviewedAction();
      if (!result.success) {
        toast.error("No se pudo completar el paso", result.error);
        return;
      }
      toast.success("Fiducias verificadas", "Ya puedes crear tu primera propiedad.");
      router.refresh();
    });
  }

  return (
    <button type="button" disabled={isPending} onClick={handleClick} className={SECONDARY_ACTION}>
      <Check className="size-4" strokeWidth={1.75} />
      {isPending ? "Guardando…" : "Ya las revisé"}
    </button>
  );
}
