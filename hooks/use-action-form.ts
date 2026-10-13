import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm, type DefaultValues, type FieldValues, type Path, type Resolver } from "react-hook-form";

import { useToast } from "@/components/providers/toast-provider";
import type { ActionFormResult } from "@/lib/forms/action-result";

const UNEXPECTED_ERROR = "No se pudieron guardar los cambios. Intenta de nuevo.";

/** A save the server rejected — carries its errors so they can be shown on the form. */
class ActionFormError<TValues extends FieldValues> extends Error {
  constructor(readonly result: Extract<ActionFormResult<TValues>, { success: false }>) {
    super(result.message ?? "Invalid form");
  }
}

/**
 * Form state (React Hook Form) plus a save (TanStack Query mutation) that
 * calls a Server Action. Validates on the client with `resolver`, maps
 * server-side errors back onto the fields, and on success invalidates
 * `invalidateKey`, toasts and navigates client-side to `redirectTo`.
 */
export function useActionForm<TValues extends FieldValues>({
  defaultValues,
  resolver,
  action,
  mutationKey,
  invalidateKey,
  successMessage,
  redirectTo,
}: {
  defaultValues: DefaultValues<TValues>;
  resolver: Resolver<TValues>;
  /** A Server Action, usually bound to the record id. */
  action: (values: TValues) => Promise<ActionFormResult<TValues>>;
  mutationKey: QueryKey;
  /** Queries whose data this save changes. */
  invalidateKey: QueryKey;
  successMessage: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TValues>({
    defaultValues,
    resolver,
    // Validate a field once it's been left, then on every change until it's fixed.
    mode: "onTouched",
  });

  const mutation = useMutation({
    mutationKey,
    mutationFn: async (values: TValues) => {
      const result = await action(values);
      if (!result.success) throw new ActionFormError<TValues>(result);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invalidateKey });
      toast.success(successMessage);
      router.push(redirectTo);
    },
    onError: (error) => {
      if (!(error instanceof ActionFormError)) {
        form.setError("root.server", { message: UNEXPECTED_ERROR });
        return;
      }
      const { message, fieldErrors } = (error as ActionFormError<TValues>).result;
      for (const [field, fieldMessage] of Object.entries(fieldErrors)) {
        if (typeof fieldMessage === "string") {
          form.setError(field as Path<TValues>, { type: "server", message: fieldMessage }, { shouldFocus: true });
        }
      }
      if (message) form.setError("root.server", { message });
    },
  });

  return {
    form,
    onSubmit: form.handleSubmit((values) => mutation.mutate(values)),
    /** The server's form-level error, if any. */
    serverMessage: form.formState.errors.root?.server?.message,
    // Stay disabled after success while the page navigates away.
    isSaving: mutation.isPending || mutation.isSuccess,
  };
}
