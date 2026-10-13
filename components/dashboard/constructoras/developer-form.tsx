"use client";

import { Controller, type Control } from "react-hook-form";
import { Label, Switch } from "@heroui/react";

import type { UpdateDeveloperActionResult } from "@/app/actions/developers";
import { companyTextFields } from "@/components/dashboard/forms/company-text-fields";
import { FormActions } from "@/components/dashboard/forms/form-actions";
import { FormTextField } from "@/components/dashboard/forms/form-text-field";
import { useActionForm } from "@/hooks/use-action-form";
import { parseResolver } from "@/lib/forms/parse-resolver";
import { queryKeys } from "@/lib/query-keys";
import { parseDeveloperForm, type DeveloperFormValues } from "@/lib/validation/developer";

const LIST_HREF = "/dashboard/constructoras";
const TEXT_FIELDS = companyTextFields({ phoneRequired: true, addressRequired: true });
const resolver = parseResolver<DeveloperFormValues>(parseDeveloperForm);

function EnabledSwitch({ control }: { control: Control<DeveloperFormValues> }) {
  return (
    <div className="sm:col-span-2">
      <Controller
        name="isEnabled"
        control={control}
        render={({ field }) => (
          <Switch isSelected={field.value} onChange={field.onChange}>
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Label className="text-sm">Constructora habilitada</Label>
            </Switch.Content>
          </Switch>
        )}
      />
      <p className="mt-1 text-xs text-muted">
        Mientras esté deshabilitada, sus usuarios no pueden ingresar al dashboard.
      </p>
    </div>
  );
}

/**
 * Edit form for a constructora. React Hook Form owns the field state;
 * submitting runs a TanStack Query mutation that calls `saveAction` (a
 * Server Action) without reloading the page.
 */
export function DeveloperForm({
  developerId,
  saveAction,
  initialValues,
}: {
  developerId: number;
  /** `updateDeveloperAction` bound to the constructora id. */
  saveAction: (values: DeveloperFormValues) => Promise<UpdateDeveloperActionResult>;
  initialValues: DeveloperFormValues;
}) {
  const { form, onSubmit, serverMessage, isSaving } = useActionForm({
    defaultValues: initialValues,
    resolver,
    action: saveAction,
    mutationKey: queryKeys.developers.detail(developerId),
    invalidateKey: queryKeys.developers.all,
    successMessage: "Constructora actualizada",
    redirectTo: LIST_HREF,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {TEXT_FIELDS.map((config) => (
          <FormTextField key={config.name} config={config} control={form.control} />
        ))}

        <EnabledSwitch control={form.control} />
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
