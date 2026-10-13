import {
  hasErrors,
  parseCompanyFields,
  type CompanyField,
  type CompanyFieldErrors,
  type CompanyFormValues,
  type CompanyInput,
} from "@/lib/validation/company";

/** Validation for the fiducia edit form (`/dashboard/fiducias/[id]`). Only the name is required. */

export type TrustCompanyField = CompanyField;
export type TrustCompanyFieldErrors = CompanyFieldErrors;
export type TrustCompanyFormValues = CompanyFormValues;
export type TrustCompanyInput = CompanyInput;

export type TrustCompanyParseResult =
  | { success: true; data: TrustCompanyInput }
  | { success: false; errors: TrustCompanyFieldErrors };

export function parseTrustCompanyForm(
  values: Partial<Record<keyof TrustCompanyFormValues, unknown>>,
): TrustCompanyParseResult {
  const { data, errors } = parseCompanyFields(values);
  return hasErrors(errors) ? { success: false, errors } : { success: true, data };
}
