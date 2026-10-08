"use client";

import Link from "next/link";
import { Button, buttonVariants, FieldError, Input, Label, Switch, TextField } from "@heroui/react";

import { useAdminUserForm, type SaveAdminUser } from "@/components/dashboard/users/use-admin-user-form";
import type { DeveloperOption } from "@/lib/data/developer-options";
import {
  EMPTY_ADMIN_USER_FORM,
  MIN_PASSWORD_LENGTH,
  type AdminUserFormMode,
  type AdminUserFormValues,
} from "@/lib/validation/admin-user";

type TextFieldName = "name" | "email" | "phone" | "password";

type TextFieldConfig = {
  name: TextFieldName;
  label: string;
  type: "text" | "email" | "tel" | "password";
  required: boolean;
  autoComplete: string;
  description?: string;
};

function textFields(mode: AdminUserFormMode): TextFieldConfig[] {
  const isCreate = mode === "create";
  return [
    { name: "name", label: "Nombre completo", type: "text", required: true, autoComplete: "name" },
    { name: "email", label: "Correo", type: "email", required: true, autoComplete: "off" },
    { name: "phone", label: "Teléfono", type: "tel", required: false, autoComplete: "off" },
    {
      name: "password",
      label: isCreate ? "Contraseña temporal" : "Nueva contraseña",
      type: "password",
      required: isCreate,
      autoComplete: "new-password",
      description: isCreate
        ? `Mínimo ${MIN_PASSWORD_LENGTH} caracteres. Además le enviaremos un correo para que cree su propia contraseña.`
        : `Déjala vacía para conservar la actual. Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`,
    },
  ];
}

const COPY: Record<AdminUserFormMode, { submit: string; pending: string; success: string }> = {
  create: { submit: "Crear usuario", pending: "Creando…", success: "Usuario creado" },
  update: { submit: "Guardar cambios", pending: "Guardando…", success: "Usuario actualizado" },
};

const selectClassName =
  "h-10 w-full rounded-lg border border-separator bg-surface px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-focus/30 aria-invalid:border-danger";

function UserTextField({
  config,
  value,
  error,
  onChange,
}: {
  config: TextFieldConfig;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextField
      name={config.name}
      type={config.type}
      value={value}
      onChange={onChange}
      isRequired={config.required}
      isInvalid={Boolean(error)}
    >
      <Label>{config.label}</Label>
      <Input type={config.type} autoComplete={config.autoComplete} />
      {config.description && !error ? <p className="text-xs text-muted">{config.description}</p> : null}
      <FieldError>{error}</FieldError>
    </TextField>
  );
}

function DeveloperSelect({
  developers,
  value,
  error,
  onChange,
}: {
  developers: DeveloperOption[];
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="sm:col-span-2">
      <label htmlFor="developerId" className="mb-1.5 block text-sm font-medium">
        Constructora <span className="text-danger">*</span>
      </label>
      <select
        id="developerId"
        name="developerId"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "developerId-error" : undefined}
        className={selectClassName}
      >
        <option value="" disabled>
          Selecciona una constructora
        </option>
        {developers.map((developer) => (
          <option key={developer.id} value={String(developer.id)}>
            {developer.isEnabled ? developer.name : `${developer.name} (deshabilitada)`}
          </option>
        ))}
      </select>
      {error ? (
        <p id="developerId-error" className="mt-1 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ActiveSwitch({ isSelected, onChange }: { isSelected: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="sm:col-span-2">
      <Switch isSelected={isSelected} onChange={onChange}>
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Label className="text-sm">Usuario activo</Label>
        </Switch.Content>
      </Switch>
      <p className="mt-1 text-xs text-muted">
        Un usuario inactivo no puede ingresar, aunque su constructora esté habilitada.
      </p>
    </div>
  );
}

/**
 * Create / edit form for a constructora (role `admin`) account. Fully
 * controlled: submitting calls `saveAction` (a Server Action) without reloading.
 */
export function AdminUserForm({
  mode,
  saveAction,
  developers,
  initialValues = EMPTY_ADMIN_USER_FORM,
}: {
  mode: AdminUserFormMode;
  /** `createAdminUserAction`, or `updateAdminUserAction` bound to the user id. */
  saveAction: SaveAdminUser;
  developers: DeveloperOption[];
  initialValues?: AdminUserFormValues;
}) {
  const copy = COPY[mode];
  const { values, fieldErrors, message, isPending, setField, handleSubmit } = useAdminUserForm({
    initialValues,
    saveAction,
    successMessage: copy.success,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {textFields(mode).map((config) => (
          <UserTextField
            key={config.name}
            config={config}
            value={values[config.name]}
            error={fieldErrors[config.name]}
            onChange={(value) => setField(config.name, value)}
          />
        ))}

        <DeveloperSelect
          developers={developers}
          value={values.developerId}
          error={fieldErrors.developerId}
          onChange={(value) => setField("developerId", value)}
        />

        {mode === "update" ? (
          <ActiveSwitch isSelected={values.isActive} onChange={(value) => setField("isActive", value)} />
        ) : null}
      </div>

      {message ? (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {message}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Link href="/dashboard/users" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
        <Button type="submit" variant="primary" isDisabled={isPending}>
          {isPending ? copy.pending : copy.submit}
        </Button>
      </div>
    </form>
  );
}
