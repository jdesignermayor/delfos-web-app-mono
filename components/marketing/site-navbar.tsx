"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Button, buttonVariants, useOverlayState } from "@heroui/react";

import { CloseIcon, LogoMark, MenuIcon } from "@/components/icons";
import { HomeIcon } from "@/components/icons/animated/home";
import { KeyIcon } from "@/components/icons/animated/key";
import { MapPinHouseIcon } from "@/components/icons/animated/map-pin-house";
import { AuthModal } from "@/components/marketing/auth-modal";
import { MobileLocationButton } from "@/components/marketing/mobile-location-button";
import { PropertySearch } from "@/components/marketing/property-search";
import { SEARCH_MODES, useSearchMode } from "@/components/marketing/search-mode-context";

const TAB_ICONS = {
  comprar: HomeIcon,
  arrendar: KeyIcon,
  proyecto: MapPinHouseIcon,
} as const;

export function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { mode, setMode, heroSearchRef, navbarRef } = useSearchMode();
  const authModal = useOverlayState();

  useEffect(() => {
    const heroSearch = heroSearchRef.current;
    if (!heroSearch) return;

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { rootMargin: `-${navbarRef.current?.offsetHeight ?? 0}px 0px 0px 0px` }
    );
    observer.observe(heroSearch);
    return () => observer.disconnect();
  }, [heroSearchRef, navbarRef]);

  return (
    <header ref={navbarRef} className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl">
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
              </motion.nav>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" onPress={authModal.open}>
            Ingresar
          </Button>
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
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onPress={() => {
                setOpen(false);
                authModal.open();
              }}
            >
              Ingresar
            </Button>
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

      <AuthModal state={authModal} />
    </header>
  );
}
