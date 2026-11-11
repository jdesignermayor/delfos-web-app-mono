"use client";

import type { ComponentType } from "react";
import { Check } from "lucide-react";

import { SEARCH_BRUTAL, useBrutalSearch } from "@/components/marketing/search-style";

export type Tone = "slate" | "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet" | "teal";

export type LucideIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

/** Matte tinted tiles: a soft fill with a deeper icon colour of the same hue, no gradients. */
const TONES: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-600",
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
  violet: "bg-violet-50 text-violet-600",
  teal: "bg-teal-50 text-teal-600",
};

export function PanelHeader({ title, hint }: { title: string; hint?: string }) {
  const brutal = useBrutalSearch();
  if (brutal) {
    // Plain title and a quiet hint; no rule, no caps.
    return (
      <div className="mb-5">
        <p className="text-xl font-semibold tracking-tight text-ink">{title}</p>
        {hint ? <p className="mt-1 text-base text-ink/60">{hint}</p> : null}
      </div>
    );
  }
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function IconTile({
  icon: Icon,
  tone,
  size = "md",
  selected = false,
}: {
  icon: LucideIcon;
  tone: Tone;
  size?: "sm" | "md";
  selected?: boolean;
}) {
  const brutal = useBrutalSearch();
  const small = size === "sm";
  if (brutal) {
    // One quiet square tile for every option (no rainbow tones); ink when selected.
    return (
      <span
        className={`flex shrink-0 items-center justify-center transition-colors ${
          selected ? "bg-ink text-white" : "bg-delfos-mist text-ink"
        } ${small ? "size-5" : "size-9"}`}
      >
        <Icon className={small ? "size-3" : "size-[18px]"} strokeWidth={1.75} />
      </span>
    );
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${TONES[tone]} ${
        small ? "size-6 rounded-lg" : "size-10 rounded-xl"
      }`}
    >
      <Icon className={small ? "size-3.5" : "size-5"} strokeWidth={1.75} />
    </span>
  );
}

type SelectableProps = {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  selected: boolean;
  onClick: () => void;
};

/** A selectable option: coloured icon tile, label and optional hint, with a check when selected. */
export function OptionCard({ icon, tone, label, hint, selected, onClick }: SelectableProps & { hint?: string }) {
  const brutal = useBrutalSearch();
  if (brutal) {
    // Text only: a hairline square that flips to solid ink when selected, with a small check that
    // pops in; presses sink a little, a fresh pick gives a short springy pop.
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={`${SEARCH_BRUTAL.press} flex min-h-[4.5rem] items-center gap-3 border-[1.5px] px-5 py-3.5 text-left ${SEARCH_BRUTAL.focus} ${
          selected ? "border-ink bg-ink text-white" : "border-ink/20 bg-white text-ink hover:border-ink hover:bg-ink/[0.03]"
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-semibold">{label}</span>
          {hint ? (
            <span className={`mt-0.5 block truncate text-[15px] ${selected ? "text-white/70" : "text-ink/60"}`}>{hint}</span>
          ) : null}
        </span>
        {selected ? <Check aria-hidden="true" className="check-in size-5 shrink-0" strokeWidth={3} /> : null}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
        selected ? "border-foreground bg-surface-secondary/50" : "border-separator hover:border-foreground/30 hover:bg-surface-secondary/40"
      }`}
    >
      <IconTile icon={icon} tone={tone} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{label}</span>
        {hint ? <span className="block truncate text-xs text-muted">{hint}</span> : null}
      </span>
      {selected ? (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}

/** Small pill with a coloured icon, for the location shortcuts. */
export function PlaceChip({ icon, tone, label, selected, onClick }: SelectableProps) {
  const brutal = useBrutalSearch();
  if (brutal) {
    // Text-only square chip with a hairline frame; selected flips to solid ink.
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={`${SEARCH_BRUTAL.press} inline-flex min-h-12 items-center gap-2 border-[1.5px] px-5 py-2 text-base font-medium ${SEARCH_BRUTAL.focus} ${
          selected ? "border-ink bg-ink text-white" : "border-ink/20 bg-white text-ink hover:border-ink hover:bg-ink/[0.03]"
        }`}
      >
        {selected ? <Check aria-hidden="true" className="check-in size-4 shrink-0" strokeWidth={3} /> : null}
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-medium transition-colors ${
        selected ? "border-foreground bg-surface-secondary/50 text-foreground" : "border-separator text-foreground/80 hover:border-foreground/30 hover:text-foreground"
      }`}
    >
      <IconTile icon={icon} tone={tone} size="sm" />
      {label}
    </button>
  );
}
