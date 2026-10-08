import type { ReactNode } from "react";

import type { BrandColors } from "@/lib/brand-colors";
import { brandThemeStyle } from "@/lib/brand-theme";

/**
 * Light leak on the left side of the page in the project's colors: a wide
 * radial glow plus a long diagonal streak that sweeps in when the page opens.
 * It sits below the header (the mask fades it in from the top, so it never
 * gets cut by the sticky navbar) and fades out toward the content.
 *
 * Gradients only — no `filter: blur` — and a one-off entrance animation on
 * opacity/transform (see globals.css), so it costs nothing once it has settled.
 */
function BrandGlow() {
  return (
    <div
      aria-hidden="true"
      className="brand-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1200px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_60%,transparent)]"
    >
      <div className="brand-glow-layer absolute inset-0 bg-[radial-gradient(60%_42%_at_4%_22%,color-mix(in_oklab,var(--brand-primary)_60%,transparent),transparent_72%)]" />
      <div className="brand-glow-layer absolute inset-0 bg-[radial-gradient(40%_32%_at_14%_48%,color-mix(in_oklab,var(--brand-tertiary)_35%,transparent),transparent_70%)]" />
      <div className="brand-glow-streak absolute -left-[10%] top-[6%] h-80 w-[80%] bg-[radial-gradient(50%_50%_at_50%_50%,color-mix(in_oklab,var(--brand-primary)_65%,transparent),color-mix(in_oklab,var(--brand-tertiary)_30%,transparent)_45%,transparent_72%)]" />
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
