/**
 * Constructoras (`developers` table): list, read and update.
 * Server-only — uses the service-role client. Callers must check the caller
 * is a superadmin.
 */
import type { DeveloperField, DeveloperInput } from "@/lib/validation/developer";
import { createAdminClient } from "@/supabase/admin";

/** Postgres `unique_violation`. */
const UNIQUE_VIOLATION = "23505";

export type DeveloperRow = {
  id: number;
  name: string;
  nit: string | null;
  phone: string;
  email: string | null;
  address: string;
  description: string | null;
  isEnabled: boolean;
  updatedAt: string | null;
};

/** One row of the constructoras list (`/dashboard/constructoras`). */
export type DeveloperListItem = Pick<DeveloperRow, "id" | "name" | "nit" | "phone" | "email" | "isEnabled">;

export type SaveDeveloperResult =
  | { success: true; developerId: number }
  | { success: false; error: string; field?: DeveloperField };

/** Parses a route segment into a developer id, or `null` when it isn't a positive integer. */
export function parseDeveloperId(value: unknown): number | null {
  const id = typeof value === "number" ? value : Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Every constructora, newest first. Throws when the query fails. */
export async function listDevelopers(): Promise<DeveloperListItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("developers")
    .select("id, name, nit, phone, email, is_enabled")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`No se pudieron cargar las constructoras: ${error.message}`);
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    nit: row.nit,
    phone: row.phone,
    email: row.email,
    isEnabled: row.is_enabled,
  }));
}

export async function getDeveloper(developerId: number): Promise<DeveloperRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("developers")
    .select("id, name, nit, phone, email, address, description, is_enabled, updated_at")
    .eq("id", developerId)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    nit: data.nit,
    phone: data.phone,
    email: data.email,
    address: data.address,
    description: data.description,
    isEnabled: data.is_enabled,
    updatedAt: data.updated_at,
  };
}

export async function updateDeveloper(developerId: number, input: DeveloperInput): Promise<SaveDeveloperResult> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("developers")
    .update({
      name: input.name,
      nit: input.nit,
      phone: input.phone,
      email: input.email,
      address: input.address,
      description: input.description,
      is_enabled: input.isEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", developerId)
    .select("id")
    .maybeSingle();

  if (error) {
    // `nit` is the only unique column besides the id.
    return error.code === UNIQUE_VIOLATION
      ? { success: false, error: "Ya existe una constructora con este NIT.", field: "nit" }
      : { success: false, error: `No se pudo actualizar la constructora: ${error.message}` };
  }
  if (!data) return { success: false, error: "La constructora no existe." };
  return { success: true, developerId: data.id };
}
