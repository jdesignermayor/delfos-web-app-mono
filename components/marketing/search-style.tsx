"use client";

import { createContext, useContext } from "react";

/**
 * Which look the search UI takes. "brutal" is the landing's minimal brutalism (square corners, thin
 * ink lines, mono labels, Delfos pastel blue for active states); everywhere else stays "default".
 * Provided once by the search container (`PropertySearch`, the phone search sheet), read by every
 * piece inside it (segments, option cards, place chips, location input, budget range), so the
 * shared pieces don't need a prop threaded through each level.
 */
const SearchStyleContext = createContext(false);

export const SearchStyleProvider = SearchStyleContext.Provider;

/** True inside a brutalist search (see `SearchStyleProvider`). */
export function useBrutalSearch() {
  return useContext(SearchStyleContext);
}

/** Shared brutalist recipes for the search pieces. */
export const SEARCH_BRUTAL = {
  /** Quiet sans label (segment labels, group titles, readout labels): small but readable. */
  label: "text-sm font-semibold text-ink/70",
  /**
   * Satisfying controls: colors ease over 200ms, a press sinks the control a touch (fast), and a
   * fresh pick pops once (`pop-on-select`, globals.css). Panels' children cascade in (`stagger-in`).
   */
  press:
    "pop-on-select transition-[background-color,border-color,color,scale] duration-200 ease-out active:scale-[0.96] active:duration-75 motion-reduce:active:scale-100",
  /** Thin ink frame, square, flat. */
  frame: "border-[1.5px] border-ink bg-white",
  /** Keyboard focus. */
  focus: "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
} as const;
