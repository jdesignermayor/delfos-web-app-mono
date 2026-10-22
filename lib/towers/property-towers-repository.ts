import "server-only";

import { createAdminClient } from "@/supabase/admin";

/**
 * `tower_statuses` reads and `property_towers` writes for the dashboard. Uses the service-role
 * client (RLS only allows public reads), so callers must check permissions first.
 */

/** Ids of every `tower_statuses` row. */
export async function listTowerStatusIds(): Promise<Set<string>> {
  const { data, error } = await createAdminClient().from("tower_statuses").select("id");
  if (error) throw error;
  return new Set(data.map((status) => status.id));
}

/**
 * Makes the property's `property_towers` rows exactly `statusIds` (index 0 = tower 1): upserts
 * one row per tower and deletes the rows of towers past the new count.
 */
export async function replacePropertyTowers(propertyId: number, statusIds: string[]): Promise<void> {
  const admin = createAdminClient();

  const { error: deleteError } = await admin
    .from("property_towers")
    .delete()
    .eq("property_id", propertyId)
    .gt("tower_number", statusIds.length);
  if (deleteError) throw deleteError;
  if (statusIds.length === 0) return;

  const updatedAt = new Date().toISOString();
  const { error } = await admin.from("property_towers").upsert(
    statusIds.map((statusId, index) => ({
      property_id: propertyId,
      tower_number: index + 1,
      status_id: statusId,
      updated_at: updatedAt,
    })),
    { onConflict: "property_id,tower_number" },
  );
  if (error) throw error;
}
