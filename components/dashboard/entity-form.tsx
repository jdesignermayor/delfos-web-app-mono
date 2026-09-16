"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, TextArea, TextField } from "@heroui/react";

import { updateEntity, createEntity, type Entity, type EntityType } from "@/app/actions/entities";

type EntityFormProps = {
  type: EntityType;
  entity?: Entity;
  isEdit?: boolean;
  backHref: string;
  fields: Array<{
    name: keyof Entity;
    label: string;
    type?: "text" | "email" | "phone" | "textarea";
    required?: boolean;
  }>;
};

export function EntityForm({
  type,
  entity,
  isEdit = false,
  backHref,
  fields,
}: EntityFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData(e.currentTarget);
      const data: Partial<Entity> = {};

      fields.forEach(({ name }) => {
        const value = formData.get(name as string);
        if (value) data[name] = String(value);
      });

      const result = isEdit && entity?.id
        ? await updateEntity(type, entity.id, data)
        : await createEntity(type, data as Entity);

      if (result.success) {
        router.push(backHref);
      } else {
        console.error("Error:", result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ name, label, type: fieldType = "text", required }) => {
          const defaultValue = entity?.[name as keyof Entity] || "";

          if (fieldType === "textarea") {
            return (
              <TextField key={name} className="sm:col-span-2" isRequired={required}>
                <Label>{label}</Label>
                <TextArea
                  name={name as string}
                  defaultValue={String(defaultValue)}
                />
              </TextField>
            );
          }

          return (
            <TextField key={name} type={fieldType} isRequired={required}>
              <Label>{label}</Label>
              <Input
                name={name as string}
                type={fieldType}
                defaultValue={String(defaultValue)}
                placeholder={label}
              />
            </TextField>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onPress={() => router.push(backHref)}
          isDisabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isDisabled={isPending}>
          {isPending ? "Guardando…" : isEdit ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
