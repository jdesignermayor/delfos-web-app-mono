import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { AdminUserActionResult } from "@/app/actions/users";
import { useToast } from "@/components/providers/toast-provider";
import type { AdminUserFieldErrors, AdminUserFormValues } from "@/lib/validation/admin-user";

export type SaveAdminUser = (values: AdminUserFormValues) => Promise<AdminUserActionResult>;

/**
 * State and submit logic for the user form. Values are controlled, so
 * nothing is lost between submits; on success it navigates client-side
 * back to the list (no full page reload).
 */
export function useAdminUserForm({
  initialValues,
  saveAction,
  successMessage,
}: {
  initialValues: AdminUserFormValues;
  saveAction: SaveAdminUser;
  successMessage: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<AdminUserFieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setField<K extends keyof AdminUserFormValues>(field: K, value: AdminUserFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    // Clear a field's error as soon as it's edited.
    setFieldErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await saveAction(values);
      if (!result.success) {
        setFieldErrors(result.fieldErrors);
        setMessage(result.message);
        return;
      }
      toast.success(successMessage);
      router.push("/dashboard/users");
    });
  }

  return { values, fieldErrors, message, isPending, setField, handleSubmit };
}
