"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

import { IMAGE_PLACEHOLDER } from "@/lib/image-placeholder";

/** Dashboard previews only need to be recognizable; must be listed in `images.qualities`. */
const DASHBOARD_IMAGE_QUALITY = 40;

/**
 * Low-quality preview image for the dashboard. Fills its (relatively
 * positioned) parent, shows a shimmer placeholder until the optimized image
 * arrives (Next removes it on load), and falls back to an icon if it fails.
 */
export function DashboardImage({
  src,
  alt,
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  /** Rendered width, e.g. "80px" — lets Next pick the smallest file that fits. */
  sizes: string;
  /** Fetch eagerly (the main photo above the fold); thumbnails stay lazy. */
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="flex size-full items-center justify-center bg-surface-secondary text-muted"
        role="img"
        aria-label={alt || "Imagen no disponible"}
      >
        <ImageOff className="size-5" aria-hidden />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={DASHBOARD_IMAGE_QUALITY}
      priority={priority}
      placeholder={IMAGE_PLACEHOLDER}
      onError={() => setFailed(true)}
      className="object-cover"
    />
  );
}
