"use client";

import { motion } from "framer-motion";
import { Pause } from "lucide-react";

/** Why a card's video stopped: the visitor clicked it, or it played to the end. */
export type VideoInterruption = "paused" | "ended";

/** Stops a click on a control from also following the card's link. */
export function keepOnCard(event: React.MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * Click target over a card's playing video (pass it as `BackgroundVideo`'s children): a click
 * pauses the video instead of following the card's link. Swipes still scroll, and the card's
 * details, drawn above it, still open the project. Pointers that hover see a pause hint.
 */
export function VideoPauseTarget({ onPause }: { onPause: () => void }) {
  return (
    <button
      type="button"
      aria-label="Pausar video"
      onClick={(event) => {
        keepOnCard(event);
        onPause();
      }}
      className="group/pause absolute inset-0 cursor-pointer"
    >
      {/* Dead centre, right over the play/pause icon YouTube may draw inside the player (which the
          page can't hide), and opaque enough to cover it, so only one shows. The details' fade
          below lets clicks through, so this never overlaps the link to the project. */}
      <span className="absolute left-1/2 top-1/2 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/75 text-white opacity-0 backdrop-blur-md transition-opacity group-hover/pause:opacity-100">
        <Pause className="size-8 fill-current" />
      </span>
    </button>
  );
}

/**
 * Covers the whole card in the brand colour once its video stops, so a click never jumps to the
 * project unexpectedly: the visitor picks between opening it and carrying on.
 */
export function VideoInterestPanel({
  title,
  interruption,
  hasPhotos,
  onResume,
  onShowPhotos,
}: {
  title: string;
  interruption: VideoInterruption;
  hasPhotos: boolean;
  onResume: () => void;
  onShowPhotos: () => void;
}) {
  const secondary =
    interruption === "paused"
      ? { label: "Seguir viendo", run: onResume }
      : hasPhotos
        ? { label: "Ver fotos", run: onShowPhotos }
        : { label: "Ver de nuevo", run: onResume };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute inset-0 z-20 flex cursor-default flex-col items-center justify-center gap-5 bg-accent/95 px-6 text-center text-accent-foreground backdrop-blur-sm"
    >
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium opacity-85">¿Te interesa este proyecto?</p>
        <p className="font-display text-2xl font-semibold leading-tight">{title}</p>
      </div>
      <div className="flex w-full max-w-60 flex-col gap-2.5">
        {/* No preventDefault: the click reaches the card's link, which opens the project (and tracks it). */}
        <button
          type="button"
          className="cursor-pointer rounded-full bg-white px-6 py-3 text-base font-semibold text-accent shadow-lg transition-transform active:scale-[0.97]"
        >
          Ver proyecto
        </button>
        <button
          type="button"
          onClick={(event) => {
            keepOnCard(event);
            secondary.run();
          }}
          className="cursor-pointer rounded-full border border-white/60 px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-white/15 active:bg-white/15"
        >
          {secondary.label}
        </button>
      </div>
    </motion.div>
  );
}
