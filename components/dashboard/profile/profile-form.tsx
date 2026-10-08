"use client";

import { useState, useTransition } from "react";
import { Button, FieldError, Input, Label, TextField } from "@heroui/react";

import { updateProfileAction } from "@/app/actions/profile";
import { useToast } from "@/components/providers/toast-provider";
import type { ProfileFieldErrors, ProfileFormValues } from "@/lib/validation/profile";

/** Name and phone. The email is shown read-only: it's the sign-in identifier. */
export function ProfileForm({ initialValues, email }: { initialValues: ProfileFormValues; email: string | null }) {
  const toast = useToast();
  const [values, setValues] = useState(initialValues);
  const [saved, setSaved] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isDirty = values.name !== saved.name || values.phone !== saved.phone;

  function setField(field: keyof ProfileFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (!result.success) {
        setFieldErrors(result.fieldErrors);
        setMessage(result.message);
        return;
      }
      setSaved(values);
      toast.success("Datos actualizados");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="name"
          value={values.name}
          onChange={(value) => setField("name", value)}
          isRequired
          isInvalid={Boolean(fieldErrors.name)}
        >
          <Label>Nombre completo</Label>
          <Input autoComplete="name" />
          <FieldError>{fieldErrors.name}</FieldError>
        </TextField>

        <TextField
          name="phone"
          type="tel"
          value={values.phone}
          onChange={(value) => setField("phone", value)}
          isInvalid={Boolean(fieldErrors.phone)}
        >
          <Label>Teléfono</Label>
          <Input type="tel" autoComplete="tel" placeholder="+57 300 000 0000" />
          <FieldError>{fieldErrors.phone}</FieldError>
        </TextField>

        <TextField name="email" type="email" value={email ?? ""} isReadOnly className="sm:col-span-2">
          <Label>Correo</Label>
          <Input type="email" className="cursor-not-allowed opacity-70" />
          <p className="text-xs text-muted">Para cambiar tu correo, contacta a un administrador.</p>
        </TextField>
      </div>

      {message ? (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {message}
        </p>
      ) : null}

      <Button type="submit" variant="primary" isDisabled={isPending || !isDirty}>
        {isPending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
