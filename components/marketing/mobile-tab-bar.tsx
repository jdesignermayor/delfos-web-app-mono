"use client";

import { Suspense, use, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound } from "lucide-react";

import { HeartIcon, HomeIcon, SearchIcon } from "@/components/icons";
import type { CurrentUser } from "@/supabase/roles";

const TAB_CLASS =
  "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors";

/**
 * Landing (minimal brutalism): ink labels; the current tab is marked by a thin Delfos-blue bar on its
 * top edge (shape, not just color), the others are dimmed.
 */
const BRUTAL_TAB_CLASS =
  "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition-colors outline-none focus-visible:bg-delfos-sky";

function tabClass(isActive: boolean, brutal = false) {
  if (brutal) {
    return `${BRUTAL_TAB_CLASS} ${
      isActive ? "text-ink before:absolute before:inset-x-5 before:top-0 before:h-0.5 before:bg-delfos" : "text-ink/60 active:bg-delfos-mist"
    }`;
  }
  return `${TAB_CLASS} ${isActive ? "text-accent" : "text-muted hover:text-foreground"}`;
}

function TabLink({
  href,
  isActive,
  icon,
  label,
  brutal = false,
}: {
  href: string;
  isActive: boolean;
  icon: ReactNode;
  label: string;
  brutal?: boolean;
}) {
  return (
    <Link href={href} aria-current={isActive ? "page" : undefined} className={tabClass(isActive, brutal)}>
      {icon}
      {label}
    </Link>
  );
}

const NAVIGATION_TABS = {
  home: { href: "/", label: "Inicio", Icon: HomeIcon, isActive: (pathname: string) => pathname === "/" },
  search: { href: "/search", label: "Buscar", Icon: SearchIcon, isActive: (pathname: string) => pathname === "/search" },
  favorites: {
    href: "/favoritos",
    label: "Favoritos",
    Icon: HeartIcon,
    isActive: (pathname: string) => pathname === "/favoritos" || pathname.startsWith("/favoritos/"),
  },
} as const;

/** One link tab (Inicio, Buscar or Favoritos); reads the URL to highlight the current one. */
function NavigationTab({ tab, brutal = false }: { tab: keyof typeof NAVIGATION_TABS; brutal?: boolean }) {
  const pathname = usePathname();
  const { href, label, Icon, isActive } = NAVIGATION_TABS[tab];
  return (
    <TabLink
      href={href}
      isActive={isActive(pathname)}
      icon={<Icon className="size-6" />}
      label={label}
      brutal={brutal}
    />
  );
}

/** Opens the login modal when signed out, the account menu when signed in. */
function AccountTab({
  userPromise,
  onLoginAction,
  onOpenAccountAction,
  brutal = false,
}: {
  userPromise: Promise<CurrentUser | null>;
  onLoginAction: () => void;
  onOpenAccountAction: () => void;
  brutal?: boolean;
}) {
  const user = use(userPromise);

  return (
    <button type="button" onClick={user ? onOpenAccountAction : onLoginAction} className={tabClass(false, brutal)}>
      <CircleUserRound className="size-6" strokeWidth={1.75} />
      {user ? "Cuenta" : "Ingresar"}
    </button>
  );
}

function TabPlaceholder() {
  return <div aria-hidden className={TAB_CLASS} />;
}

/**
 * Bottom tab bar for phones: Inicio · Buscar · Favoritos · Ingresar/Cuenta. Pages that render it reserve
 * its height with `pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0` so it never covers content.
 */
export function MobileTabBar({
  userPromise,
  onLoginAction,
  onOpenAccountAction,
  brutal = false,
}: {
  userPromise: Promise<CurrentUser | null>;
  onLoginAction: () => void;
  onOpenAccountAction: () => void;
  /** Landing: brutalist bar (white, 3px ink top rule, Delfos-blue marker on the current tab). */
  brutal?: boolean;
}) {
  return (
    <nav
      aria-label="Navegación principal"
      className={`fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)] md:hidden ${
        brutal ? "border-t-[1.5px] border-ink bg-white" : "border-t border-separator bg-white/95 backdrop-blur-xl"
      }`}
    >
      <div className="flex h-16 items-stretch">
        <Suspense fallback={<TabPlaceholder />}>
          <NavigationTab tab="home" brutal={brutal} />
        </Suspense>
        <Suspense fallback={<TabPlaceholder />}>
          <NavigationTab tab="search" brutal={brutal} />
        </Suspense>
        <Suspense fallback={<TabPlaceholder />}>
          <NavigationTab tab="favorites" brutal={brutal} />
        </Suspense>
        <Suspense fallback={<TabPlaceholder />}>
          <AccountTab
            userPromise={userPromise}
            onLoginAction={onLoginAction}
            onOpenAccountAction={onOpenAccountAction}
            brutal={brutal}
          />
        </Suspense>
      </div>
    </nav>
  );
}
