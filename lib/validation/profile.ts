/** Validation for the signed-in user's own profile page (`/dashboard/profile`). */

export type ProfileField = "name" | "phone";
export type ProfileFieldErrors = Partial<Record<ProfileField, string>>;

export type ProfileFormValues = {
  name: string;
  phone: string;
};

export type ProfileInput = {
  name: string;
  phone: string | null;
};

const asText = (value: unknown) => (typeof value === "string" ? value : "");

/** Digits, spaces, "+", "-", "(" and ")" — 7 to 20 characters. */
const PHONE_REGEX = /^\+?[\d\s()-]{7,20}$/;
const MAX_NAME_LENGTH = 120;

export function parseProfileForm(
  values: Partial<Record<keyof ProfileFormValues, unknown>>,
): { success: true; data: ProfileInput } | { success: false; errors: ProfileFieldErrors } {
  const name = asText(values.name).trim().replace(/\s+/g, " ");
  const phone = asText(values.phone).trim();

  const errors: ProfileFieldErrors = {};
  if (!name) errors.name = "Ingresa tu nombre.";
  else if (name.length > MAX_NAME_LENGTH) errors.name = `Máximo ${MAX_NAME_LENGTH} caracteres.`;
  if (phone && !PHONE_REGEX.test(phone)) errors.phone = "Ingresa un teléfono válido.";

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { name, phone: phone || null } };
}

// --- Password --------------------------------------------------------------

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt (Supabase Auth) ignores anything beyond 72 bytes

/**
 * Medium-strength policy: 8–72 characters, no whitespace, and at least one
 * lowercase letter, one uppercase letter, one digit and one symbol.
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])\S{8,72}$/;

/** Each rule on its own, so the form can show a live checklist. */
export const PASSWORD_RULES: { id: string; label: string; test: (value: string) => boolean }[] = [
  { id: "length", label: `Entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres`, test: (v) => v.length >= PASSWORD_MIN_LENGTH && v.length <= PASSWORD_MAX_LENGTH },
  { id: "lower", label: "Una letra minúscula", test: (v) => /[a-z]/.test(v) },
  { id: "upper", label: "Una letra mayúscula", test: (v) => /[A-Z]/.test(v) },
  { id: "digit", label: "Un número", test: (v) => /\d/.test(v) },
  { id: "symbol", label: "Un símbolo (!@#$%…)", test: (v) => /[^A-Za-z\d\s]/.test(v) },
  { id: "spaces", label: "Sin espacios", test: (v) => v.length > 0 && !/\s/.test(v) },
];

export type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";
export type PasswordFieldErrors = Partial<Record<PasswordField, string>>;
export type PasswordFormValues = Record<PasswordField, string>;

export const EMPTY_PASSWORD_FORM: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function parsePasswordForm(
  values: Partial<Record<PasswordField, unknown>>,
): { success: true; data: PasswordFormValues } | { success: false; errors: PasswordFieldErrors } {
  // Passwords are taken as typed — never trimmed.
  const currentPassword = asText(values.currentPassword);
  const newPassword = asText(values.newPassword);
  const confirmPassword = asText(values.confirmPassword);

  const errors: PasswordFieldErrors = {};
  if (!currentPassword) errors.currentPassword = "Ingresa tu contraseña actual.";
  if (!PASSWORD_REGEX.test(newPassword)) {
    errors.newPassword = "La contraseña no cumple los requisitos de seguridad.";
  } else if (newPassword === currentPassword) {
    errors.newPassword = "La nueva contraseña debe ser diferente a la actual.";
  }
  if (confirmPassword !== newPassword) errors.confirmPassword = "Las contraseñas no coinciden.";

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { currentPassword, newPassword, confirmPassword } };
}
