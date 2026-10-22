"use client";

import { useEffect, useRef, type ComponentType, type RefAttributes } from "react";
import { Slider } from "@heroui/react";
import { TrendingDownIcon, TrendingUpIcon, type TrendingUpIconHandle } from "lucide-animated";

import { BUDGET_RANGE, type BudgetRange } from "@/components/marketing/properties";
import { PanelHeader } from "@/components/marketing/search-option-ui";

/** "$350M", or "$1.000M+" at the top of the slider, where there's no upper limit. */
function formatEnd(value: number) {
  const label = `$${value.toLocaleString("es-CO")}M`;
  return value >= BUDGET_RANGE.max ? `${label}+` : label;
}

type AnimatedIcon = ComponentType<{ size?: number } & RefAttributes<TrendingUpIconHandle>>;

/** One end of the range, big and readable above the slider; its icon plays whenever the value moves. */
function RangeValue({ label, value, icon: Icon }: { label: string; value: number; icon: AnimatedIcon }) {
  const iconRef = useRef<TrendingUpIconHandle>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    iconRef.current?.startAnimation();
  }, [value]);

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
  return (
    <>
      <PanelHeader title="Presupuesto" hint={hint} />

      <div className="mb-6 flex items-center gap-2 sm:gap-3">
        <RangeValue label="Mínimo" value={value.min} icon={TrendingDownIcon} />
        <span aria-hidden="true" className="h-px w-3 shrink-0 bg-separator sm:w-4" />
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
        {/* Thick, fully rounded track; the white thumbs ringed in the brand blue are easy to grab. */}
        <Slider.Track className="h-3 rounded-full bg-accent-soft">
          {({ state }) => (
            <>
              <Slider.Fill className="rounded-full bg-accent" />
              {state.values.map((_, index) => (
                <Slider.Thumb
                  key={index}
                  index={index}
                  aria-label={index === 0 ? "Precio mínimo" : "Precio máximo"}
                  className="size-8 rounded-full border-[3px] border-accent bg-white shadow-[0_4px_14px_-2px_rgba(11,132,255,0.45)] transition-transform after:hidden hover:scale-110 data-[dragging=true]:scale-110"
                />
              ))}
            </>
          )}
        </Slider.Track>
      </Slider>

      <div className="mt-3 flex justify-between text-xs font-medium text-muted">
        <span>{formatEnd(BUDGET_RANGE.min)}</span>
        <span>{formatEnd(BUDGET_RANGE.max)}</span>
      </div>
    </>
  );
}
