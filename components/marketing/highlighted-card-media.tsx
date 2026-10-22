"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { CardSlideshow } from "@/components/marketing/card-slideshow";
import {
  VideoInterestPanel,
  VideoPauseTarget,
  type VideoInterruption,
} from "@/components/marketing/video-interest-panel";
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
 * its photos carry on like any other card's. Hovering the card pins the turn to it. Losing the
 * turn mid-video (another card hovered, or the card scrolled away) only pauses it: the card stays
 * on the video, and it carries on from that point when the turn comes back.
 * Clicking the video pauses it rather than opening the project, and the card then asks whether to
 * open it or carry on — as it does when the video ends while the visitor is watching (hovering).
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
  const [interruption, setInterruption] = useState<VideoInterruption | null>(null);
  // Whether the card holds the slideshow turn: the video only plays while it does.
  const [hasTurn, setHasTurn] = useState(false);

  /** Leaves the video for the photos, closing the panel if it's up. */
  function showPhotos() {
    setInterruption(null);
    setPhase("photos");
  }

  /** The first turn plays the video instead of moving to the next photo. */
  function playVideoOnFirstTurn() {
    if (phase !== "photo") return false;
    setPhase("video");
    return true;
  }

  useEffect(() => {
    if (phase !== "video" || !hasTurn || videoStarted || interruption) return;
    const timer = setTimeout(() => setPhase("photos"), START_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [phase, hasTurn, videoStarted, interruption]);

  return (
    <>
      <CardSlideshow
        images={images}
        alt={title}
        sizes={sizes}
        eager={eager}
        onTurnAction={playVideoOnFirstTurn}
        onTurnStartAction={() => setHasTurn(true)}
        // Pauses the video (below) instead of leaving it; the card stays exactly where it was.
        onTurnEndAction={() => setHasTurn(false)}
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
            // Slow fade in; quick fade out once the video is over and the photos take over.
            exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeOut" } }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <BackgroundVideo
              videoId={videoId}
              title={`${title} — video`}
              loop={false}
              paused={interruption !== null || !hasTurn}
              onPlay={() => setVideoStarted(true)}
              // Someone watching gets the choice; an unattended card just carries on with its photos.
              onEnded={() => (hovered ? setInterruption("ended") : setPhase("photos"))}
              // Hovering the card is watching it: with sound, until the pointer leaves.
              soundOn={hovered}
              // Below the heart, clear of the details at the bottom of the card.
              soundToggleClassName="right-3 top-14"
            >
              <VideoPauseTarget onPause={() => setInterruption("paused")} />
            </BackgroundVideo>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {phase === "video" && interruption ? (
        <VideoInterestPanel
          title={title}
          interruption={interruption}
          hasPhotos={images.length > 0}
          onResume={() => setInterruption(null)}
          onShowPhotos={showPhotos}
        />
      ) : null}
    </>
  );
}
