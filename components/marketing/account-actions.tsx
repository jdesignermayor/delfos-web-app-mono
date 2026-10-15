"use client";

import { use, useTransition } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@heroui/react";
import { CircleUserRound } from "lucide-react";

import { signOutAccount } from "@/app/actions/auth";
import { useFavorites } from "@/components/marketing/favorites-provider";
import { canAccessAccount, isViewer } from "@/lib/auth/permissions";
import type { CurrentUser } from "@/supabase/roles";

export function AccountSkeleton({ fullWidth = false }: { fullWidth?: boolean }) {
  return (
    <div
      aria-hidden
      className={`h-8 animate-pulse rounded-lg bg-surface-secondary ${fullWidth ? "w-full" : "w-20"}`}
    />
  );
}

function SignOutButton({ fullWidth }: { fullWidth: boolean }) {
  const [isPending, startTransition] = useTransition();
  const favorites = useFavorites();
  return (
    <Button
      variant="outline"
      size="sm"
      fullWidth={fullWidth}
      isDisabled={isPending}
      onPress={() =>
        startTransition(async () => {
          favorites?.clear();
          await signOutAccount();
        })
      }
    >
      {isPending ? "Saliendo…" : "Cerrar sesión"}
    </Button>
  );
}

/** Resolves the session promise streamed from the server; suspends until it settles. */
export function AccountActions({
  userPromise,
  fullWidth = false,
  onLogin,
  onNavigate,
}: {
  userPromise: Promise<CurrentUser | null>;
  fullWidth?: boolean;
  onLogin: () => void;
  onNavigate?: () => void;
}) {
  const user = use(userPromise);

  if (!user) {
    return (
      <Button variant="ghost" size="sm" fullWidth={fullWidth} onPress={onLogin} className="gap-2 font-semibold">
        <CircleUserRound className="size-6" strokeWidth={1.75} />
        Ingresar
      </Button>
    );
  }

  return (
    <>
      {canAccessAccount(user) ? (
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={buttonVariants({ variant: "ghost", size: "sm", fullWidth })}
        >
          {isViewer(user) ? "Mi cuenta" : "Dashboard"}
        </Link>
      ) : null}
      <SignOutButton fullWidth={fullWidth} />
    </>
  );
}
