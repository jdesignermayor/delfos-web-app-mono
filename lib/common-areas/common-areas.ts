/**
 * Zonas comunes (`common_areas` table): list, read, update and delete.
 * Server-only — uses the service-role client. Callers must check the caller
 * is a superadmin.
 */
import type { ActionResult } from "@/lib/forms/action-result";
import type { CommonAreaInput } from "@/lib/validation/common-area";
import { parseUuid } from "@/lib/validation/uuid";
import { createAdminClient } from "@/supabase/admin";

export type CommonAreaRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  description: string | null;
  updatedAt: string | null;
};

/** One row of the zonas comunes list (`/dashboard/zonas-comunes`). */
export type CommonAreaListItem = Pick<CommonAreaRow, "id" | "name" | "description" | "phone" | "email">;

export type SaveCommonAreaResult = { success: true; commonAreaId: string } | { success: false; error: string };

/** Parses a route segment into a zona común id (a UUID), or `null` when it isn't one. */
export const parseCommonAreaId = parseUuid;

/** Every zona común, newest first. Throws when the query fails. */
export async function listCommonAreas(): Promise<CommonAreaListItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("common_areas")
    .select("id, name, description, phone, email")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`No se pudieron cargar las zonas comunes: ${error.message}`);
  return data;
}

export async function getCommonArea(commonAreaId: string): Promise<CommonAreaRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("common_areas")
    .select("id, name, phone, email, address, description, updated_at")
    .eq("id", commonAreaId)
    .maybeSingle();

  if (!data) return null;
  const { updated_at: updatedAt, ...row } = data;
  return { ...row, updatedAt };
}

export async function updateCommonArea(commonAreaId: string, input: CommonAreaInput): Promise<SaveCommonAreaResult> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("common_areas")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", commonAreaId)
    .select("id")
    .maybeSingle();

  if (error) return { success: false, error: `No se pudo actualizar la zona común: ${error.message}` };
  if (!data) return { success: false, error: "La zona común no existe." };
  return { success: true, commonAreaId: data.id };
}

/**
 * Deletes a zona común. Properties keep a snapshot of their amenities
 * (`properties.amenities`), so the ones that listed it keep showing it.
 */
export async function deleteCommonArea(commonAreaId: string): Promise<ActionResult> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("common_areas").delete().eq("id", commonAreaId).select("id").maybeSingle();

  if (error) return { success: false, error: `No se pudo eliminar la zona común: ${error.message}` };
  if (!data) return { success: false, error: "La zona común no existe." };
  return { success: true };
}
