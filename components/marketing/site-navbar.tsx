"use client";

import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button, buttonVariants, useOverlayState } from "@heroui/react";

import { CloseIcon, LogoMark, MenuIcon } from "@/components/icons";
import { AccountActions, AccountSkeleton } from "@/components/marketing/account-actions";
import { AuthModal } from "@/components/marketing/auth-modal";
import { MiniSearchTrigger } from "@/components/marketing/mini-search-trigger";
import { MobileTabBar } from "@/components/marketing/mobile-tab-bar";
import { MobileLocationButton } from "@/components/marketing/mobile-location-button";
import { HEADER_SEARCH_MOTION } from "@/components/marketing/motion-presets";
import { PropertySearch } from "@/components/marketing/property-search";
import { useSearchMode } from "@/components/marketing/search-mode-context";
import { SearchModeTabs } from "@/components/marketing/search-mode-tabs";
import { modeSwitchHref } from "@/components/marketing/search-url";
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

/** True once the page has scrolled away from the very top. */
function useScrolledFromTop(enabled: boolean) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const update = () => setScrolled(window.scrollY > 4);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [enabled]);

  return scrolled;
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
 * Header centre on /search, where every filter lives in the bar under the header: just the mode
 * tabs, and picking one re-runs the current search in that mode.
 */
function SearchPageModeTabs({ searchFilters }: { searchFilters?: PropertyFilters }) {
  const router = useRouter();
  return (
    <nav className="flex items-center gap-1">
      <SearchModeTabs
        variant="desktop"
        onSelectAction={(mode) => router.push(modeSwitchHref(mode, searchFilters), { scroll: false })}
      />
    </nav>
  );
}

/**
 * Centre of the desktop header. On the landing it swaps the mode tabs for a compact search once
 * the hero search scrolls away; on pages without a hero (`alwaysShowSearch`) it shows a mini
 * trigger that opens the full search takeover.
 */
/**
 * Landing header, quiet brutalism: the hero's pastel Delfos blue, ink type, square corners.
 * The navbar's one primary action: a flat ink block.
 */
const BRUTAL_NAV_CTA =
  "flex h-10 items-center justify-center gap-2 bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink/85 outline-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink";

/** Phone menu (a white panel under the bar): the same action as a full-width ink block. */
const MOBILE_MENU_CTA =
  "flex h-12 w-full items-center justify-center gap-2 bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink/85 outline-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink";

