"use client";

import { useEffect, useRef, useState, useTransition, type RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Button } from "@heroui/react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";

import { signOutAccount } from "@/app/actions/auth";
import { LogoMark } from "@/components/icons";
import { getNavSections, type NavItem, type NavSection } from "@/components/dashboard/nav";
import { initials } from "@/lib/initials";
import type { CurrentUser } from "@/supabase/roles";

const PROFILE_HREF = "/dashboard/profile";

/** Keyboard focus ring shared by every custom control in the menu (HeroUI buttons bring their own). */
const FOCUS_RING = "outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

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
          <p className={`pb-2 text-xs font-medium uppercase tracking-wider text-muted ${large ? "px-4" : "px-3"}`}>
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
                    // The left rail marks the current page by shape too, not only by color.
                    className={`relative flex items-center transition-colors duration-150 ${FOCUS_RING} ${
                      large ? "min-h-13 gap-4 rounded-2xl px-4 text-base" : "min-h-10 gap-3 rounded-lg px-3 py-2 text-sm"
                    } ${
                      active
                        ? "bg-accent-soft font-semibold text-accent before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-accent"
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
        className={`flex items-center transition-colors duration-150 ${FOCUS_RING} ${large ? "min-h-14 gap-3 rounded-2xl px-3" : "gap-3 rounded-lg px-2 py-1.5"} ${
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
      className={`flex h-16 shrink-0 items-center gap-2 border-b border-separator px-5 font-semibold tracking-tight ${FOCUS_RING} focus-visible:ring-inset`}
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

/**
 * Modal behavior for the open drawer: locks the page behind it, moves focus inside, keeps Tab
 * cycling within it, closes on Escape, and hands focus back to the menu button on close.
 */
function useDrawerLock(
  open: boolean,
  // The state setter (stable identity), so the effect only re-runs when the drawer opens or closes.
  setOpen: (open: boolean) => void,
  panelRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const trigger = triggerRef.current;
    const focusables = () =>
      Array.from(panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
    focusables()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") return setOpen(false);
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open, setOpen, panelRef, triggerRef]);
}

/** Header icon buttons on phones: 48px targets with hover, press and keyboard focus states. */
const ICON_BUTTON = `flex size-12 shrink-0 items-center justify-center rounded-2xl text-foreground transition-colors duration-150 hover:bg-surface-secondary active:bg-surface-secondary ${FOCUS_RING}`;

/**
 * Phones: a sticky top bar (menu button, current section, avatar) that leaves the whole width to
 * the page, and a slide-in menu with large, thumb-friendly rows. Hidden from `md` up.
 */
export function MobileNav({ user }: { user: CurrentUser }) {
  const sections = getNavSections(user.role);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useDrawerLock(open, setOpen, panelRef, triggerRef);

  const title = pathname.startsWith(PROFILE_HREF) ? "Mi perfil" : (currentItem(sections, pathname)?.label ?? "Delfos");

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-separator bg-surface/95 px-2 backdrop-blur-xl md:hidden">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-controls="dashboard-mobile-menu"
          className={ICON_BUTTON}
        >
          <Menu className="size-6" />
        </button>
        <Link href="/dashboard" aria-label="Inicio del dashboard" className={`shrink-0 rounded-lg ${FOCUS_RING}`}>
          <LogoMark />
        </Link>
        <p className="min-w-0 flex-1 truncate px-1 text-base font-semibold">{title}</p>
        <Link href={PROFILE_HREF} aria-label="Mi perfil" className={ICON_BUTTON}>
          <UserAvatar user={user} />
        </Link>
      </header>

      {/* Rendered in place (not in the header, whose blur would trap a fixed panel).
          `reducedMotion="user"`: with reduced motion on, the drawer fades instead of sliding. */}
      <MotionConfig reducedMotion="user">
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
                    ref={panelRef}
                    id="dashboard-mobile-menu"
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
                      <Link href="/dashboard" onClick={close} className={`flex items-center gap-2 rounded-lg font-semibold tracking-tight ${FOCUS_RING}`}>
                        <LogoMark />
                        <span className="text-lg">Delfos</span>
                      </Link>
                      <button type="button" onClick={close} aria-label="Cerrar menú" className={ICON_BUTTON}>
                        <X className="size-6" />
                      </button>
                    </div>
                    <NavLinks sections={sections} large onNavigate={close} />
                    <SidebarUser user={user} large onNavigate={close} />
                  </motion.aside>
                </div>
              ) : null}
      </AnimatePresence>
      </MotionConfig>
    </>
  );
}
