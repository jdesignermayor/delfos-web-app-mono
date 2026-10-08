import type { ComponentType, ReactNode } from "react";
import { Check } from "lucide-react";

export type StepState = "done" | "current" | "upcoming";

/**
 * Matte palette for the onboarding: ink (the theme's foreground) for what
 * needs attention, hairline borders, and matte green for completed steps —
 * text, solid fill, the card's soft tint and the rail line.
 */
const GREEN_TEXT = "text-[#3f6b4a] dark:text-[#8fb89a]";
const GREEN_SOLID = "bg-[#4a7c59] text-white dark:bg-[#5e8f6c]";
const GREEN_CARD = "border-[#4a7c59]/30 bg-[#4a7c59]/[0.05] dark:border-[#8fb89a]/30 dark:bg-[#8fb89a]/[0.06]";
const GREEN_LINE = "bg-[#4a7c59]/40 dark:bg-[#8fb89a]/40";

/** Ink button — the one action to take next. */
export const PRIMARY_ACTION =
  "inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50";
/** Quiet bordered button for secondary actions. */
export const SECONDARY_ACTION =
  "inline-flex h-9 items-center gap-2 rounded-lg border border-separator px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary disabled:opacity-50";

const STATUS: Record<StepState, { label: string; className: string }> = {
  done: { label: "Completado", className: GREEN_TEXT },
  current: { label: "En curso", className: "text-foreground" },
  upcoming: { label: "Pendiente", className: "text-muted" },
};

/** A check / empty-circle item inside a step ("Nombre", "Teléfono"…). */
export function StepCheck({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className={`inline-flex items-center gap-2 text-sm ${ok ? `font-medium ${GREEN_TEXT}` : "text-muted"}`}>
      <span
        className={`flex size-4 items-center justify-center rounded-full ${ok ? GREEN_SOLID : "border border-separator"}`}
      >
        {ok ? <Check className="size-2.5" strokeWidth={3} /> : null}
      </span>
      {children}
    </li>
  );
}

/**
 * One step of the onboarding timeline: an icon on a thin rail (a check once
 * done) and a flat card with the title, description, details and action.
 */
export function OnboardingStep({
  number,
  icon: Icon,
  title,
  description,
  state,
  isLast = false,
  children,
  action,
}: {
  number: number;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  state: StepState;
  isLast?: boolean;
  /** Details shown under the description (checklists, counts…). */
  children?: ReactNode;
  /** Call to action, hidden once the step is done. */
  action?: ReactNode;
}) {
  const status = STATUS[state];

  return (
    <li className="relative flex gap-5">
      {/* Rail: icon + hairline connector to the next step. */}
      <div className="flex flex-col items-center">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
            state === "done"
              ? GREEN_SOLID
              : state === "current"
                ? "bg-foreground text-background"
                : "border border-separator text-muted"
          }`}
        >
          {state === "done" ? (
            <Check className="size-4" strokeWidth={2.5} />
          ) : (
            <Icon className="size-[18px]" strokeWidth={1.75} />
          )}
        </div>
        {!isLast ? <div className={`my-2 w-px flex-1 ${state === "done" ? GREEN_LINE : "bg-separator"}`} /> : null}
      </div>

      <div
        className={`mb-5 flex-1 rounded-xl border p-5 ${
          state === "done"
            ? GREEN_CARD
            : state === "current"
              ? "border-foreground/20 bg-surface"
              : "border-separator bg-transparent"
        }`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs text-muted">Paso {number}</p>
          <p className={`text-xs font-medium ${status.className}`}>{status.label}</p>
        </div>
        <h2
          className={`mt-1 text-base font-semibold tracking-tight ${state === "upcoming" ? "text-muted" : "text-foreground"}`}
        >
          {title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>

        {children ? <div className="mt-4">{children}</div> : null}
        {action && state !== "done" ? <div className="mt-5 flex flex-wrap gap-2">{action}</div> : null}
      </div>
    </li>
  );
}
