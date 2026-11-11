"use client";

import { useEffect, useRef, type ComponentType, type RefAttributes } from "react";
import { Slider } from "@heroui/react";
import { TrendingDownIcon, TrendingUpIcon, type TrendingUpIconHandle } from "lucide-animated";

import { BUDGET_RANGE, type BudgetRange } from "@/components/marketing/properties";
import { PanelHeader } from "@/components/marketing/search-option-ui";
import { SEARCH_BRUTAL, useBrutalSearch } from "@/components/marketing/search-style";

/** "$350M", or "$1.000M+" at the top of the slider, where there's no upper limit. */
function formatEnd(value: number) {
  const label = `$${value.toLocaleString("es-CO")}M`;
  return value >= BUDGET_RANGE.max ? `${label}+` : label;
}

type AnimatedIcon = ComponentType<{ size?: number } & RefAttributes<TrendingUpIconHandle>>;

/** One end of the range, big and readable above the slider; its icon plays whenever the value moves. */
function RangeValue({ label, value, icon: Icon }: { label: string; value: number; icon: AnimatedIcon }) {
  const brutal = useBrutalSearch();
  const iconRef = useRef<TrendingUpIconHandle>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    iconRef.current?.startAnimation();
  }, [value]);

  if (brutal) {
    // Square readout, text only: quiet label over a big tabular figure that ticks up into place
    // each time the value changes (remounted by `key`).
    return (
      <div className="flex min-w-0 flex-1 items-center border-[1.5px] border-ink/20 bg-white px-5 py-4 sm:px-6 sm:py-4">
        <span className="min-w-0 overflow-hidden">
          <span className={`block ${SEARCH_BRUTAL.label}`}>{label}</span>
          <span key={value} className="num-tick block truncate text-2xl font-semibold tabular-nums text-ink sm:text-3xl">
            {formatEnd(value)}
          </span>
        </span>
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-separator bg-white px-3 py-2.5 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.15)] sm:px-4 sm:py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent sm:size-10">
        <Icon ref={iconRef} size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-muted">{label}</span>
        <span className="block truncate text-base font-bold tabular-nums text-foreground sm:text-lg">{formatEnd(value)}</span>
      </span>
    </div>
  );
}

/** Two-thumb price range for buying, from $100M to $1.000M+ in steps of $50M. */
export function BudgetRangePanel({
  hint,
  value,
  onChangeAction,
}: {
  hint: string;
  value: BudgetRange;
  onChangeAction: (range: BudgetRange) => void;
}) {
  const brutal = useBrutalSearch();
  return (
    <>
      <PanelHeader title="Presupuesto" hint={hint} />

      <div className="mb-6 flex items-center gap-2 sm:gap-3">
        <RangeValue label="Mínimo" value={value.min} icon={TrendingDownIcon} />
        <span aria-hidden="true" className={`h-px w-3 shrink-0 sm:w-4 ${brutal ? "bg-ink" : "bg-separator"}`} />
        <RangeValue label="Máximo" value={value.max} icon={TrendingUpIcon} />
      </div>

      <Slider
        aria-label="Rango de presupuesto en millones de pesos"
        minValue={BUDGET_RANGE.min}
        maxValue={BUDGET_RANGE.max}
        step={BUDGET_RANGE.step}
        value={[value.min, value.max]}
        onChange={(next) => {
          const [min, max] = Array.isArray(next) ? next : [next, next];
          onChangeAction({ min, max });
        }}
        className="w-full px-1"
      >
        {/* Default: thick, fully rounded track; the white thumbs ringed in the brand blue are easy to grab.
            Brutal: a thin square track (pastel blue, brand-blue fill) with square, solid ink thumbs (a white center mark) so the mouse pointer stands out on them —
            still 32px to grab. */}
        <Slider.Track className={brutal ? "h-1.5 rounded-none bg-ink/10" : "h-3 rounded-full bg-accent-soft"}>
          {({ state }) => (
            <>
              <Slider.Fill className={brutal ? "rounded-none bg-ink" : "rounded-full bg-accent"} />
              {state.values.map((_, index) => (
                <Slider.Thumb
                  key={index}
                  index={index}
                  aria-label={index === 0 ? "Precio mínimo" : "Precio máximo"}
                  className={
                    brutal
                      ? "size-9 cursor-grab rounded-none border-2 border-ink bg-ink shadow-none transition-[background-color,scale,rotate] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] after:hidden before:absolute before:left-1/2 before:top-1/2 before:size-2.5 before:-translate-x-1/2 before:-translate-y-1/2 before:bg-white before:transition-transform before:duration-200 hover:scale-110 hover:before:scale-125 data-[dragging=true]:rotate-45 data-[dragging=true]:scale-90 data-[dragging=true]:cursor-grabbing data-[dragging=true]:before:scale-75 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-offset-2 data-[focus-visible=true]:outline-ink"
                      : "size-8 rounded-full border-[3px] border-accent bg-white shadow-[0_4px_14px_-2px_rgba(11,132,255,0.45)] transition-transform after:hidden hover:scale-110 data-[dragging=true]:scale-110"
                  }
                />
              ))}
            </>
          )}
        </Slider.Track>
      </Slider>

      <div className={`mt-3 flex justify-between ${brutal ? "text-base text-ink/60" : "text-xs font-medium text-muted"}`}>
        <span>{formatEnd(BUDGET_RANGE.min)}</span>
        <span>{formatEnd(BUDGET_RANGE.max)}</span>
      </div>
    </>
  );
}
