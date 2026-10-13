import { isValidEmail, normalizeEmail } from "@/lib/validation/email";

/**
 * Fields shared by every company-like catalog (constructoras, fiducias…):
 * name, NIT, contact details and a description. Each entity's validator
 * composes `parseCompanyFields` and adds its own fields on top.
 */

export type CompanyField = "name" | "nit" | "phone" | "email" | "address" | "description";

export type CompanyFieldErrors = Partial<Record<CompanyField, string>>;

/** What a company form holds: every field as typed. */
export type CompanyFormValues = Record<CompanyField, string>;

/** Validated company fields. Optional ones are `null` when left blank. */
export type CompanyInput = {
  name: string;
  nit: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  description: string | null;
};

/** Which optional fields an entity requires (they're `NOT NULL` in its table). */
export type CompanyRules = {
  phoneRequired?: boolean;
  addressRequired?: boolean;
};

export const COMPANY_LIMITS = {
  name: 120,
  nit: 20,
  address: 200,
  description: 2000,
} as const;

/** Digits, spaces, "+", "-", "(" and ")" — 7 to 20 characters. */
const PHONE_REGEX = /^\+?[\d\s()-]{7,20}$/;
/** Colombian NIT: digits, optionally dotted, with an optional "-" check digit (e.g. 900.123.456-7). */
const NIT_REGEX = /^[\d.]+(-\d)?$/;

const asText = (value: unknown) => (typeof value === "string" ? value : "");
const collapseSpaces = (value: string) => value.trim().replace(/\s+/g, " ");

/**
 * Validates the shared company fields and returns every error at once.
 * Takes `unknown` values because Server Action arguments come from the
 * client and can't be trusted to match the TypeScript type.
 */
export function parseCompanyFields(
  values: Partial<Record<CompanyField, unknown>>,
  { phoneRequired = false, addressRequired = false }: CompanyRules = {},
): { data: CompanyInput; errors: CompanyFieldErrors } {
  const name = collapseSpaces(asText(values.name));
  const nit = asText(values.nit).replace(/\s+/g, "");
  const phone = asText(values.phone).trim();
  const email = normalizeEmail(asText(values.email));
  const address = collapseSpaces(asText(values.address));
  const description = asText(values.description).trim();

  const errors: CompanyFieldErrors = {};
  if (!name) errors.name = "Ingresa el nombre.";
  else if (name.length > COMPANY_LIMITS.name) errors.name = `Máximo ${COMPANY_LIMITS.name} caracteres.`;

  if (nit && (!NIT_REGEX.test(nit) || nit.length > COMPANY_LIMITS.nit)) {
    errors.nit = "Ingresa un NIT válido (ej. 900.123.456-7).";
  }

  if (!phone) {
    if (phoneRequired) errors.phone = "Ingresa el teléfono.";
  } else if (!PHONE_REGEX.test(phone)) {
    errors.phone = "Ingresa un teléfono válido.";
  }

  if (email && !isValidEmail(email)) errors.email = "Ingresa un correo válido.";

  if (!address) {
    if (addressRequired) errors.address = "Ingresa la dirección.";
  } else if (address.length > COMPANY_LIMITS.address) {
    errors.address = `Máximo ${COMPANY_LIMITS.address} caracteres.`;
  }

  if (description.length > COMPANY_LIMITS.description) {
    errors.description = `Máximo ${COMPANY_LIMITS.description} caracteres.`;
  }

  return {
    data: {
      name,
      nit: nit || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      description: description || null,
    },
    errors,
  };
}

/** A stored company row (nullable columns) as form values. */
export function toCompanyFormValues(row: { [K in CompanyField]: string | null }): CompanyFormValues {
  return {
    name: row.name ?? "",
    nit: row.nit ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    address: row.address ?? "",
    description: row.description ?? "",
  };
}
