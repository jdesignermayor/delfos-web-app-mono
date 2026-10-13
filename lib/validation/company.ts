import { isValidEmail, normalizeEmail } from "@/lib/validation/email";

/**
 * Fields shared by the catalogs (constructoras, fiducias, zonas comunes…).
 * "Contact" fields are a name plus contact details and a description; a
 * "company" adds its NIT. Each entity's validator composes one of these and
 * adds its own fields on top.
 */

export type ContactField = "name" | "phone" | "email" | "address" | "description";
export type CompanyField = ContactField | "nit";

export type ContactFieldErrors = Partial<Record<ContactField, string>>;
export type CompanyFieldErrors = Partial<Record<CompanyField, string>>;

/** What a form holds: every field as typed. */
export type ContactFormValues = Record<ContactField, string>;
export type CompanyFormValues = Record<CompanyField, string>;

/** Validated fields. Optional ones are `null` when left blank. */
export type ContactInput = {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  description: string | null;
};
export type CompanyInput = ContactInput & { nit: string | null };

/** Which optional fields an entity requires (they're `NOT NULL` in its table). */
export type ContactRules = {
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
 * Validates the contact fields and returns every error at once. Takes
 * `unknown` values because Server Action arguments come from the client and
 * can't be trusted to match the TypeScript type.
 */
export function parseContactFields(
  values: Partial<Record<ContactField, unknown>>,
  { phoneRequired = false, addressRequired = false }: ContactRules = {},
): { data: ContactInput; errors: ContactFieldErrors } {
  const name = collapseSpaces(asText(values.name));
  const phone = asText(values.phone).trim();
  const email = normalizeEmail(asText(values.email));
  const address = collapseSpaces(asText(values.address));
  const description = asText(values.description).trim();

  const errors: ContactFieldErrors = {};
  if (!name) errors.name = "Ingresa el nombre.";
  else if (name.length > COMPANY_LIMITS.name) errors.name = `Máximo ${COMPANY_LIMITS.name} caracteres.`;

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
      phone: phone || null,
      email: email || null,
      address: address || null,
      description: description || null,
    },
    errors,
  };
}

/** The contact fields plus an optional NIT. */
export function parseCompanyFields(
  values: Partial<Record<CompanyField, unknown>>,
  rules: ContactRules = {},
): { data: CompanyInput; errors: CompanyFieldErrors } {
  const contact = parseContactFields(values, rules);
  const errors: CompanyFieldErrors = { ...contact.errors };
  const nit = asText(values.nit).replace(/\s+/g, "");

  if (nit && (!NIT_REGEX.test(nit) || nit.length > COMPANY_LIMITS.nit)) {
    errors.nit = "Ingresa un NIT válido (ej. 900.123.456-7).";
  }

  return { data: { ...contact.data, nit: nit || null }, errors };
}

/** Whether a field-error map has any errors. */
export function hasErrors(errors: Partial<Record<string, string>>): boolean {
  return Object.keys(errors).length > 0;
}

/** A stored row (nullable columns) as contact form values. */
export function toContactFormValues(row: { [K in ContactField]: string | null }): ContactFormValues {
  return {
    name: row.name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    address: row.address ?? "",
    description: row.description ?? "",
  };
}

/** A stored row (nullable columns) as company form values. */
export function toCompanyFormValues(row: { [K in CompanyField]: string | null }): CompanyFormValues {
  return { ...toContactFormValues(row), nit: row.nit ?? "" };
}
