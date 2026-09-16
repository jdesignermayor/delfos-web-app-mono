"use server";

import { createAdminClient } from "@/supabase/admin";

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

export async function createEntity(type: string, data: Entity) {
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

    const { data: result, error } = await supabase
      .from(type)
      .insert([insertData])
      .select();

    if (error) throw error;
    return { success: true, data: result?.[0] };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getEntities(type: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from(type)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: String(error), data: [] };
  }
}

export async function getEntity(type: string, id: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from(type)
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error), data: null };
  }
}

export async function updateEntity(type: string, id: string, data: Partial<Entity>) {
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
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) throw error;
    return { success: true, data: result?.[0] };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deleteEntity(type: string, id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from(type).delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
