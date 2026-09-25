"use client";

import { Suspense, use, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button, buttonVariants, useOverlayState } from "@heroui/react";

import { signOutAccount } from "@/app/actions/auth";

import { CloseIcon, LogoMark, MenuIcon } from "@/components/icons";
import { HomeIcon } from "@/components/icons/animated/home";
import { KeyIcon } from "@/components/icons/animated/key";
import { MapPinHouseIcon } from "@/components/icons/animated/map-pin-house";
import { AuthModal } from "@/components/marketing/auth-modal";
import { MiniSearchTrigger } from "@/components/marketing/mini-search-trigger";
import { MobileLocationButton } from "@/components/marketing/mobile-location-button";
import { PropertySearch } from "@/components/marketing/property-search";
import { SEARCH_MODES, useSearchMode } from "@/components/marketing/search-mode-context";
import type { CurrentUser } from "@/supabase/roles";

const TAB_ICONS = {
  comprar: HomeIcon,
  arrendar: KeyIcon,
  proyecto: MapPinHouseIcon,
} as const;

function AccountSkeleton({ fullWidth = false }: { fullWidth?: boolean }) {
  return (
    <div
      aria-hidden
      className={`h-8 animate-pulse rounded-lg bg-surface-secondary ${fullWidth ? "w-full" : "w-20"}`}
    />
  );
}

/** Resolves the session promise streamed from the server; suspends until it settles. */
function AccountActions({
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
  const [isPending, startTransition] = useTransition();

  if (!user) {
    return (
      <Button variant="ghost" size="sm" fullWidth={fullWidth} onPress={onLogin}>
        Ingresar
      </Button>
    );
  }

  return (
    <>
      {user.role === "superadmin" ? (
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={buttonVariants({ variant: "ghost", size: "sm", fullWidth })}
        >
          Dashboard
        </Link>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        fullWidth={fullWidth}
        isDisabled={isPending}
        onPress={() => startTransition(async () => { await signOutAccount(); })}
      >
        {isPending ? "Saliendo…" : "Cerrar sesión"}
      </Button>
    </>
  );
}

export function SiteNavbar({
  alwaysShowSearch = false,
  userPromise,
}: {
  alwaysShowSearch?: boolean;
  userPromise: Promise<CurrentUser | null>;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchPanelSettled, setSearchPanelSettled] = useState(false);
  const [mounted] = useState(() => typeof document !== "undefined");
  const { mode, setMode, heroSearchRef, navbarRef } = useSearchMode();
  const authModal = useOverlayState();

  useEffect(() => {
    if (alwaysShowSearch) return;
    const heroSearch = heroSearchRef.current;
    if (!heroSearch) return;

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { rootMargin: `-${navbarRef.current?.offsetHeight ?? 0}px 0px 0px 0px` }
    );
    observer.observe(heroSearch);
    return () => observer.disconnect();
  }, [alwaysShowSearch, heroSearchRef, navbarRef]);

  function closeSearch() {
    setSearchOpen(false);
    setSearchPanelSettled(false);
  }

  useEffect(() => {
    if (!searchOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeSearch();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [searchOpen]);

  const tabs = (
    <>
      {SEARCH_MODES.map((tab) => {
        const Icon = TAB_ICONS[tab.value];
        const active = tab.value === mode;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => setMode(tab.value)}
            aria-current={active ? "true" : undefined}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted hover:border-separator hover:text-foreground"
            }`}
          >
            <Icon size={22} />
            {tab.label}
          </button>
        );
      })}
    </>
  );

  return (
    <header ref={navbarRef} className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto grid h-18 w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight"
          onClick={() => setOpen(false)}
        >
          <LogoMark />
          <span className="hidden sm:inline">Delfos</span>
        </Link>

        <div className="hidden min-w-0 items-center justify-center md:flex">
          {alwaysShowSearch ? (
            searchOpen ? (
              <nav className="flex items-center gap-1">{tabs}</nav>
            ) : (
              <MiniSearchTrigger
                onOpenAction={() => {
                  setSearchPanelSettled(false);
                  setSearchOpen(true);
                }}
              />
            )
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {scrolled ? (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex w-full justify-center"
                >
                  <PropertySearch compact />
                </motion.div>
              ) : (
                <motion.nav
                  key="tabs"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex items-center gap-1"
                >
                  {tabs}
                </motion.nav>
              )}
            </AnimatePresence>
          )}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Suspense fallback={<AccountSkeleton />}>
            <AccountActions userPromise={userPromise} onLogin={authModal.open} />
          </Suspense>
        </div>

        <div className="col-start-3 flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onPress={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </Button>
        </div>
      </div>

      {/* Search takeover: shares this header's background, so it reads as one continuous panel. */}
      <AnimatePresence>
        {alwaysShowSearch && searchOpen ? (
          <motion.div
            key="search-takeover"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            onAnimationComplete={() => setSearchPanelSettled(true)}
            className={`hidden border-t border-separator md:block ${
              searchPanelSettled ? "" : "overflow-hidden"
            }`}
          >
            <div className="mx-auto flex w-full max-w-6xl justify-center px-4 py-6 sm:px-6">
              <div className="w-full max-w-3xl">
                <PropertySearch onSearchAction={() => closeSearch()} />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="border-t border-separator px-4 py-2 md:hidden">
        <nav className="flex items-center justify-center gap-1">
          {SEARCH_MODES.map((tab) => {
            const Icon = TAB_ICONS[tab.value];
            const active = tab.value === mode;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setMode(tab.value)}
                aria-current={active ? "true" : undefined}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-surface-secondary text-foreground"
                    : "text-muted hover:bg-surface-secondary hover:text-foreground"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-separator px-4 py-3 md:hidden">
        <MobileLocationButton />
      </div>

      {open ? (
        <div className="border-t border-separator bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            <Suspense fallback={<AccountSkeleton fullWidth />}>
              <AccountActions
                userPromise={userPromise}
                fullWidth
                onLogin={() => {
                  setOpen(false);
                  authModal.open();
                }}
                onNavigate={() => setOpen(false)}
              />
            </Suspense>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className={buttonVariants({
                variant: "primary",
                size: "sm",
                fullWidth: true,
              })}
            >
              Publicar propiedad
            </Link>
          </div>
        </div>
      ) : null}

      {mounted && alwaysShowSearch
        ? createPortal(
            <AnimatePresence>
              {searchOpen ? (
                <motion.div
                  key="search-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => closeSearch()}
                  className="fixed inset-0 z-40 bg-white/70 backdrop-blur-md"
                />
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}

      <AuthModal state={authModal} />
    </header>
  );
}
