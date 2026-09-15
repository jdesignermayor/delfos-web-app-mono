"use client";

import { useEffect, useId, useRef, useState } from "react";

export type PickedImage = {
  id: string;
  /** Present for a newly picked file waiting to be uploaded. */
  file?: File;
  /** Display name — the file's name, or the last path segment of an existing URL. */
  name: string;
  previewUrl: string;
  previewFailed: boolean;
};

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".heic", ".heif"];
const ACCEPTED_MIME = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
];

function isAcceptedFile(file: File) {
  if (ACCEPTED_MIME.includes(file.type.toLowerCase())) return true;
  // iPhone HEIC/HEIF files often report an empty or generic MIME type in
  // non-Safari browsers, so fall back to checking the file extension.
  const lower = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function isHeic(file: File) {
  const type = file.type.toLowerCase();
  return type === "image/heic" || type === "image/heif" || /\.hei[cf]$/i.test(file.name);
}

/** Wraps an already-uploaded URL (e.g. from an existing property) as a picked image. */
export function existingImage(url: string): PickedImage {
  return {
    id: url,
    name: url.split("/").pop() || "imagen",
    previewUrl: url,
    previewFailed: false,
  };
}

/**
 * Reusable multi-photo picker: newly picked files stay in memory (no upload)
 * until the caller does something with them, with an instant object-URL
 * preview grid and a remove control per photo. Can also be seeded with
 * already-uploaded images (via `existingImage`) for editing an existing
 * record — those have no `file` and are never re-uploaded. Accepts
 * JPG/JPEG/PNG plus iPhone HEIC/HEIF. HEIC previews may not render in
 * browsers that can't decode HEIC (only Safari reliably can) — those
 * thumbnails fall back to a labeled placeholder.
 */
export function MultiImagePicker({
  images,
  onChange,
  label = "Fotos",
  hint = "JPG, PNG o HEIC (fotos de iPhone). Puedes seleccionar varias a la vez.",
  maxFiles,
  required,
}: {
  images: PickedImage[];
  onChange: (images: PickedImage[]) => void;
  label?: string;
  hint?: string;
  /** When set, hides the add control once this many photos are selected. */
  maxFiles?: number;
  required?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const imagesRef = useRef(images);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // Revoke every object URL still held when the picker unmounts.
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => {
        if (img.previewUrl.startsWith("blob:")) URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, []);

  const atLimit = typeof maxFiles === "number" && images.length >= maxFiles;

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;

    const accepted: PickedImage[] = [];
    const rejected: string[] = [];
    const remainingSlots =
      typeof maxFiles === "number" ? Math.max(maxFiles - images.length, 0) : Infinity;

    Array.from(fileList).forEach((file) => {
      if (!isAcceptedFile(file)) {
        rejected.push(file.name);
        return;
      }
      if (accepted.length >= remainingSlots) return;
      accepted.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        previewFailed: isHeic(file) && typeof navigator !== "undefined" && !/safari/i.test(navigator.userAgent),
      });
    });

    setError(
      rejected.length > 0
        ? `Formato no admitido (usa JPG, PNG o HEIC): ${rejected.join(", ")}`
        : null,
    );
    if (accepted.length > 0) onChange([...images, ...accepted]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeImage(id: string) {
    const target = images.find((img) => img.id === id);
    if (target?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(target.previewUrl);
    onChange(images.filter((img) => img.id !== id));
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>

      {!atLimit ? (
        <>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            multiple={maxFiles !== 1}
            accept=".jpg,.jpeg,.png,.heic,.heif,image/jpeg,image/png,image/heic,image/heif"
            onChange={(e) => handleFiles(e.target.files)}
            className="sr-only"
          />
          <label
            htmlFor={inputId}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-separator px-4 py-2.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
          >
            + Añadir {maxFiles === 1 ? "imagen" : "fotos"}
          </label>
          <p className="mt-1 text-xs text-muted">{hint}</p>
        </>
      ) : null}

      {error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {images.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-separator bg-surface-secondary"
            >
              {img.previewFailed ? (
                <div className="flex size-full flex-col items-center justify-center gap-1 p-2 text-center">
                  <span className="text-xs font-semibold text-muted">HEIC</span>
                  <span className="w-full truncate text-[11px] text-muted">{img.name}</span>
                </div>
              ) : (
                <img
                  src={img.previewUrl}
                  alt={img.name}
                  className="size-full object-cover"
                  onError={() =>
                    onChange(
                      images.map((i) =>
                        i.id === img.id ? { ...i, previewFailed: true } : i,
                      ),
                    )
                  }
                />
              )}
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                aria-label={`Eliminar ${img.name}`}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