function DesktopHeaderCenter({
  alwaysShowSearch,
  takeoverOpen,
  onOpenTakeover,
  brutal = false,
}: {
  alwaysShowSearch: boolean;
  takeoverOpen: boolean;
  onOpenTakeover: () => void;
  brutal?: boolean;
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

  // Landing: the centre stays empty (the mode tabs live in the hero, above its search) until the
  // hero search scrolls away; then the compact search takes over.
  return (
    <AnimatePresence initial={false}>
      {heroScrolledPast ? (
        <motion.div key="search" {...HEADER_SEARCH_MOTION} className="flex w-full justify-center">
          <PropertySearch compact brutal={brutal} />
        </motion.div>
      ) : null}
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
  brutal = false,
}: {
  userPromise: Promise<CurrentUser | null>;
  onLogin: () => void;
  onClose: () => void;
  brutal?: boolean;
}) {
  return (
    <div
      className={`px-4 py-4 md:hidden ${brutal ? "border-t-[1.5px] border-ink bg-white" : "border-t border-separator bg-background"}`}
    >
      <div className={`flex flex-col ${brutal ? "gap-3" : "gap-2"}`}>
        <Suspense fallback={<AccountSkeleton fullWidth />}>
          <AccountActions userPromise={userPromise} fullWidth onLogin={onLogin} onNavigate={onClose} brutal={brutal} />
        </Suspense>
        <Link
          href="/dashboard"
          onClick={onClose}
          className={brutal ? MOBILE_MENU_CTA : buttonVariants({ variant: "primary", size: "sm", fullWidth: true })}
        >
          Publicar propiedad
        </Link>
      </div>
    </div>
  );
}

export function SiteNavbar({
  alwaysShowSearch = false,
  searchInPage = false,
  searchFilters,
  userPromise,
  tone = "default",
}: {
  /**
   * "landing": the header takes the hero's pastel Delfos blue (no blur, no hairline) so the two
   * read as one block, and its pieces settle in with the hero's intro; a faint white rule appears
   * under it once the page scrolls.
   */
  tone?: "default" | "landing";
  alwaysShowSearch?: boolean;
  /**
   * /search: the page's own filter bar holds every filter, so the header has no search box,
   * only the Comprar / Arrendar / Proyectos nuevos tabs.
   */
  searchInPage?: boolean;
  /** The current search (on /search), so reopening the search bar keeps it instead of starting blank. */
  searchFilters?: PropertyFilters;
  userPromise: Promise<CurrentUser | null>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { navbarRef } = useSearchMode();
  const authModal = useOverlayState();
  const takeover = useSearchTakeover();
  const isLanding = tone === "landing";
  const scrolled = useScrolledFromTop(isLanding);

  const closeMenu = () => setMenuOpen(false);

  function loginFromMenu() {
    closeMenu();
    authModal.open();
  }

  return (
    <>
      <header
        ref={navbarRef}
        className={
          isLanding
            ? // The border is always there (only its color changes), so nothing shifts when it appears.
              `sticky top-0 z-50 border-b-[1.5px] bg-delfos-pastel text-ink transition-colors duration-200 ${
                scrolled ? "border-ink" : "border-transparent"
              }`
            : "sticky top-0 z-50 bg-white/95 backdrop-blur-xl"
        }
      >
        <div className="mx-auto grid h-18 w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className={
              isLanding
                ? "nav-drop flex items-center gap-2 font-display text-lg font-bold tracking-tight text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                : "flex items-center gap-2 font-display text-lg font-semibold tracking-tight"
            }
            onClick={closeMenu}
          >
            <LogoMark />
            <span className="hidden sm:inline">Delfos</span>
          </Link>

          {/* Phones: the search sits right in the middle of the bar, between the logo and the menu. */}
          <div className="min-w-0 md:hidden">{searchInPage ? null : <MobileLocationButton brutal={isLanding} />}</div>

          <div className="hidden min-w-0 items-center justify-center md:flex">
            {searchInPage ? (
              <SearchPageModeTabs searchFilters={searchFilters} />
            ) : (
              <DesktopHeaderCenter
                alwaysShowSearch={alwaysShowSearch}
                takeoverOpen={takeover.isOpen}
                onOpenTakeover={takeover.open}
                brutal={isLanding}
              />
            )}
          </div>

          <div
            className={`hidden items-center md:flex ${isLanding ? "nav-drop gap-3" : "gap-2"}`}
            style={isLanding ? ({ "--drop-delay": "120ms" } as React.CSSProperties) : undefined}
          >
            <Suspense fallback={<AccountSkeleton />}>
              <AccountActions userPromise={userPromise} onLogin={authModal.open} brutal={isLanding} />
            </Suspense>
            {/* Landing: a persistent primary action in the bar (the same link as in the phone menu). */}
            {isLanding ? (
              <Link href="/dashboard" className={`${BRUTAL_NAV_CTA} hidden lg:flex`}>
                Publicar propiedad
              </Link>
            ) : null}
          </div>

          <div className="col-start-3 flex items-center gap-2 md:hidden">
            {isLanding ? (
              <button
                type="button"
                aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((isOpen) => !isOpen)}
                className="flex size-11 items-center justify-center text-ink transition-colors active:bg-delfos-sky outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {menuOpen ? <CloseIcon strokeWidth={2.25} /> : <MenuIcon strokeWidth={2.25} />}
              </button>
            ) : (
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
            )}
          </div>
        </div>

        {alwaysShowSearch && !searchInPage ? <SearchTakeoverPanel takeover={takeover} searchFilters={searchFilters} /> : null}

        {menuOpen ? (
          <MobileMenu userPromise={userPromise} onLogin={loginFromMenu} onClose={closeMenu} brutal={isLanding} />
        ) : null}

        {alwaysShowSearch && !searchInPage ? <SearchTakeoverBackdrop isOpen={takeover.isOpen} onClose={takeover.close} /> : null}

        <AuthModal state={authModal} />
      </header>

      {/* Outside the header: its backdrop-blur would make it the containing block of this fixed bar. */}
      <MobileTabBar
        userPromise={userPromise}
        onLoginAction={authModal.open}
        onOpenAccountAction={() => setMenuOpen(true)}
        brutal={isLanding}
      />
    </>
  );
}
