import { isValidEmail, normalizeEmail } from "@/lib/validation/email";

export type AdminUserField = "name" | "email" | "phone" | "password" | "developerId" | "isActive";

export type AdminUserFieldErrors = Partial<Record<AdminUserField, string>>;

/** "create" requires a password; "update" keeps the current one when left blank. */
export type AdminUserFormMode = "create" | "update";

/** What the user form holds and sends to its Server Action. */
export type AdminUserFormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  /** Select value: the constructora id as a string, "" when none is picked. */
  developerId: string;
  isActive: boolean;
};

export const EMPTY_ADMIN_USER_FORM: AdminUserFormValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
  developerId: "",
  isActive: true,
};

/** A validated constructora-user form, ready to save. */
export type AdminUserInput = {
  name: string;
  email: string;
  phone: string | null;
  /** `null` on update when the password shouldn't change. */
  password: string | null;
  developerId: number;
  isActive: boolean;
};

export const MIN_PASSWORD_LENGTH = 8;

export type ParseResult =
  | { success: true; data: AdminUserInput }
  | { success: false; errors: AdminUserFieldErrors };

const asText = (value: unknown) => (typeof value === "string" ? value : "");

/**
 * Validates the user form and returns every field error at once. Takes
 * `unknown` fields because Server Action arguments come from the client and
 * can't be trusted to match the TypeScript type.
 */
export function parseAdminUserForm(
  values: Partial<Record<keyof AdminUserFormValues, unknown>>,
  mode: AdminUserFormMode,
): ParseResult {
  const name = asText(values.name).trim();
  const email = normalizeEmail(asText(values.email));
  const phone = asText(values.phone).trim();
  // Passwords are taken as typed — leading/trailing spaces are significant.
  const password = asText(values.password);
  const developerId = Number(asText(values.developerId));
  // New users always start active.
  const isActive = mode === "create" || values.isActive === true;

  const errors: AdminUserFieldErrors = {};
  if (!name) errors.name = "Ingresa el nombre del usuario.";
  if (!isValidEmail(email)) errors.email = "Ingresa un correo válido.";
  if ((mode === "create" || password) && password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (!Number.isInteger(developerId) || developerId <= 0) {
    errors.developerId = "Selecciona la constructora.";
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return {
    success: true,
    data: { name, email, phone: phone || null, password: password || null, developerId, isActive },
  };
}
