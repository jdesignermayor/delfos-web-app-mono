/**
 * Constructoras (`developers` table): list, read, update, delete and restore.
 * Server-only — uses the service-role client. Callers must check the caller
 * is a superadmin.
 */
import { PG_ERROR } from "@/lib/db-errors";
import type { ActionResult } from "@/lib/forms/action-result";
import type { DeletedRecord, ParsedDeletedRecord } from "@/lib/forms/deleted-record";
import { toCompanyFormValues } from "@/lib/validation/company";
import type { DeveloperField, DeveloperFormValues, DeveloperInput } from "@/lib/validation/developer";
import { createAdminClient } from "@/supabase/admin";


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

/** A deleted constructora, kept by the client so "Deshacer" can restore it. */
export type DeveloperSnapshot = DeletedRecord<number, DeveloperFormValues>;

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
    return error.code === PG_ERROR.uniqueViolation
      ? { success: false, error: "Ya existe una constructora con este NIT.", field: "nit" }
      : { success: false, error: `No se pudo actualizar la constructora: ${error.message}` };
  }
  if (!data) return { success: false, error: "La constructora no existe." };
  return { success: true, developerId: data.id };
}

/** What still points at a constructora, by label — any of these blocks deleting it. */
async function countDeveloperDependents(developerId: number): Promise<{ label: string; count: number }[]> {
  const admin = createAdminClient();
  const count = { count: "exact", head: true } as const;
  const [users, projects, properties, trustCompanies] = await Promise.all([
    admin.from("users").select("id", count).eq("developer_id", developerId),
    admin.from("projects").select("id", count).eq("developer_id", developerId),
    admin
      .from("properties")
      .select("id", count)
      .or(`developer_id.eq.${developerId},builder_id.eq.${developerId},seller_id.eq.${developerId}`),
    admin.from("trust_companies").select("id", count).eq("developer_id", developerId),
  ]);

  return [
    { label: "usuarios", count: users.count ?? 0 },
    { label: "proyectos", count: projects.count ?? 0 },
    { label: "inmuebles", count: properties.count ?? 0 },
    { label: "fiducias propias", count: trustCompanies.count ?? 0 },
  ];
}

const IN_USE_HINT = "Reasígnalos o elimínalos primero, o deshabilita la constructora en su lugar.";

/**
 * Deletes a constructora that nothing references anymore. Users, projects,
 * properties and its own fiducias block the delete (their foreign keys have
 * no `ON DELETE`), so they're counted first to explain why.
 */
export async function deleteDeveloper(developerId: number): Promise<ActionResult<DeveloperSnapshot>> {
  const inUse = (await countDeveloperDependents(developerId)).filter(({ count }) => count > 0);
  if (inUse.length > 0) {
    const summary = inUse.map(({ label, count }) => `${count} ${label}`).join(", ");
    return { success: false, error: `No se puede eliminar: tiene ${summary}. ${IN_USE_HINT}` };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("developers")
    .delete()
    .eq("id", developerId)
    .select("id, name, nit, phone, email, address, description, is_enabled, created_at")
    .maybeSingle();

  if (error) {
    // Something got linked between the check and the delete.
    return error.code === PG_ERROR.foreignKeyViolation
      ? { success: false, error: `No se puede eliminar: la constructora tiene registros asociados. ${IN_USE_HINT}` }
      : { success: false, error: `No se pudo eliminar la constructora: ${error.message}` };
  }
  if (!data) return { success: false, error: "La constructora no existe." };
  return {
    success: true,
    data: {
      id: data.id,
      createdAt: data.created_at,
      values: { ...toCompanyFormValues(data), isEnabled: data.is_enabled },
    },
  };
}

/**
 * Re-creates a just-deleted constructora ("Deshacer"). Its id is a
 * `GENERATED ALWAYS` identity, so it comes back with a new id; nothing
 * referenced the old one (deleting requires that).
 */
export async function restoreDeveloper({
  createdAt,
  input,
}: ParsedDeletedRecord<number, DeveloperInput>): Promise<ActionResult> {
  const admin = createAdminClient();
  const { error } = await admin.from("developers").insert({
    name: input.name,
    nit: input.nit,
    phone: input.phone,
    email: input.email,
    address: input.address,
    description: input.description,
    is_enabled: input.isEnabled,
    ...(createdAt ? { created_at: createdAt } : {}),
  });

  if (error) {
    return error.code === PG_ERROR.uniqueViolation
      ? { success: false, error: "No se pudo restaurar: ya existe otra constructora con este NIT." }
      : { success: false, error: `No se pudo restaurar la constructora: ${error.message}` };
  }
  return { success: true };
}
