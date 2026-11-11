/** Shared framer-motion props, so dropdowns and header swaps animate the same everywhere. */

/** A panel dropping down from its trigger. */
export const DROPDOWN_MOTION = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: { duration: 0.18, ease: "easeOut" },
} as const;

/**
 * The landing's square panel: wipes down from its top edge as it drops into place (a crisp reveal,
 * not a fade); closes faster than it opens.
 */
export const BRUTAL_DROPDOWN_MOTION = {
  initial: { opacity: 0, y: -6, clipPath: "inset(0 0 100% 0)" },
  animate: {
    opacity: 1,
    y: 0,
    clipPath: "inset(0 0 0% 0)",
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -4,
    clipPath: "inset(0 0 100% 0)",
    transition: { duration: 0.16, ease: [0.7, 0, 0.84, 0] },
  },
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
