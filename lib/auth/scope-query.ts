import { developerScope, type DashboardUser } from "@/lib/auth/permissions";

/** Any Supabase query builder over a table with a `developer_id` column. */
type DeveloperFilterable<Q> = { eq(column: "developer_id", value: number): Q };

/**
 * Limits a query to the user's constructora. Superadmins get the query back
 * unchanged; constructora admins only see rows of their own `developer_id`.
 */
export function scopeToDeveloper<Q extends DeveloperFilterable<Q>>(query: Q, user: DashboardUser): Q {
  const developerId = developerScope(user);
  return developerId === null ? query : query.eq("developer_id", developerId);
}
