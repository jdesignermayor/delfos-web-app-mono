import type { ComponentType, SVGProps } from "react";

import { BuildingIcon, GridIcon, UsersIcon } from "@/components/icons";
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
        { label: "Dashboard", href: "/dashboard", icon: GridIcon },
        { label: "Properties management", href: "/dashboard/properties", icon: BuildingIcon },
        { label: "User management", href: "/dashboard/users", icon: UsersIcon },
      ],
    },
    {
      title: "Configuration",
      items: [
        { label: "Constructoras", href: "/dashboard/constructoras", icon: BuildingIcon },
        { label: "Fiducias", href: "/dashboard/fiducias", icon: UsersIcon },
        { label: "Bancos", href: "/dashboard/bancos", icon: GridIcon },
        { label: "Zonas comunes", href: "/dashboard/zonas-comunes", icon: BuildingIcon },
      ],
    },
  ],
};

/** Sidebar sections available to a given role — empty for roles with no dashboard access. */
export function getNavSections(role: RoleName | null): NavSection[] {
  return (role && NAV_BY_ROLE[role]) || [];
}
