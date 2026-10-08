"use client";

import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button, buttonVariants, useOverlayState } from "@heroui/react";

import { CloseIcon, LogoMark, MenuIcon } from "@/components/icons";
import { AccountActions, AccountSkeleton } from "@/components/marketing/account-actions";
import { AuthModal } from "@/components/marketing/auth-modal";
import { MiniSearchTrigger } from "@/components/marketing/mini-search-trigger";
import { MobileLocationButton } from "@/components/marketing/mobile-location-button";
import { HEADER_SEARCH_MOTION, HEADER_SWAP_MOTION } from "@/components/marketing/motion-presets";
import { PropertySearch } from "@/components/marketing/property-search";
import { useSearchMode } from "@/components/marketing/search-mode-context";
import { SearchModeTabs } from "@/components/marketing/search-mode-tabs";
import type { PropertyFilters } from "@/components/marketing/properties";
import { useDismissableOverlay } from "@/hooks/use-dismissable-overlay";
import type { CurrentUser } from "@/supabase/roles";

const noopSubscribe = () => () => {};

/**
 * False on the server and during hydration, true after: portals need `document`,
 * and reading it in render made server and client disagree.
 */
function useIsMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/** True once the hero's search bar has scrolled under the sticky header. */
function useHeroSearchScrolledPast(enabled: boolean) {
  const { heroSearchRef, navbarRef } = useSearchMode();
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const heroSearch = heroSearchRef.current;
    if (!enabled || !heroSearch) return;

    const observer = new IntersectionObserver(([entry]) => setScrolledPast(!entry.isIntersecting), {
      rootMargin: `-${navbarRef.current?.offsetHeight ?? 0}px 0px 0px 0px`,
    });
    observer.observe(heroSearch);
    return () => observer.disconnect();
  }, [enabled, heroSearchRef, navbarRef]);

  return scrolledPast;
}

/** Open/close state of the /search header takeover, plus whether its expand animation has finished. */
function useSearchTakeover() {
  const [isOpen, setIsOpen] = useState(false);
  // While expanding, the panel clips its content; once settled, dropdowns may overflow it.
  const [isSettled, setIsSettled] = useState(false);

  function open() {
    setIsSettled(false);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setIsSettled(false);
  }

  useDismissableOverlay(isOpen, close);

  return { isOpen, isSettled, open, close, settle: () => setIsSettled(true) };
}

/**
 * Centre of the desktop header. On the landing it swaps the mode tabs for a compact search once
 * the hero search scrolls away; on pages without a hero (`alwaysShowSearch`) it shows a mini
 * trigger that opens the full search takeover.
 */
function DesktopHeaderCenter({
  alwaysShowSearch,
  takeoverOpen,
  onOpenTakeover,
}: {
  alwaysShowSearch: boolean;
  takeoverOpen: boolean;
  onOpenTakeover: () => void;
}) {
  const heroScrolledPast = useHeroSearchScrolledPast(!alwaysShowSearch);

  if (alwaysShowSearch) {
    return takeoverOpen ? (
      <nav className="flex items-center gap-1">
        <SearchModeTabs variant="desktop" />
      </nav>
    ) : (
      <MiniSearchTrigger onOpenAction={onOpenTakeover} />
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {heroScrolledPast ? (
        <motion.div key="search" {...HEADER_SEARCH_MOTION} className="flex w-full justify-center">
          <PropertySearch compact />
        </motion.div>
      ) : (
        <motion.nav key="tabs" {...HEADER_SWAP_MOTION} className="flex items-center gap-1">
          <SearchModeTabs variant="desktop" />
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

/** Full search panel that expands below the header; shares its background so they read as one. */
function SearchTakeoverPanel({
  takeover,
  searchFilters,
}: {
  takeover: ReturnType<typeof useSearchTakeover>;
  searchFilters?: PropertyFilters;
}) {
  return (
    <AnimatePresence>
      {takeover.isOpen ? (
        <motion.div
          key="search-takeover"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          onAnimationComplete={takeover.settle}
          className={`hidden border-t border-separator md:block ${takeover.isSettled ? "" : "overflow-hidden"}`}
        >
          <div className="mx-auto flex w-full max-w-6xl justify-center px-4 py-6 sm:px-6">
            <div className="w-full max-w-3xl">
              <PropertySearch initialFilters={searchFilters} onSearchAction={takeover.close} />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Blurs the page behind the open takeover; clicking it closes the search. */
function SearchTakeoverBackdrop({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const mounted = useIsMounted();
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="search-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-white/70 backdrop-blur-md"
        />
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function MobileMenu({
  userPromise,
  onLogin,
  onClose,
}: {
  userPromise: Promise<CurrentUser | null>;
  onLogin: () => void;
  onClose: () => void;
}) {
  return (
    <div className="border-t border-separator bg-background px-4 py-4 md:hidden">
      <div className="flex flex-col gap-2">
        <Suspense fallback={<AccountSkeleton fullWidth />}>
          <AccountActions userPromise={userPromise} fullWidth onLogin={onLogin} onNavigate={onClose} />
        </Suspense>
        <Link
          href="/dashboard"
          onClick={onClose}
          className={buttonVariants({ variant: "primary", size: "sm", fullWidth: true })}
        >
          Publicar propiedad
        </Link>
      </div>
    </div>
  );
}

export function SiteNavbar({
  alwaysShowSearch = false,
  searchFilters,
  userPromise,
}: {
  alwaysShowSearch?: boolean;
  /** The current search (on /search), so reopening the search bar keeps it instead of starting blank. */
  searchFilters?: PropertyFilters;
  userPromise: Promise<CurrentUser | null>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { navbarRef } = useSearchMode();
  const authModal = useOverlayState();
  const takeover = useSearchTakeover();

  const closeMenu = () => setMenuOpen(false);

  function loginFromMenu() {
    closeMenu();
    authModal.open();
  }

  return (
    <header ref={navbarRef} className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto grid h-18 w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight"
          onClick={closeMenu}
        >
          <LogoMark />
          <span className="hidden sm:inline">Delfos</span>
        </Link>

        <div className="hidden min-w-0 items-center justify-center md:flex">
          <DesktopHeaderCenter
            alwaysShowSearch={alwaysShowSearch}
            takeoverOpen={takeover.isOpen}
            onOpenTakeover={takeover.open}
          />
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
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            onPress={() => setMenuOpen((isOpen) => !isOpen)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </Button>
        </div>
      </div>

      {alwaysShowSearch ? <SearchTakeoverPanel takeover={takeover} searchFilters={searchFilters} /> : null}

      <div className="border-t border-separator px-4 py-2 md:hidden">
        <nav className="flex items-center justify-center gap-1">
          <SearchModeTabs variant="mobile" />
        </nav>
      </div>

      <div className="border-t border-separator px-4 py-3 md:hidden">
        <MobileLocationButton />
      </div>

      {menuOpen ? <MobileMenu userPromise={userPromise} onLogin={loginFromMenu} onClose={closeMenu} /> : null}

      {alwaysShowSearch ? <SearchTakeoverBackdrop isOpen={takeover.isOpen} onClose={takeover.close} /> : null}

      <AuthModal state={authModal} />
    </header>
  );
}
