/** Shared framer-motion props, so dropdowns and header swaps animate the same everywhere. */

/** A panel dropping down from its trigger. */
export const DROPDOWN_MOTION = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: { duration: 0.18, ease: "easeOut" },
} as const;

/** Header content swapping in place (tabs ⇄ compact search). */
export const HEADER_SWAP_MOTION = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2, ease: "easeOut" },
} as const;

export const HEADER_SEARCH_MOTION = {
  ...HEADER_SWAP_MOTION,
  initial: { opacity: 0, y: -6, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.96 },
} as const;
