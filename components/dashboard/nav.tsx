import type { ComponentType, SVGProps } from "react";

import { BuildingIcon, GridIcon, ShieldIcon, UsersIcon } from "@/components/icons";
import type { RoleName } from "@/supabase/roles";

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
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
        { label: "Inicio", href: "/dashboard", icon: GridIcon },
        { label: "Administrar propiedades", href: "/dashboard/properties", icon: BuildingIcon },
        { label: "Administrar usuarios", href: "/dashboard/users", icon: UsersIcon },
      ],
    },
    {
      title: "Configuration",
      items: [
        { label: "Constructoras", href: "/dashboard/constructoras", icon: BuildingIcon },
        { label: "Fiducias", href: "/dashboard/fiducias", icon: ShieldIcon },
        { label: "Bancos", href: "/dashboard/bancos", icon: GridIcon },
        { label: "Zonas comunes", href: "/dashboard/zonas-comunes", icon: BuildingIcon },
      ],
    },
  ],
  // Constructora users: only their own properties and fiducias.
  admin: [
    {
      title: "Overview",
      items: [
        { label: "Inicio", href: "/dashboard", icon: GridIcon },
        { label: "Mis propiedades", href: "/dashboard/properties", icon: BuildingIcon },
      ],
    },
    {
      title: "Configuration",
      items: [{ label: "Fiducias", href: "/dashboard/fiducias", icon: ShieldIcon }],
    },
  ],
};

/** Sidebar sections available to a given role — empty for roles with no dashboard access. */
export function getNavSections(role: RoleName | null): NavSection[] {
  return (role && NAV_BY_ROLE[role]) || [];
}
