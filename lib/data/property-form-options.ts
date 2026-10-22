import { developerScope, type DashboardUser } from "@/lib/auth/permissions";
import { createClient } from "@/supabase/server";

export type Option<Id> = { id: Id; name: string };

/** A row of `tower_statuses`, for the "Estado de la torre" select. */
export type TowerStatusOption = Option<string> & { isDefault: boolean };

export type PropertyFormOptions = {
  developers: Option<number>[];
  realEstateAgencies: Option<string>[];
  trustCompanies: Option<string>[];
  commonAreas: Option<string>[];
  /** "Estado de la torre" choices, in catalog order. */
  towerStatuses: TowerStatusOption[];
  /** Set for constructora admins: the "Constructora" field is fixed to their own. */
  lockedDeveloper: Option<number> | null;
};

/**
 * Select options for the property form. Constructora admins see the shared
 * fiducias catalog plus the fiducias their constructora created.
 */
export async function getPropertyFormOptions(user: DashboardUser): Promise<PropertyFormOptions> {
  const supabase = await createClient();
  const developerId = developerScope(user);

  let trustCompaniesQuery = supabase.from("trust_companies").select("id, name").order("name");
  if (developerId !== null) {
    trustCompaniesQuery = trustCompaniesQuery.or(`developer_id.is.null,developer_id.eq.${developerId}`);
  }

  const [developers, realEstateAgencies, trustCompanies, commonAreas, towerStatuses] = await Promise.all([
    supabase.from("developers").select("id, name").order("name"),
    supabase.from("real_estate_agencies").select("id, name").order("name"),
    trustCompaniesQuery,
    supabase.from("common_areas").select("id, name").order("name"),
    supabase.from("tower_statuses").select("id, name, is_default").order("sort_order"),
  ]);

  return {
    developers: developers.data ?? [],
    realEstateAgencies: realEstateAgencies.data ?? [],
    trustCompanies: trustCompanies.data ?? [],
    commonAreas: commonAreas.data ?? [],
    towerStatuses: (towerStatuses.data ?? []).map(({ id, name, is_default }) => ({ id, name, isDefault: is_default })),
    lockedDeveloper: user.developer ? { id: user.developer.id, name: user.developer.name } : null,
  };
}
