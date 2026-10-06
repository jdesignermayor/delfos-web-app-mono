"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copies the sales sentence so it can be pasted into a deck or a message to a constructora. */
export function CopyPitchButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure origin or denied permission); the text is still selectable.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-colors hover:text-accent-hover"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      <span aria-live="polite">{copied ? "Copiado" : "Copiar texto"}</span>
    </button>
  );
}
