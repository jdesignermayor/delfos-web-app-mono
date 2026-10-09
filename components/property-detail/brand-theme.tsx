import type { ReactNode } from "react";

import type { BrandColors } from "@/lib/brand-colors";
import { brandThemeStyle } from "@/lib/brand-theme";

/**
 * Ambient background in the project's colors: three soft blobs that drift
 * slowly behind the content, on a loop. Fixed pixel sizes inside a capped
 * box, so the glow looks the same on any screen width; the mask fades it in
 * below the header and out toward the content.
 *
 * Gradients only — no `filter: blur` — and the loops animate transform alone
 * (see globals.css), so they stay on the GPU and never repaint the page.
 */
function BrandGlow() {
  return (
    <div
      aria-hidden="true"
      className="brand-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1100px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_55%,transparent)]"
    >
      <div className="relative mx-auto h-full w-full max-w-[1440px]">
        <div className="brand-glow-blob brand-glow-blob-a absolute -left-[220px] top-[40px] size-[720px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand-primary)_26%,transparent),transparent)]" />
        <div className="brand-glow-blob brand-glow-blob-b absolute left-[180px] top-[360px] size-[560px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand-tertiary)_18%,transparent),transparent)]" />
        <div className="brand-glow-blob brand-glow-blob-c absolute -right-[160px] top-[120px] size-[520px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand-primary)_12%,transparent),transparent)]" />
      </div>
    </div>
  );
}

/**
 * Wraps a property page with the project's palette when it has one: sets the
 * --brand-* variables used by the `brand-*` classes and adds the glow. Without
 * colors it renders its children unchanged (Delfos' default look).
 */
export function BrandTheme({ colors, children }: { colors: BrandColors | undefined; children: ReactNode }) {
  const style = brandThemeStyle(colors);
  if (!style) return <>{children}</>;

  return (
    <div data-brand="" style={style} className="relative isolate">
      <BrandGlow />
      {children}
    </div>
  );
}
