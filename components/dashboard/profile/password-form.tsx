"use client";

import { useState, useTransition } from "react";
import { Button, FieldError, Input, Label, TextField } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";

import { changePasswordAction } from "@/app/actions/profile";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { useToast } from "@/components/providers/toast-provider";
import {
  EMPTY_PASSWORD_FORM,
  PASSWORD_MAX_LENGTH,
  PASSWORD_REGEX,
  type PasswordField,
  type PasswordFieldErrors,
} from "@/lib/validation/profile";

const FIELDS: { name: PasswordField; label: string; autoComplete: string }[] = [
  { name: "currentPassword", label: "Contraseña actual", autoComplete: "current-password" },
  { name: "newPassword", label: "Nueva contraseña", autoComplete: "new-password" },
  { name: "confirmPassword", label: "Confirmar nueva contraseña", autoComplete: "new-password" },
];

/** Change password: requires the current one and a new one matching `PASSWORD_REGEX`. */
export function PasswordForm() {
  const toast = useToast();
  const [values, setValues] = useState(EMPTY_PASSWORD_FORM);
  const [fieldErrors, setFieldErrors] = useState<PasswordFieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  const meetsPolicy = PASSWORD_REGEX.test(values.newPassword);
  const matches = values.newPassword === values.confirmPassword;
  const canSubmit = Boolean(values.currentPassword) && meetsPolicy && matches;

  function setField(field: PasswordField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await changePasswordAction(values);
      if (!result.success) {
        setFieldErrors(result.fieldErrors);
        setMessage(result.message);
        return;
      }
      setValues(EMPTY_PASSWORD_FORM);
      setVisible(false);
      toast.success("Contraseña actualizada", "Cerramos tus otras sesiones abiertas.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        {FIELDS.map((field) => (
          <TextField
            key={field.name}
            name={field.name}
            type={visible ? "text" : "password"}
            value={values[field.name]}
            onChange={(value) => setField(field.name, value)}
            isRequired
            isInvalid={Boolean(fieldErrors[field.name])}
          >
            <Label>{field.label}</Label>
            <Input
              type={visible ? "text" : "password"}
              autoComplete={field.autoComplete}
              maxLength={PASSWORD_MAX_LENGTH}
              spellCheck={false}
            />
            {field.name === "newPassword" ? <PasswordChecklist value={values.newPassword} /> : null}
            {field.name === "confirmPassword" && values.confirmPassword && !matches && !fieldErrors.confirmPassword ? (
              <p className="text-xs text-danger">Las contraseñas no coinciden.</p>
            ) : null}
            <FieldError>{fieldErrors[field.name]}</FieldError>
          </TextField>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        {visible ? "Ocultar contraseñas" : "Mostrar contraseñas"}
      </button>

      {message ? (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {message}
        </p>
      ) : null}

      <div>
        <Button type="submit" variant="primary" isDisabled={isPending || !canSubmit}>
          {isPending ? "Actualizando…" : "Cambiar contraseña"}
        </Button>
      </div>
    </form>
  );
}
