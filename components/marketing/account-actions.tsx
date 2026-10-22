"use client";

import { use, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, Button, Dropdown, Label } from "@heroui/react";
import { MenuIcon, type MenuIconHandle } from "lucide-animated";
import { CircleUserRound, Heart, LayoutDashboard, LogOut, UserRound } from "lucide-react";

import { signOutAccount } from "@/app/actions/auth";
import { useFavorites } from "@/components/marketing/favorites-provider";
import { initials } from "@/lib/initials";
import { canAccessDashboard } from "@/lib/auth/permissions";
import type { CurrentUser } from "@/supabase/roles";

const PROFILE_HREF = "/dashboard/profile";
const FAVORITES_HREF = "/favoritos";

export function AccountSkeleton({ fullWidth = false }: { fullWidth?: boolean }) {
  return (
    <div
      aria-hidden
      className={`h-8 animate-pulse rounded-lg bg-surface-secondary ${fullWidth ? "w-full" : "w-20"}`}
    />
  );
}

/** Clears the shared favorites at once, then signs out on the server (which redirects home). */
function useSignOut() {
  const [isPending, startTransition] = useTransition();
  const favorites = useFavorites();
  function signOut() {
    startTransition(async () => {
      favorites?.clear();
      await signOutAccount();
    });
  }
  return { signOut, isPending };
}

function UserAvatar({ user, size = "sm" }: { user: CurrentUser; size?: "sm" | "md" }) {
  const displayName = user.name || user.email || "Mi perfil";
  return (
    <Avatar size={size}>
      {user.avatarUrl ? <Avatar.Image src={user.avatarUrl} alt={displayName} /> : null}
      <Avatar.Fallback color="accent">{initials(user.name, user.email)}</Avatar.Fallback>
    </Avatar>
  );
}

/** Desktop: the avatar (opens the profile) and a hamburger menu with the account options. */
function AccountMenu({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const iconRef = useRef<MenuIconHandle>(null);
  const { signOut, isPending } = useSignOut();

  function handleAction(key: React.Key) {
    if (key === "sign-out") signOut();
    else router.push(String(key));
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href={PROFILE_HREF}
        aria-label="Mi perfil"
        title="Mi perfil"
        className="rounded-full transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <UserAvatar user={user} />
      </Link>

      <Dropdown
        // The icon morphs into an X while the menu is open.
        onOpenChange={(isOpen) => (isOpen ? iconRef.current?.startAnimation() : iconRef.current?.stopAnimation())}
      >
        <Dropdown.Trigger
          aria-label="Menú de la cuenta"
          isDisabled={isPending}
          className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-secondary"
        >
          <MenuIcon ref={iconRef} size={22} />
        </Dropdown.Trigger>
        <Dropdown.Popover placement="bottom end" className="min-w-52">
          <Dropdown.Menu aria-label="Opciones de la cuenta" onAction={handleAction}>
            <Dropdown.Item id={FAVORITES_HREF} textValue="Lista de favoritos">
              <Heart className="size-4 text-muted" />
              <Label>Lista de favoritos</Label>
            </Dropdown.Item>
            <Dropdown.Item id={PROFILE_HREF} textValue="Perfil">
              <UserRound className="size-4 text-muted" />
              <Label>Perfil</Label>
            </Dropdown.Item>
            {canAccessDashboard(user) ? (
              <Dropdown.Item id="/dashboard" textValue="Dashboard">
                <LayoutDashboard className="size-4 text-muted" />
                <Label>Dashboard</Label>
              </Dropdown.Item>
            ) : null}
            <Dropdown.Item id="sign-out" textValue="Cerrar sesión" variant="danger">
              <LogOut className="size-4" />
              <Label>{isPending ? "Saliendo…" : "Cerrar sesión"}</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}

const MOBILE_ITEM_CLASS =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary";

/** Phones (inside the header's own hamburger menu): the same options as a plain list. */
function MobileAccountList({ user, onNavigate }: { user: CurrentUser; onNavigate?: () => void }) {
  const { signOut, isPending } = useSignOut();

  return (
    <div className="flex w-full flex-col gap-1">
      <Link href={PROFILE_HREF} onClick={onNavigate} className={`${MOBILE_ITEM_CLASS} mb-1`}>
        <UserAvatar user={user} />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{user.name || user.email}</span>
          <span className="block text-xs font-normal text-muted">Ver perfil</span>
        </span>
      </Link>
      <Link href={FAVORITES_HREF} onClick={onNavigate} className={MOBILE_ITEM_CLASS}>
        <Heart className="size-4 text-muted" />
        Lista de favoritos
      </Link>
      <Link href={PROFILE_HREF} onClick={onNavigate} className={MOBILE_ITEM_CLASS}>
        <UserRound className="size-4 text-muted" />
        Perfil
      </Link>
      {canAccessDashboard(user) ? (
        <Link href="/dashboard" onClick={onNavigate} className={MOBILE_ITEM_CLASS}>
          <LayoutDashboard className="size-4 text-muted" />
          Dashboard
        </Link>
      ) : null}
      <button type="button" onClick={signOut} disabled={isPending} className={`${MOBILE_ITEM_CLASS} text-danger`}>
        <LogOut className="size-4" />
        {isPending ? "Saliendo…" : "Cerrar sesión"}
      </button>
    </div>
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

  return fullWidth ? <MobileAccountList user={user} onNavigate={onNavigate} /> : <AccountMenu user={user} />;
}
