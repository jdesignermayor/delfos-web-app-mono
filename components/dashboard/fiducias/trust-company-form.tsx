"use client";

import type { UpdateTrustCompanyActionResult } from "@/app/actions/trust-companies";
import { companyTextFields } from "@/components/dashboard/forms/company-text-fields";
import { FormActions } from "@/components/dashboard/forms/form-actions";
import { FormTextField } from "@/components/dashboard/forms/form-text-field";
import { useActionForm } from "@/hooks/use-action-form";
import { parseResolver } from "@/lib/forms/parse-resolver";
import { queryKeys } from "@/lib/query-keys";
import { parseTrustCompanyForm, type TrustCompanyFormValues } from "@/lib/validation/trust-company";

const LIST_HREF = "/dashboard/fiducias";
const TEXT_FIELDS = companyTextFields();
const resolver = parseResolver<TrustCompanyFormValues>(parseTrustCompanyForm);

/**
 * Edit form for a fiducia. React Hook Form owns the field state;
 * submitting runs a TanStack Query mutation that calls `saveAction` (a
 * Server Action) without reloading the page.
 */
export function TrustCompanyForm({
  trustCompanyId,
  saveAction,
  initialValues,
}: {
  trustCompanyId: string;
  /** `updateTrustCompanyAction` bound to the fiducia id. */
  saveAction: (values: TrustCompanyFormValues) => Promise<UpdateTrustCompanyActionResult>;
  initialValues: TrustCompanyFormValues;
}) {
  const { form, onSubmit, serverMessage, isSaving } = useActionForm({
    defaultValues: initialValues,
    resolver,
    action: saveAction,
    mutationKey: queryKeys.trustCompanies.detail(trustCompanyId),
    invalidateKey: queryKeys.trustCompanies.all,
    successMessage: "Fiducia actualizada",
    redirectTo: LIST_HREF,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {TEXT_FIELDS.map((config) => (
          <FormTextField key={config.name} config={config} control={form.control} />
        ))}
      </div>

      <FormActions
        cancelHref={LIST_HREF}
        serverMessage={serverMessage}
        isSaving={isSaving}
        isDirty={form.formState.isDirty}
      />
    </form>
  );
}
