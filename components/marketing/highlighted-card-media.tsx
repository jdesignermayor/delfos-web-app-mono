"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { CardSlideshow } from "@/components/marketing/card-slideshow";
import { BackgroundVideo } from "@/components/property-detail/gallery-video";

/** A player that hasn't started by then (blocked, embedding disabled…) hands the card back to the photos. */
const START_TIMEOUT_MS = 10_000;

/**
 * "photo": the first photo. "video": the project video, played once and to the end.
 * "photos": the rest of the slideshow, as on any other card.
 */
type Phase = "photo" | "video" | "photos";

/**
 * Media of a "Propiedades destacadas" card whose project has a YouTube video. The card's first
 * turn in the slideshow relay plays the whole video (muted, with a sound toggle) inside the card;
 * it keeps the turn meanwhile, so no other card moves, and hands it on when the video ends. Then
 * its photos carry on like any other card's. Hovering the card pins the turn to it; losing the
 * turn mid-video (another card hovered) stops the video, to be played in full next time.
 */
export function HighlightedCardMedia({
  images,
  videoId,
  title,
  sizes,
  eager,
  hovered,
}: {
  images: string[];
  videoId: string;
  title: string;
  sizes: string;
  eager: boolean;
  /** The pointer is over the card: it alone plays. */
  hovered: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("photo");
  const [videoStarted, setVideoStarted] = useState(false);

  /** The first turn plays the video instead of moving to the next photo. */
  function playVideoOnFirstTurn() {
    if (phase !== "photo") return false;
    setPhase("video");
    return true;
  }

  useEffect(() => {
    if (phase !== "video" || videoStarted) return;
    const timer = setTimeout(() => setPhase("photos"), START_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [phase, videoStarted]);

  return (
    <>
      <CardSlideshow
        images={images}
        alt={title}
        sizes={sizes}
        eager={eager}
        onTurnAction={playVideoOnFirstTurn}
        onTurnEndAction={() => {
          if (phase === "video") setPhase("photo");
        }}
        fitLandscape
        paused={phase === "video"}
        pinned={hovered}
      />
      <AnimatePresence>
        {phase === "video" ? (
          <motion.div
            key="video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            // Slow fade in; quick fade out, so a card losing its turn doesn't overlap the next one.
            exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeOut" } }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <BackgroundVideo
              videoId={videoId}
              title={`${title} — video`}
              loop={false}
              onPlay={() => setVideoStarted(true)}
              onEnded={() => setPhase("photos")}
              // Below the heart, clear of the details at the bottom of the card.
              soundToggleClassName="right-3 top-14"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
