"use client";

import { Controller, type Control, type FieldPathByValue, type FieldValues } from "react-hook-form";
import { FieldError, Input, Label, TextArea, TextField } from "@heroui/react";

export type TextFieldConfig<TName extends string = string> = {
  name: TName;
  label: string;
  type: "text" | "email" | "tel" | "textarea";
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
  fullWidth?: boolean;
};

/** A HeroUI text input (or textarea) bound to a React Hook Form string field. */
export function FormTextField<TValues extends FieldValues>({
  config,
  control,
}: {
  config: TextFieldConfig<FieldPathByValue<TValues, string>>;
  control: Control<TValues>;
}) {
  const isTextArea = config.type === "textarea";

  return (
    <Controller
      name={config.name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          name={field.name}
          type={isTextArea ? undefined : config.type}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          isRequired={config.required}
          isInvalid={fieldState.invalid}
          validationBehavior="aria"
          className={config.fullWidth ? "sm:col-span-2" : undefined}
        >
          <Label>{config.label}</Label>
          {isTextArea ? (
            <TextArea ref={field.ref} rows={4} maxLength={config.maxLength} />
          ) : (
            <Input
              ref={field.ref}
              type={config.type}
              autoComplete={config.autoComplete ?? "off"}
              placeholder={config.placeholder}
              maxLength={config.maxLength}
            />
          )}
          <FieldError>{fieldState.error?.message}</FieldError>
        </TextField>
      )}
    />
  );
}
