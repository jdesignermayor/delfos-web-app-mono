import { cache } from "react";

import { getDashboardUser } from "@/lib/auth/dal";
import { canManageProperty } from "@/lib/auth/permissions";
import { createClient } from "@/supabase/server";

/**
 * A single property (with its developer) for the dashboard detail/edit page —
 * `null` when it doesn't exist or is outside the user's constructora.
 *
 * Memoized per request, so `generateMetadata` and the page share one query.
 */
export const getDashboardProperty = cache(async (id: number) => {
  const user = await getDashboardUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("*, developers!developer_id(id, name, address, phone)")
    .eq("id", id)
    .maybeSingle();

  return data && canManageProperty(user, data.developer_id) ? data : null;
});
