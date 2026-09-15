"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants, useOverlayState } from "@heroui/react";

import { CloseIcon, HomeIcon, KeyIcon, LogoMark, MenuIcon, TagIcon } from "@/components/icons";
import { AuthModal } from "@/components/marketing/auth-modal";
import { SEARCH_MODES, useSearchMode } from "@/components/marketing/search-mode-context";

const TAB_ICONS = {
  comprar: HomeIcon,
  arrendar: KeyIcon,
  proyecto: TagIcon,
} as const;

export function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const { mode, setMode } = useSearchMode();
  const authModal = useOverlayState();

  return (
    <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto grid h-14 w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight"
          onClick={() => setOpen(false)}
        >
          <LogoMark />
          <span className="hidden sm:inline">Delfos</span>
        </Link>

        <nav className="hidden items-center justify-center gap-2 md:flex">
          {SEARCH_MODES.map((tab) => {
            const Icon = TAB_ICONS[tab.value];
            const active = tab.value === mode;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setMode(tab.value)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-surface-secondary text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" onPress={authModal.open}>
            Ingresar
          </Button>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            Publicar propiedad
          </Link>
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

      {open ? (
        <div className="border-t border-separator bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {SEARCH_MODES.map((tab) => {
              const Icon = TAB_ICONS[tab.value];
              const active = tab.value === mode;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setMode(tab.value);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-surface-secondary text-foreground"
                      : "text-muted hover:bg-surface-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                  {tab.label}
                </button>
              );
            })}
            <div className="mt-3 flex flex-col gap-2">
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
          </nav>
        </div>
      ) : null}

      <AuthModal state={authModal} />
    </header>
  );
}
