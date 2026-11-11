/**
 * Class recipes for the landing's brutalist design system (tokens live in app/globals.css).
 * Sections compose these instead of inventing one-off styles, so borders, shadows, actions and
 * spacing stay identical everywhere.
 */

/** Flat color blocks. Every one carries ink (near-black) text, all ≥ 9:1 contrast. */
export type Block = "yellow" | "blue" | "pink" | "mint";

export const BLOCK: Record<Block, string> = {
  yellow: "bg-brut-yellow",
  blue: "bg-brut-blue",
  pink: "bg-brut-pink",
  mint: "bg-brut-mint",
};

/** The fine ink rule used on every box. */
export const BORDER = "border-[1.5px] border-ink";

/** Section rhythm: tighter on phones (64px) than desktop (96px). */
export const SECTION = "mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24";

/** Keyboard focus: a clear ink outline, offset so it never merges with the border. */
export const FOCUS = "outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";

/**
 * Tactile press for anything clickable: lifts a pixel on hover (slightly longer shadow) and sinks
 * into its shadow on press, with a smooth ease rather than a snap; off with reduced motion.
 */
export const PRESSABLE =
  "cursor-pointer transition-[translate,box-shadow] duration-200 ease-out hover:-translate-x-px hover:-translate-y-px hover:shadow-brut-lg active:translate-x-[3px] active:translate-y-[3px] active:shadow-none active:duration-75 motion-reduce:transition-none motion-reduce:hover:translate-none motion-reduce:active:translate-none";

/** Box: white, ink border, hard shadow. */
export const BOX = `${BORDER} bg-white shadow-brut`;

const BUTTON = `inline-flex min-h-12 w-full items-center justify-center gap-2 px-6 text-base font-semibold sm:w-auto ${BORDER} shadow-brut ${PRESSABLE} ${FOCUS}`;

/** Primary action: yellow block, ink label. */
export const BTN_PRIMARY = `${BUTTON} bg-brut-yellow text-ink`;
/** Primary action on a yellow surface: ink block, white label. */
export const BTN_INK = `${BUTTON} bg-ink text-white`;
/** Secondary action: white block. */
export const BTN_SECONDARY = `${BUTTON} bg-white text-ink`;
