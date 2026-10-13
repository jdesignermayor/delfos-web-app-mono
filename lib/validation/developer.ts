import {
  parseCompanyFields,
  type CompanyField,
  type CompanyFormValues,
  type CompanyInput,
} from "@/lib/validation/company";

/** Validation for the constructora edit form (`/dashboard/constructoras/[id]`). */

export type DeveloperField = CompanyField | "isEnabled";

export type DeveloperFieldErrors = Partial<Record<DeveloperField, string>>;

/** What the constructora form holds and sends to its Server Action. */
export type DeveloperFormValues = CompanyFormValues & { isEnabled: boolean };

/** A validated constructora form. Phone and address are `NOT NULL` for constructoras. */
export type DeveloperInput = Omit<CompanyInput, "phone" | "address"> & {
  phone: string;
  address: string;
  isEnabled: boolean;
};

export type DeveloperParseResult =
  | { success: true; data: DeveloperInput }
  | { success: false; errors: DeveloperFieldErrors };

export function parseDeveloperForm(
  values: Partial<Record<keyof DeveloperFormValues, unknown>>,
): DeveloperParseResult {
  const { data, errors } = parseCompanyFields(values, { phoneRequired: true, addressRequired: true });

  if (Object.keys(errors).length > 0 || data.phone === null || data.address === null) {
    return { success: false, errors };
  }
  return {
    success: true,
    data: { ...data, phone: data.phone, address: data.address, isEnabled: values.isEnabled === true },
  };
}
