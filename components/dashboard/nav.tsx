import type { ComponentType } from "react";
import { Building2, HardHat, Landmark, LayoutDashboard, ShieldCheck, Trees, Users } from "lucide-react";

import type { RoleName } from "@/supabase/roles";

export type NavItem = {
  label: string;
  href: string;
  /** Each item has its own icon: on phones the sidebar shows only icons. */
  icon: ComponentType<{ className?: string }>;
  badge?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_BY_ROLE: Partial<Record<RoleName, NavSection[]>> = {
  superadmin: [
    {
      title: "Overview",
      items: [
        { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
        { label: "Administrar propiedades", href: "/dashboard/properties", icon: Building2 },
        { label: "Administrar usuarios", href: "/dashboard/users", icon: Users },
      ],
    },
    {
      title: "Configuration",
      items: [
        { label: "Constructoras", href: "/dashboard/constructoras", icon: HardHat },
        { label: "Fiducias", href: "/dashboard/fiducias", icon: ShieldCheck },
        { label: "Bancos", href: "/dashboard/bancos", icon: Landmark },
        { label: "Zonas comunes", href: "/dashboard/zonas-comunes", icon: Trees },
      ],
    },
  ],
  // Constructora users: only their own properties and fiducias.
  admin: [
    {
      title: "Overview",
      items: [
        { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
        { label: "Mis propiedades", href: "/dashboard/properties", icon: Building2 },
      ],
    },
    {
      title: "Configuration",
      items: [{ label: "Fiducias", href: "/dashboard/fiducias", icon: ShieldCheck }],
    },
  ],
  // Self-registered visitors: just their home (saved properties). The profile stays in the sidebar footer.
  viewer: [
    {
      title: "Overview",
      items: [{ label: "Inicio", href: "/dashboard", icon: LayoutDashboard }],
    },
  ],
};

/** Sidebar sections available to a given role — empty for roles with no dashboard access. */
export function getNavSections(role: RoleName | null): NavSection[] {
  return (role && NAV_BY_ROLE[role]) || [];
}
