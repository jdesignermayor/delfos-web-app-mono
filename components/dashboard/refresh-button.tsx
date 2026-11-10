"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { RotateCw } from "lucide-react";

/** Re-runs the current page's server render (bypassing the client router cache) — for server-side error states. */
export function RefreshButton({ label = "Reintentar" }: { label?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button variant="outline" size="sm" isDisabled={isPending} onPress={() => startTransition(() => router.refresh())}>
      <RotateCw className={`size-4 ${isPending ? "motion-safe:animate-spin" : ""}`} aria-hidden />
      {isPending ? "Reintentando…" : label}
    </Button>
  );
}
