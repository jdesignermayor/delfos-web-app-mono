import {
  hasErrors,
  parseCompanyFields,
  type CompanyField,
  type CompanyFieldErrors,
  type CompanyFormValues,
  type CompanyInput,
} from "@/lib/validation/company";

/**
 * Validation for the banco edit form (`/dashboard/bancos/[id]`). Only the
 * name is required; the `nit` column holds the bank's código DANE.
 */

/** Label for the `nit` input. */
export const BANK_CODE_LABEL = "Código DANE";

export type BankField = CompanyField;
export type BankFieldErrors = CompanyFieldErrors;
export type BankFormValues = CompanyFormValues;
export type BankInput = CompanyInput;

export type BankParseResult = { success: true; data: BankInput } | { success: false; errors: BankFieldErrors };

export function parseBankForm(values: Partial<Record<keyof BankFormValues, unknown>>): BankParseResult {
  const { data, errors } = parseCompanyFields(values, { nitLabel: "código DANE" });
  return hasErrors(errors) ? { success: false, errors } : { success: true, data };
}
