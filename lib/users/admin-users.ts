/**
 * Constructora users (role `admin`): create, update, read and list.
 * Server-only — uses the service-role client. Callers must check the caller
 * is a superadmin.
 */
import type { AdminUserField, AdminUserInput } from "@/lib/validation/admin-user";
import { createAdminClient } from "@/supabase/admin";

const ADMIN_ROLE = "admin";

/** Selects a user with its role and constructora, in the shape `toAdminUserRow` expects. */
const ADMIN_USER_SELECT =
  "id, name, email, phone, is_active, created_at, roles!inner(name), developer:developers!developer_id(id, name, is_enabled)";

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string | null;
  developer: { id: number; name: string; isEnabled: boolean } | null;
};

export type SaveAdminUserResult =
  | { success: true; userId: string }
  | { success: false; error: string; field?: AdminUserField };

type AdminClient = ReturnType<typeof createAdminClient>;

function toAdminUserRow(row: {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string | null;
  developer: { id: number; name: string; is_enabled: boolean } | null;
}): AdminUserRow {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    isActive: row.is_active,
    createdAt: row.created_at,
    developer: row.developer
      ? { id: row.developer.id, name: row.developer.name, isEnabled: row.developer.is_enabled }
      : null,
  };
}

/** Checks shared by create and update: the constructora exists and no other user has the email. */
async function validateReferences(
  admin: AdminClient,
  input: AdminUserInput,
  userId?: string,
): Promise<SaveAdminUserResult | null> {
  let emailQuery = admin.from("users").select("id").eq("email", input.email);
  if (userId) emailQuery = emailQuery.neq("id", userId);

  const [{ data: developer }, { data: existing }] = await Promise.all([
    admin.from("developers").select("id").eq("id", input.developerId).maybeSingle(),
    emailQuery.maybeSingle(),
  ]);

  if (!developer) return { success: false, error: "La constructora no existe.", field: "developerId" };
  if (existing) return { success: false, error: "Ya existe un usuario con este correo.", field: "email" };
  return null;
}

function authErrorResult(error: { message: string; code?: string } | null, fallback: string): SaveAdminUserResult {
  return {
    success: false,
    error: error?.message ?? fallback,
    field: error?.code === "email_exists" ? "email" : undefined,
  };
}

/**
 * Creates the auth account (already confirmed, so the constructora can sign
 * in right away) and its `public.users` profile linked to the constructora.
 * If the profile can't be saved, the auth account is removed again so no
 * half-created user is left behind.
 */
export async function createAdminUser(input: AdminUserInput): Promise<SaveAdminUserResult> {
  if (!input.password) return { success: false, error: "Ingresa una contraseña.", field: "password" };

  const admin = createAdminClient();
  const referenceError = await validateReferences(admin, input);
  if (referenceError) return referenceError;

  const { data: role } = await admin.from("roles").select("id").eq("name", ADMIN_ROLE).maybeSingle();
  if (!role) return { success: false, error: "El rol admin no existe. Ejecuta la migración de usuarios." };

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.name, phone: input.phone },
  });
  if (authError || !created.user) return authErrorResult(authError, "No se pudo crear la cuenta.");

  const userId = created.user.id;
  const { error: profileError } = await admin.from("users").upsert(
    {
      id: userId,
      email: input.email,
      name: input.name,
      phone: input.phone,
      role_id: role.id,
      developer_id: input.developerId,
      is_active: input.isActive,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return { success: false, error: `No se pudo guardar el perfil: ${profileError.message}` };
  }

  return { success: true, userId };
}

/**
 * Updates a constructora user: auth email / password (password only when a
 * new one was typed) and the profile — name, phone, constructora and
 * whether it's active. A deactivated user is kept out of the dashboard on
 * their next request.
 */
export async function updateAdminUser(userId: string, input: AdminUserInput): Promise<SaveAdminUserResult> {
  const current = await getAdminUser(userId);
  if (!current) return { success: false, error: "El usuario no existe o no es de una constructora." };

  const admin = createAdminClient();
  const referenceError = await validateReferences(admin, input, userId);
  if (referenceError) return referenceError;

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    email: input.email,
    email_confirm: true,
    ...(input.password ? { password: input.password } : {}),
    user_metadata: { full_name: input.name, phone: input.phone },
  });
  if (authError) return authErrorResult(authError, "No se pudo actualizar la cuenta.");

  const { error: profileError } = await admin
    .from("users")
    .update({
      email: input.email,
      name: input.name,
      phone: input.phone,
      developer_id: input.developerId,
      is_active: input.isActive,
    })
    .eq("id", userId);

  if (profileError) {
    return { success: false, error: `No se pudo guardar el perfil: ${profileError.message}` };
  }

  return { success: true, userId };
}

/** One constructora user, or `null` if it doesn't exist or isn't an `admin`. */
export async function getAdminUser(userId: string): Promise<AdminUserRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select(ADMIN_USER_SELECT)
    .eq("id", userId)
    .eq("roles.name", ADMIN_ROLE)
    .maybeSingle();

  return data ? toAdminUserRow(data) : null;
}

/** Every constructora user, newest first. */
export async function listAdminUsers(): Promise<{ data: AdminUserRow[]; error: string | null }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .select(ADMIN_USER_SELECT)
    .eq("roles.name", ADMIN_ROLE)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data.map(toAdminUserRow), error: null };
}
