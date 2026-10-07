import { developerScope, type DashboardUser } from "@/lib/auth/permissions";
import { createClient } from "@/supabase/server";

export type Option<Id> = { id: Id; name: string };

export type PropertyFormOptions = {
  developers: Option<number>[];
  realEstateAgencies: Option<string>[];
  trustCompanies: Option<string>[];
  commonAreas: Option<string>[];
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

  const [developers, realEstateAgencies, trustCompanies, commonAreas] = await Promise.all([
    supabase.from("developers").select("id, name").order("name"),
    supabase.from("real_estate_agencies").select("id, name").order("name"),
    trustCompaniesQuery,
    supabase.from("common_areas").select("id, name").order("name"),
  ]);

  return {
    developers: developers.data ?? [],
    realEstateAgencies: realEstateAgencies.data ?? [],
    trustCompanies: trustCompanies.data ?? [],
    commonAreas: commonAreas.data ?? [],
    lockedDeveloper: user.developer ? { id: user.developer.id, name: user.developer.name } : null,
  };
}
