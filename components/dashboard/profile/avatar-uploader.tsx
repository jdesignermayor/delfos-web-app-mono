"use client";

import { useRef, useState, useTransition } from "react";
import { Avatar, Button } from "@heroui/react";
import { Camera, Trash2 } from "lucide-react";

import { removeAvatarAction, uploadAvatarAction } from "@/app/actions/profile";
import { useToast } from "@/components/providers/toast-provider";
import { initials } from "@/lib/initials";

const ACCEPT = ".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif";
const MAX_BYTES = 10 * 1024 * 1024;

/** Profile photo with upload / remove controls. Uploads as soon as a file is picked. */
export function AvatarUploader({
  avatarUrl,
  name,
  email,
}: {
  avatarUrl: string | null;
  name: string | null;
  email: string | null;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(avatarUrl);
  const [isPending, startTransition] = useTransition();

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file again
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error("Imagen demasiado grande", "El tamaño máximo es 10 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const result = await uploadAvatarAction(formData);
      if (!result.success) {
        toast.error("No se pudo subir la foto", result.error);
        return;
      }
      setUrl(result.url);
      toast.success("Foto de perfil actualizada");
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeAvatarAction();
      if (!result.success) {
        toast.error("No se pudo quitar la foto", result.error);
        return;
      }
      setUrl(null);
      toast.success("Foto de perfil eliminada");
    });
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <Avatar className={`size-24 text-2xl ${isPending ? "opacity-60" : ""}`}>
        {url ? <Avatar.Image src={url} alt={name || "Foto de perfil"} /> : null}
        <Avatar.Fallback color="accent">{initials(name, email)}</Avatar.Fallback>
      </Avatar>

      <div className="flex flex-col items-center gap-2 sm:items-start">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            isDisabled={isPending}
            onPress={() => inputRef.current?.click()}
          >
            <Camera className="size-4" />
            {isPending ? "Procesando…" : url ? "Cambiar foto" : "Subir foto"}
          </Button>
          {url ? (
            <Button type="button" variant="ghost" size="sm" isDisabled={isPending} onPress={handleRemove}>
              <Trash2 className="size-4" />
              Quitar
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted">JPG, PNG, WebP o HEIC. Máximo 10 MB. Se recorta en cuadrado.</p>
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}
