import {
  hasErrors,
  parseContactFields,
  type ContactField,
  type ContactFieldErrors,
  type ContactFormValues,
  type ContactInput,
} from "@/lib/validation/company";

/** Validation for the zona común edit form (`/dashboard/zonas-comunes/[id]`). Only the name is required. */

export type CommonAreaField = ContactField;
export type CommonAreaFieldErrors = ContactFieldErrors;
export type CommonAreaFormValues = ContactFormValues;
export type CommonAreaInput = ContactInput;

export type CommonAreaParseResult =
  | { success: true; data: CommonAreaInput }
  | { success: false; errors: CommonAreaFieldErrors };

export function parseCommonAreaForm(
  values: Partial<Record<keyof CommonAreaFormValues, unknown>>,
): CommonAreaParseResult {
  const { data, errors } = parseContactFields(values);
  return hasErrors(errors) ? { success: false, errors } : { success: true, data };
}
