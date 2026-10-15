import { isValidEmail, normalizeEmail } from "@/lib/validation/email";

export type RegisterField = "fullName" | "email" | "phone" | "password";

export type RegisterFormValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

const MIN_PASSWORD_LENGTH = 6;

export type ParsedRegisterForm =
  | { success: true; data: RegisterFormValues }
  | { success: false; error: string; field: RegisterField };

/** Normalizes and validates the sign-up form. Pure, so it runs the same on client and server. */
export function parseRegisterForm(input: RegisterFormValues): ParsedRegisterForm {
  const fullName = String(input.fullName ?? "").trim();
  const email = normalizeEmail(String(input.email ?? ""));
  const phone = String(input.phone ?? "").trim();
  const password = String(input.password ?? "");

  if (!fullName) return { success: false, error: "Ingresa tu nombre completo.", field: "fullName" };
  if (!isValidEmail(email)) return { success: false, error: "Ingresa un correo válido.", field: "email" };
  if (!phone) return { success: false, error: "Ingresa tu teléfono.", field: "phone" };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      field: "password",
    };
  }

  return { success: true, data: { fullName, email, phone, password } };
}
