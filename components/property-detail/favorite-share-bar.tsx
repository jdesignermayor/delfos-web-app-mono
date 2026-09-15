"use client";

import { useState } from "react";

import { HeartIcon } from "@/components/icons/animated/heart";
import { SendIcon } from "@/components/icons/animated/send";

/** Top action row: share + save on the left, the listing name on the right. */
export function FavoriteShareBar({ title }: { title: string }) {
  const [saved, setSaved] = useState(false);

  async function handleShare() {
    if (typeof navigator === "undefined") return;
    if (navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
      } catch {
        // The user dismissed the native share sheet — nothing to do.
      }
      return;
    }
    await navigator.clipboard?.writeText(window.location.href);
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-full border border-separator px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"
        >
          <SendIcon size={18} />
          Compartir
        </button>

        <button
          type="button"
          onClick={() => setSaved((value) => !value)}
          aria-pressed={saved}
          className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
            saved
              ? "border-danger text-danger"
              : "border-separator text-foreground hover:bg-surface-secondary"
          }`}
        >
          <HeartIcon size={18} filled={saved} />
          {saved ? "Guardado" : "Guardar"}
        </button>
      </div>

      <h1 className="truncate text-right font-display text-base font-semibold text-foreground sm:text-lg">
        {title}
      </h1>
    </div>
  );
}
