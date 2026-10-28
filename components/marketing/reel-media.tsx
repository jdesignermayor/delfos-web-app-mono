"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import { FittedPhoto } from "@/components/marketing/fitted-photo";
import {
  VideoInterestPanel,
  VideoPauseTarget,
  type VideoInterruption,
} from "@/components/marketing/video-interest-panel";
import { BackgroundVideo, VideoPoster } from "@/components/property-detail/gallery-video";

/** How long a photo stays before the reel slides to the next one. */
const PHOTO_MS = 4000;
/** A player that hasn't started by then (blocked, embedding disabled…) is skipped. */
const VIDEO_START_TIMEOUT_MS = 10_000;

/**
 * "active": the reel on screen — it plays and moves on by itself. "preload": its neighbours — their
 * video player loads and buffers, paused, so it starts at once when swiped in. "idle": everything else — only
 * its first slide is drawn, nothing loads or runs.
 */
export type ReelMode = "active" | "preload" | "idle";

type Slide = { kind: "photo"; src: string } | { kind: "video" };

/** The video first, when there is one, then the photos. */
function buildSlides(images: string[], videoId: string | undefined): Slide[] {
  const photos = images.map((src): Slide => ({ kind: "photo", src }));
  return videoId ? [{ kind: "video" }, ...photos] : photos;
}

/**
 * Instagram-style media of a phone reel: the project video (first) and the photos side by side,
 * swiped left and right. The active reel also moves on by itself — each photo for a few seconds,
 * and back to the start after the last item. Tapping the video pauses it rather than opening the
 * project, and when it's paused or ends the card asks whether to open the project or carry on.
 * Leaving the reel pauses it where it was — same slide, same point of the video (see
 * `BackgroundVideo`) — and coming back carries on from there; nothing starts over.
 */
export function ReelMedia({
  images,
  videoId,
  title,
  sizes,
  eager,
  mode,
}: {
  images: string[];
  videoId?: string;
  title: string;
  sizes: string;
  eager: boolean;
  mode: ReelMode;
}) {
  const slides = useMemo(() => buildSlides(images, videoId), [images, videoId]);
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [videoStarted, setVideoStarted] = useState(false);
  const [interruption, setInterruption] = useState<VideoInterruption | null>(null);
  const active = mode === "active";
  const onVideo = slides[current]?.kind === "video";

  function goTo(index: number, behavior: ScrollBehavior = "smooth") {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: (index % slides.length) * track.clientWidth, behavior });
  }

  function trackCurrentSlide() {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index === current) return;
    setCurrent(index);
    setVideoStarted(false);
    setInterruption(null);
  }

  const next = useEffectEvent(() => goTo(current + 1));

  // Moves on by itself only while active and not waiting on the visitor: past a video that never
  // started, and each photo after a pause. A swipe changes `current` and restarts the wait.
  useEffect(() => {
    if (!active || interruption || slides.length < 2) return;
    if (onVideo && videoStarted) return;
    const timer = setTimeout(next, onVideo ? VIDEO_START_TIMEOUT_MS : PHOTO_MS);
    return () => clearTimeout(timer);
  }, [active, interruption, current, onVideo, videoStarted, slides.length]);

  return (
    <div className="absolute inset-0">
      <div
        ref={trackRef}
        onScroll={active ? trackCurrentSlide : undefined}
        className={`no-scrollbar flex h-full snap-x snap-mandatory overscroll-x-contain ${
          active ? "overflow-x-auto" : "overflow-hidden"
        }`}
      >
        {slides.map((slide, index) => (
          <div key={`${index}-${slide.kind}`} className="relative h-full w-full shrink-0 snap-center">
            {slide.kind === "video" ? (
              // A player only while the video is the reel's slide and the reel is on screen (playing)
              // or next to it (paused, buffered); anywhere else just the poster. An unmounted player
              // isn't lost: the next one resumes where it was left.
              videoId && index === current && mode !== "idle" ? (
                <BackgroundVideo
                  videoId={videoId}
                  title={`${title} — video`}
                  loop={false}
                  paused={!active || interruption !== null}
                  onPlay={() => setVideoStarted(true)}
                  onEnded={() => setInterruption("ended")}
                  soundOn={true}
                  // Below the heart, clear of the details at the bottom of the reel.
                  soundToggleClassName="right-3 top-14"
                >
                  {active ? <VideoPauseTarget onPause={() => setInterruption("paused")} /> : null}
                </BackgroundVideo>
              ) : videoId ? (
                <VideoPoster videoId={videoId} />
              ) : null
            ) : active || index === 0 || index === current ? (
              // Photos past the first only load once the reel is active (or it was left on one).
              <FittedPhoto
                src={slide.src}
                alt={index === current ? title : ""}
                sizes={sizes}
                loading={eager && index === 0 ? "eager" : "lazy"}
              />
            ) : null}
          </div>
        ))}
      </div>

      {slides.length > 1 ? (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-3 flex justify-center gap-1">
          {slides.map((slide, index) => (
            <span
              key={`${index}-${slide.kind}`}
              className={`h-1.5 rounded-full bg-white shadow transition-all duration-300 ${
                index === current ? "w-4 opacity-100" : "w-1.5 opacity-60"
              }`}
            />
          ))}
        </div>
      ) : null}

      {/* Stays up when the reel is left, so coming back finds the video as it was: paused. */}
      {onVideo && interruption ? (
        <VideoInterestPanel
          title={title}
          interruption={interruption}
          hasPhotos={slides.length > 1}
          onResume={() => setInterruption(null)}
          // Stays up while the track slides; landing on the photo clears it.
          onShowPhotos={() => goTo(current + 1)}
        />
      ) : null}
    </div>
  );
}
