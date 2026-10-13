import type { TextFieldConfig } from "@/components/dashboard/forms/form-text-field";
import { COMPANY_LIMITS, type CompanyField, type CompanyRules } from "@/lib/validation/company";

/** Inputs for the shared company fields, marked required per the entity's rules. */
export function companyTextFields({
  phoneRequired = false,
  addressRequired = false,
}: CompanyRules = {}): TextFieldConfig<CompanyField>[] {
  return [
    { name: "name", label: "Nombre", type: "text", required: true, autoComplete: "organization", maxLength: COMPANY_LIMITS.name },
    { name: "nit", label: "NIT", type: "text", placeholder: "900.123.456-7", maxLength: COMPANY_LIMITS.nit },
    { name: "phone", label: "Teléfono", type: "tel", required: phoneRequired, autoComplete: "tel" },
    { name: "email", label: "Correo", type: "email", autoComplete: "email" },
    {
      name: "address",
      label: "Dirección",
      type: "text",
      required: addressRequired,
      autoComplete: "street-address",
      maxLength: COMPANY_LIMITS.address,
      fullWidth: true,
    },
    { name: "description", label: "Descripción", type: "textarea", maxLength: COMPANY_LIMITS.description, fullWidth: true },
  ];
}
