"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, FieldError, Input, Label, TextField } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";

import { setPasswordWithTokenAction, type SetPasswordField } from "@/app/actions/auth";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { useToast } from "@/components/providers/toast-provider";
import { PASSWORD_MAX_LENGTH, PASSWORD_REGEX } from "@/lib/validation/profile";

/** New password + confirmation for an emailed `/auth/set-password` link. */
export function SetPasswordForm({ tokenHash }: { tokenHash: string }) {
  const router = useRouter();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [fieldError, setFieldError] = useState<{ field: SetPasswordField; message: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const matches = password === confirmPassword;
  const canSubmit = PASSWORD_REGEX.test(password) && matches;
  const inputType = visible ? "text" : "password";

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setFieldError(null);
    startTransition(async () => {
      const result = await setPasswordWithTokenAction({ tokenHash, password, confirmPassword });
      if (!result.success) {
        if (result.field) setFieldError({ field: result.field, message: result.error });
        else setMessage(result.error);
        return;
      }
      toast.success("Contraseña creada", "Ya puedes usar tu nueva contraseña.");
      router.replace(result.hasDashboardAccess ? "/dashboard" : "/");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <TextField
        name="password"
        type={inputType}
        value={password}
        onChange={(value) => {
          setPassword(value);
          setFieldError(null);
        }}
        isRequired
        isInvalid={fieldError?.field === "password"}
      >
        <Label>Nueva contraseña</Label>
        <Input type={inputType} autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} spellCheck={false} />
        <PasswordChecklist value={password} />
        <FieldError>{fieldError?.field === "password" ? fieldError.message : null}</FieldError>
      </TextField>

      <TextField
        name="confirmPassword"
        type={inputType}
        value={confirmPassword}
        onChange={(value) => {
          setConfirmPassword(value);
          setFieldError(null);
        }}
        isRequired
        isInvalid={fieldError?.field === "confirmPassword" || (Boolean(confirmPassword) && !matches)}
      >
        <Label>Confirmar contraseña</Label>
        <Input type={inputType} autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} spellCheck={false} />
        <FieldError>
          {fieldError?.field === "confirmPassword"
            ? fieldError.message
            : confirmPassword && !matches
              ? "Las contraseñas no coinciden."
              : null}
        </FieldError>
      </TextField>

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

      <Button type="submit" variant="primary" fullWidth isDisabled={isPending || !canSubmit}>
        {isPending ? "Guardando…" : "Crear contraseña e ingresar"}
      </Button>
    </form>
  );
}
