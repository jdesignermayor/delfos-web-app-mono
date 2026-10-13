"use client";

import type { UpdateCommonAreaActionResult } from "@/app/actions/common-areas";
import { contactTextFields } from "@/components/dashboard/forms/company-text-fields";
import { FormActions } from "@/components/dashboard/forms/form-actions";
import { FormTextField } from "@/components/dashboard/forms/form-text-field";
import { useActionForm } from "@/hooks/use-action-form";
import { parseResolver } from "@/lib/forms/parse-resolver";
import { queryKeys } from "@/lib/query-keys";
import { parseCommonAreaForm, type CommonAreaFormValues } from "@/lib/validation/common-area";

const LIST_HREF = "/dashboard/zonas-comunes";
const TEXT_FIELDS = contactTextFields();
const resolver = parseResolver<CommonAreaFormValues>(parseCommonAreaForm);

/**
 * Edit form for a zona común. React Hook Form owns the field state;
 * submitting runs a TanStack Query mutation that calls `saveAction` (a
 * Server Action) without reloading the page.
 */
export function CommonAreaForm({
  commonAreaId,
  saveAction,
  initialValues,
}: {
  commonAreaId: string;
  /** `updateCommonAreaAction` bound to the zona común id. */
  saveAction: (values: CommonAreaFormValues) => Promise<UpdateCommonAreaActionResult>;
  initialValues: CommonAreaFormValues;
}) {
  const { form, onSubmit, serverMessage, isSaving } = useActionForm({
    defaultValues: initialValues,
    resolver,
    action: saveAction,
    mutationKey: queryKeys.commonAreas.detail(commonAreaId),
    invalidateKey: queryKeys.commonAreas.all,
    successMessage: "Zona común actualizada",
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
