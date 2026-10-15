"use client";

import { Suspense, use, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CircleUserRound } from "lucide-react";

import { HeartIcon, SearchIcon } from "@/components/icons";
import type { CurrentUser } from "@/supabase/roles";

const TAB_CLASS =
  "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors";

function tabClass(isActive: boolean) {
  return `${TAB_CLASS} ${isActive ? "text-accent" : "text-muted hover:text-foreground"}`;
}

function TabLink({ href, isActive, icon, label }: { href: string; isActive: boolean; icon: ReactNode; label: string }) {
  return (
    <Link href={href} aria-current={isActive ? "page" : undefined} className={tabClass(isActive)}>
      {icon}
      {label}
    </Link>
  );
}

/** Search and favourites tabs; reads the URL to highlight the current one. */
function NavigationTabs({ favoritesTab }: { favoritesTab?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onSearch = pathname === "/search";
  const onFavorites = onSearch && searchParams.has("favoritos");

  return favoritesTab ? (
    <TabLink
      href="/search?favoritos=1"
      isActive={onFavorites}
      icon={<HeartIcon className="size-6" />}
      label="Favoritos"
    />
  ) : (
    <TabLink
      href="/search"
      isActive={onSearch && !onFavorites}
      icon={<SearchIcon className="size-6" />}
      label="Buscar"
    />
  );
}

/** Opens the login modal when signed out, the account menu when signed in. */
function AccountTab({
  userPromise,
  onLoginAction,
  onOpenAccountAction,
}: {
  userPromise: Promise<CurrentUser | null>;
  onLoginAction: () => void;
  onOpenAccountAction: () => void;
}) {
  const user = use(userPromise);

  return (
    <button type="button" onClick={user ? onOpenAccountAction : onLoginAction} className={tabClass(false)}>
      <CircleUserRound className="size-6" strokeWidth={1.75} />
      {user ? "Cuenta" : "Ingresar"}
    </button>
  );
}

function TabPlaceholder() {
  return <div aria-hidden className={TAB_CLASS} />;
}

/**
 * Bottom tab bar for phones: Buscar · Favoritos · Ingresar/Cuenta. Pages that render it reserve
 * its height with `pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0` so it never covers content.
 */
export function MobileTabBar({
  userPromise,
  onLoginAction,
  onOpenAccountAction,
}: {
  userPromise: Promise<CurrentUser | null>;
  onLoginAction: () => void;
  onOpenAccountAction: () => void;
}) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-separator bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <div className="flex h-16 items-stretch">
        <Suspense fallback={<TabPlaceholder />}>
          <NavigationTabs />
        </Suspense>
        <Suspense fallback={<TabPlaceholder />}>
          <NavigationTabs favoritesTab />
        </Suspense>
        <Suspense fallback={<TabPlaceholder />}>
          <AccountTab userPromise={userPromise} onLoginAction={onLoginAction} onOpenAccountAction={onOpenAccountAction} />
        </Suspense>
      </div>
    </nav>
  );
}
