import Link from "next/link";
import { Pencil } from "lucide-react";
import { buttonVariants } from "@heroui/react";

/** Square corners for the dashboard's icon action buttons (edit / delete). */
export const SHARP_BUTTON_CLASS = "rounded-none";

/** A list row's action buttons, right-aligned. */
export function RowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-end gap-1">{children}</div>;
}

/** Sharp, icon-only "Editar" link for a list row. */
export function EditIconLink({ href, itemName }: { href: string; itemName: string }) {
  return (
    <Link
      href={href}
      aria-label={`Editar ${itemName}`}
      title="Editar"
      className={`${buttonVariants({ variant: "ghost", size: "sm", isIconOnly: true })} ${SHARP_BUTTON_CLASS}`}
    >
      <Pencil className="size-4" aria-hidden />
    </Link>
  );
}
