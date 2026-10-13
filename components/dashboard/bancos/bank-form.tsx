"use client";

import type { UpdateBankActionResult } from "@/app/actions/banks";
import { companyTextFields } from "@/components/dashboard/forms/company-text-fields";
import { FormActions } from "@/components/dashboard/forms/form-actions";
import { FormTextField } from "@/components/dashboard/forms/form-text-field";
import { useActionForm } from "@/hooks/use-action-form";
import { parseResolver } from "@/lib/forms/parse-resolver";
import { queryKeys } from "@/lib/query-keys";
import { BANK_CODE_LABEL, parseBankForm, type BankFormValues } from "@/lib/validation/bank";

const LIST_HREF = "/dashboard/bancos";
const TEXT_FIELDS = companyTextFields({ nitLabel: BANK_CODE_LABEL });
const resolver = parseResolver<BankFormValues>(parseBankForm);

/**
 * Edit form for a banco. React Hook Form owns the field state; submitting
 * runs a TanStack Query mutation that calls `saveAction` (a Server Action)
 * without reloading the page.
 */
export function BankForm({
  bankId,
  saveAction,
  initialValues,
}: {
  bankId: string;
  /** `updateBankAction` bound to the banco id. */
  saveAction: (values: BankFormValues) => Promise<UpdateBankActionResult>;
  initialValues: BankFormValues;
}) {
  const { form, onSubmit, serverMessage, isSaving } = useActionForm({
    defaultValues: initialValues,
    resolver,
    action: saveAction,
    mutationKey: queryKeys.banks.detail(bankId),
    invalidateKey: queryKeys.banks.all,
    successMessage: "Banco actualizado",
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
