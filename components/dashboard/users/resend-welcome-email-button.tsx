"use client";

import { useTransition } from "react";
import { Button } from "@heroui/react";
import { Mail } from "lucide-react";

import { sendAdminWelcomeEmailAction } from "@/app/actions/email";
import { useToast } from "@/components/providers/toast-provider";

/** Sends the welcome email again with a fresh password link (the previous one may have expired). */
export function ResendWelcomeEmailButton({ userId, email }: { userId: string; email: string | null }) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function handlePress() {
    startTransition(async () => {
      const result = await sendAdminWelcomeEmailAction(userId);
      if (result.success) toast.success("Correo enviado", email ? `Enviamos un nuevo enlace a ${email}.` : undefined);
      else toast.error("No se pudo enviar el correo", result.error);
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" isDisabled={isPending} onPress={handlePress}>
      <Mail className="size-4" />
      {isPending ? "Enviando…" : "Reenviar correo de bienvenida"}
    </Button>
  );
}
