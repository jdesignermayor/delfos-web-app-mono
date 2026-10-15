"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

import { confirmEmailAction } from "@/app/actions/auth";

/** Exchanges the emailed confirmation token on click (not on page load), then opens the account. */
export function ConfirmEmailButton({ tokenHash }: { tokenHash: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await confirmEmailAction({ tokenHash });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.replace(result.hasAccountAccess ? "/dashboard" : "/");
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button variant="primary" fullWidth isDisabled={isPending} onPress={confirm}>
        {isPending ? "Activando…" : "Activar mi cuenta"}
      </Button>
    </div>
  );
}
