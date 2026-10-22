"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { CloseIcon, SearchIcon } from "@/components/icons";
import { BudgetRangePanel } from "@/components/marketing/budget-range-panel";
import { LocationFields } from "@/components/marketing/location-fields";
import { BUDGET_RANGE, budgetRangeLabel, budgetRangeParam, type BudgetRange } from "@/components/marketing/properties";
import { budgetHint } from "@/components/marketing/search-choice-panels";
import { useSearchMode } from "@/components/marketing/search-mode-context";
import { buildSearchHref } from "@/components/marketing/search-url";

const ANY_BUDGET: BudgetRange = { min: BUDGET_RANGE.min, max: BUDGET_RANGE.max };

/** Locks the page behind the full-screen search and closes it with Escape. */
function useFullScreenSheet(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);
}

/**
 * Mobile-only search: a compact pill in the middle of the navbar that opens the location and budget search full screen, on
 * top of everything (including the header). Rendered in a portal: the header's backdrop blur
 * would otherwise trap a `fixed` sheet inside it.
 */
export function MobileLocationButton() {
  const router = useRouter();
  const { mode } = useSearchMode();
  const [open, setOpen] = useState(false);
  const [ubicacion, setUbicacion] = useState("");
  const [budget, setBudget] = useState<BudgetRange>(ANY_BUDGET);
  // The price slider is for buying; rent budgets are monthly and searched from /search.
  const usesBudget = mode !== "arrendar";
  const budgetLabel = usesBudget ? budgetRangeLabel(budget) : "";

  const close = useCallback(() => setOpen(false), []);
  useFullScreenSheet(open, close);

  function search() {
    setOpen(false);
    router.push(
      buildSearchHref({ mode, location: ubicacion, presupuesto: usesBudget ? budgetRangeParam(budget) : undefined }),
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar por ubicación"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-full border border-separator bg-white px-3.5 py-2 text-left text-foreground shadow-[0_2px_10px_-4px_rgba(15,23,42,0.18)]"
      >
        <SearchIcon className="size-4 shrink-0 text-foreground" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{ubicacion || "Buscar barrio o ciudad"}</span>
          {budgetLabel ? <span className="truncate text-[11px] font-semibold text-accent">{budgetLabel}</span> : null}
        </span>
      </button>

      {/* Only rendered after a tap, so `document` is always there. */}
      {open
        ? createPortal(
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Buscar propiedades"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="light fixed inset-0 z-[70] flex flex-col bg-white"
              style={{ colorScheme: "light" }}
            >
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  search();
                }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <header className="flex shrink-0 items-center justify-between gap-4 border-b border-separator px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
                  <h2 className="font-display text-lg font-semibold text-foreground">Buscar propiedades</h2>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Cerrar búsqueda"
                    className="flex size-10 items-center justify-center rounded-full bg-surface-secondary text-foreground transition-colors hover:bg-separator"
                  >
                    <CloseIcon className="size-5" />
                  </button>
                </header>

                {/* Picking a chip or typing only fills the field: the search runs on Enter or "Buscar". */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
                  <LocationFields value={ubicacion} onValueChangeAction={setUbicacion} onPickAction={setUbicacion} />
                  {usesBudget ? (
                    <div className="mt-6 border-t border-separator pt-5">
                      <BudgetRangePanel hint={budgetHint("comprar")} value={budget} onChangeAction={setBudget} />
                    </div>
                  ) : null}
                </div>

                <div className="shrink-0 border-t border-separator px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
                  >
                    <SearchIcon className="size-5" />
                    Buscar
                  </button>
                </div>
              </form>
            </motion.div>,
            document.body,
          )
        : null}
    </>
  );
}
