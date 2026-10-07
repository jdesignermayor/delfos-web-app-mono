"use server";

import { getDashboardUser } from "@/lib/auth/dal";
import {
  canAccessEntity,
  developerScope,
  type DashboardUser,
  type EntityAction,
} from "@/lib/auth/permissions";
import { createAdminClient } from "@/supabase/admin";

export type EntityType =
  | "developers"
  | "real_estate_agencies"
  | "trust_companies"
  | "banks"
  | "common_areas";

export type Entity = {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  nit?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
};

const UNAUTHORIZED = "No tienes permiso para realizar esta acción.";

/**
 * The current user, if they may perform `action` on `type`. Constructora
 * admins read the shared catalog plus their own rows and can add new ones;
 * editing and deleting is reserved to superadmins.
 */
async function authorize(type: EntityType, action: EntityAction): Promise<DashboardUser | null> {
  const user = await getDashboardUser();
  return user && canAccessEntity(user, type, action) ? user : null;
}

export async function createEntity(type: EntityType, data: Entity) {
  const user = await authorize(type, "create");
  if (!user) return { success: false, error: UNAUTHORIZED };

  try {
    const supabase = createAdminClient();
    const insertData: Record<string, unknown> = {
      name: data.name,
    };

    if (data.email) insertData.email = data.email;
    if (data.phone) insertData.phone = data.phone;
    if (data.address) insertData.address = data.address;
    if (data.nit) insertData.nit = data.nit;
    if (data.description) insertData.description = data.description;

    const ownerId = developerScope(user);
    if (ownerId !== null) insertData.developer_id = ownerId;

    const { data: result, error } = await supabase
      .from(type)
      .insert([insertData] as never)
      .select();

    if (error) throw error;
    return { success: true, data: result?.[0] };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/** Lists a catalog; constructora admins see the shared rows plus their own. */
export async function getEntities(type: EntityType) {
  const user = await authorize(type, "read");
  if (!user) return { success: false, error: UNAUTHORIZED, data: [] };

  try {
    const supabase = createAdminClient();
    let query = supabase.from(type).select("*").order("created_at", { ascending: false });

    const ownerId = developerScope(user);
    if (ownerId !== null) query = query.or(`developer_id.is.null,developer_id.eq.${ownerId}`);

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: String(error), data: [] };
  }
}

export async function getEntity(type: EntityType, id: string) {
  const user = await authorize(type, "read");
  if (!user) return { success: false, error: UNAUTHORIZED, data: null };

  try {
    const supabase = createAdminClient();
    let query = supabase.from(type).select("*").eq("id", id);

    const ownerId = developerScope(user);
    if (ownerId !== null) query = query.eq("developer_id" as never, ownerId as never);

    const { data, error } = await query.single();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error), data: null };
  }
}

/** Superadmin only. */
export async function updateEntity(type: EntityType, id: string, data: Partial<Entity>) {
  if (!(await authorize(type, "modify"))) return { success: false, error: UNAUTHORIZED };

  try {
    const supabase = createAdminClient();
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.nit !== undefined) updateData.nit = data.nit;
    if (data.description !== undefined) updateData.description = data.description;

    const { data: result, error } = await supabase
      .from(type)
      .update(updateData as never)
      .eq("id", id)
      .select();

    if (error) throw error;
    return { success: true, data: result?.[0] };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/** Superadmin only. */
export async function deleteEntity(type: EntityType, id: string) {
  if (!(await authorize(type, "modify"))) return { success: false, error: UNAUTHORIZED };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from(type).delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
