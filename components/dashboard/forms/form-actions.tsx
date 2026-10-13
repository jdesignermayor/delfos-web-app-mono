import Link from "next/link";
import { Button, buttonVariants } from "@heroui/react";

/** A form's footer: the server's form-level error, then Cancelar / submit. */
export function FormActions({
  cancelHref,
  serverMessage,
  isSaving,
  isDirty,
  submitLabel = "Guardar cambios",
  pendingLabel = "Guardando…",
}: {
  cancelHref: string;
  serverMessage?: string;
  isSaving: boolean;
  /** Submit stays disabled until something changes. */
  isDirty: boolean;
  submitLabel?: string;
  pendingLabel?: string;
}) {
  return (
    <>
      {serverMessage ? (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {serverMessage}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
        <Button type="submit" variant="primary" isDisabled={isSaving || !isDirty}>
          {isSaving ? pendingLabel : submitLabel}
        </Button>
      </div>
    </>
  );
}
