"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Button } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";

import { signOutAccount } from "@/app/actions/auth";
import { LogoMark } from "@/components/icons";
import { getNavSections, type NavItem, type NavSection } from "@/components/dashboard/nav";
import { initials } from "@/lib/initials";
import type { CurrentUser } from "@/supabase/roles";

const PROFILE_HREF = "/dashboard/profile";

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

/** The nav item for the current page, for the mobile top bar's title. */
function currentItem(sections: NavSection[], pathname: string): NavItem | undefined {
  // Longest match first, so "/dashboard/properties" wins over "/dashboard".
  return sections
    .flatMap((section) => section.items)
    .filter((item) => isActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

/**
 * The menu's sections. `large` is the phone drawer: taller rows, bigger icons and text, made for
 * thumbs (each row is at least 52px tall).
 */
function NavLinks({ sections, large = false, onNavigate }: { sections: NavSection[]; large?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className={`flex flex-1 flex-col overflow-y-auto ${large ? "gap-7 px-4 py-5" : "gap-6 px-3 py-4"}`}>
      {sections.map((section) => (
        <div key={section.title}>
          <p className={`pb-2 font-medium uppercase tracking-wider text-muted ${large ? "px-4 text-xs" : "px-3 text-xs"}`}>
            {section.title}
          </p>
          <ul className={`flex flex-col ${large ? "gap-1.5" : "gap-1"}`}>
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center transition-colors ${
                      large ? "min-h-13 gap-4 rounded-2xl px-4 text-base" : "gap-3 rounded-lg px-3 py-2 text-sm"
                    } ${
                      active
                        ? "bg-accent-soft font-semibold text-accent"
                        : "text-foreground/80 hover:bg-surface-secondary hover:text-foreground active:bg-surface-secondary"
                    }`}
                  >
                    <item.icon className={`shrink-0 ${large ? "size-6" : "size-[18px]"}`} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-accent px-1.5 py-0.5 text-xs font-semibold text-accent-foreground">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserAvatar({ user, size = "sm" }: { user: CurrentUser; size?: "sm" | "md" }) {
  const displayName = user.name || user.email || "Usuario";
  return (
    <Avatar size={size}>
      {user.avatarUrl ? <Avatar.Image src={user.avatarUrl} alt={displayName} /> : null}
      <Avatar.Fallback color="accent">{initials(user.name, user.email)}</Avatar.Fallback>
    </Avatar>
  );
}

/** Avatar, name (linking to the profile page) and sign-out, at the bottom of the menu, for every role. */
function SidebarUser({ user, large = false, onNavigate }: { user: CurrentUser; large?: boolean; onNavigate?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const displayName = user.name || user.email || "Usuario";
  const active = pathname.startsWith(PROFILE_HREF);

  return (
    <div className={`border-t border-separator ${large ? "p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]" : "p-3"}`}>
      <Link
        href={PROFILE_HREF}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        title="Mi perfil"
        className={`flex items-center transition-colors ${large ? "min-h-14 gap-3 rounded-2xl px-3" : "gap-3 rounded-lg px-2 py-1.5"} ${
          active ? "bg-accent-soft" : "hover:bg-surface-secondary"
        }`}
      >
        <UserAvatar user={user} size={large ? "md" : "sm"} />
        <div className="min-w-0 flex-1">
          <p className={`truncate font-medium ${large ? "text-base" : "text-sm"}`}>{displayName}</p>
          <p className={`truncate text-muted ${large ? "text-sm" : "text-xs"}`}>{user.developer?.name ?? "Mi perfil"}</p>
        </div>
      </Link>
      <Button
        type="button"
        variant="outline"
        size={large ? "lg" : "sm"}
        fullWidth
        className={large ? "mt-3" : "mt-2"}
        isDisabled={isPending}
        onPress={() => startTransition(async () => { await signOutAccount(); })}
      >
        {large ? <LogOut className="size-5" /> : null}
        {isPending ? "Saliendo…" : "Cerrar sesión"}
      </Button>
    </div>
  );
}

function SidebarBrand() {
  return (
    <Link
      href="/dashboard"
      className="flex h-16 items-center gap-2 border-b border-separator px-5 font-semibold tracking-tight"
    >
      <LogoMark />
      <span className="text-lg">Delfos</span>
    </Link>
  );
}

/** Persistent sidebar from `md` up — the desktop dashboard navigation. Phones get `MobileNav`. */
export function Sidebar({ user }: { user: CurrentUser }) {
  const sections = getNavSections(user.role);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-separator bg-surface md:flex">
      <SidebarBrand />
      <NavLinks sections={sections} />
      <SidebarUser user={user} />
    </aside>
  );
}

/** Locks the page behind the open drawer and closes it with Escape. */
function useDrawerLock(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);
}

/**
 * Phones: a sticky top bar (menu button, current section, avatar) that leaves the whole width to
 * the page, and a slide-in menu with large, thumb-friendly rows. Hidden from `md` up.
 */
export function MobileNav({ user }: { user: CurrentUser }) {
  const sections = getNavSections(user.role);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  useDrawerLock(open, close);

  const title = pathname.startsWith(PROFILE_HREF) ? "Mi perfil" : (currentItem(sections, pathname)?.label ?? "Delfos");

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-separator bg-surface/95 px-2 backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-foreground transition-colors active:bg-surface-secondary"
        >
          <Menu className="size-6" />
        </button>
        <Link href="/dashboard" aria-label="Inicio del dashboard" className="shrink-0">
          <LogoMark />
        </Link>
        <p className="min-w-0 flex-1 truncate px-1 text-base font-semibold">{title}</p>
        <Link
          href={PROFILE_HREF}
          aria-label="Mi perfil"
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl active:bg-surface-secondary"
        >
          <UserAvatar user={user} />
        </Link>
      </header>

      {/* Rendered in place (not in the header, whose blur would trap a fixed panel). */}
      <AnimatePresence>
              {open ? (
                <div key="mobile-nav" className="fixed inset-0 z-[60] md:hidden">
                  <motion.button
                    type="button"
                    aria-label="Cerrar menú"
                    onClick={close}
                    className="absolute inset-0 bg-black/40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.aside
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menú"
                    className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-surface shadow-2xl"
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
                  >
                    <div className="flex h-16 shrink-0 items-center justify-between border-b border-separator pl-5 pr-2 pt-[env(safe-area-inset-top)]">
                      <Link href="/dashboard" onClick={close} className="flex items-center gap-2 font-semibold tracking-tight">
                        <LogoMark />
                        <span className="text-lg">Delfos</span>
                      </Link>
                      <button
                        type="button"
                        onClick={close}
                        aria-label="Cerrar menú"
                        className="flex size-12 items-center justify-center rounded-2xl text-foreground active:bg-surface-secondary"
                      >
                        <X className="size-6" />
                      </button>
                    </div>
                    <NavLinks sections={sections} large onNavigate={close} />
                    <SidebarUser user={user} large onNavigate={close} />
                  </motion.aside>
                </div>
              ) : null}
      </AnimatePresence>
    </>
  );
}
