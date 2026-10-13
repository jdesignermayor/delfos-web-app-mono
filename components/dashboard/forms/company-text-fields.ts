import type { TextFieldConfig } from "@/components/dashboard/forms/form-text-field";
import {
  COMPANY_LIMITS,
  type CompanyField,
  type ContactField,
  type ContactRules,
} from "@/lib/validation/company";

/** Inputs for the contact fields, marked required per the entity's rules. */
export function contactTextFields({
  phoneRequired = false,
  addressRequired = false,
}: ContactRules = {}): TextFieldConfig<ContactField>[] {
  return [
    { name: "name", label: "Nombre", type: "text", required: true, autoComplete: "organization", maxLength: COMPANY_LIMITS.name },
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

const NIT_FIELD: TextFieldConfig<"nit"> = {
  name: "nit",
  label: "NIT",
  type: "text",
  placeholder: "900.123.456-7",
  maxLength: COMPANY_LIMITS.nit,
};

/**
 * The contact inputs with the NIT right after the name. `nitLabel` renames
 * it for entities that store another code there (banks: "Código DANE").
 */
export function companyTextFields({
  nitLabel,
  ...rules
}: ContactRules & { nitLabel?: string } = {}): TextFieldConfig<CompanyField>[] {
  const [name, ...rest] = contactTextFields(rules);
  const nit = nitLabel ? { ...NIT_FIELD, label: nitLabel, placeholder: undefined } : NIT_FIELD;
  return [name, nit, ...rest];
}
