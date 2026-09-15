"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Button } from "@heroui/react";

import { signOutAccount } from "@/app/actions/auth";
import { LogoMark } from "@/components/icons";
import { getNavSections, type NavSection } from "@/components/dashboard/nav";
import type { CurrentUser } from "@/supabase/roles";

function NavLinks({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted">
            {section.title}
          </p>
          <ul className="flex flex-col gap-1">
            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-accent-soft font-medium text-accent"
                        : "text-muted hover:bg-surface-secondary hover:text-foreground"
                    }`}
                  >
                    <item.icon className="size-[18px] shrink-0" />
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

function initials(name: string | null, email: string | null) {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

/** Avatar, name and sign-out control shown at the bottom of the sidebar, for every role. */
function SidebarUser({ user }: { user: CurrentUser }) {
  const [isPending, startTransition] = useTransition();
  const displayName = user.name || user.email || "Usuario";

  return (
    <div className="border-t border-separator p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
        <Avatar size="sm">
          <Avatar.Fallback color="accent">{initials(user.name, user.email)}</Avatar.Fallback>
        </Avatar>
        <span className="flex-1 truncate text-sm font-medium">{displayName}</span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        fullWidth
        className="mt-2"
        isDisabled={isPending}
        onPress={() => startTransition(async () => { await signOutAccount(); })}
      >
        {isPending ? "Saliendo…" : "Cerrar sesión"}
      </Button>
    </div>
  );
}

/** Persistent sidebar — the only dashboard navigation surface. */
export function Sidebar({ user }: { user: CurrentUser }) {
  const sections = getNavSections(user.role);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-separator bg-surface">
      <SidebarBrand />
      <NavLinks sections={sections} />
      <SidebarUser user={user} />
    </aside>
  );
}
