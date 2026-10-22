"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import { FittedPhoto } from "@/components/marketing/fitted-photo";
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
 * swiped left and right. The active reel also moves on by itself — the video to its end, each photo
 * for a few seconds — and back to the start after the last item. Leaving the reel stops everything
 * (its player is unmounted, its timers cleared) and rewinds it to its first slide.
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
  }

  const next = useEffectEvent(() => goTo(current + 1));
  const rewind = useEffectEvent(() => goTo(0, "instant"));

  // Leaving the reel rewinds it, so coming back starts over from the video: the slide it tracks
  // resets right away (during render, as React recommends), the track's scroll right after.
  const [wasActive, setWasActive] = useState(active);
  if (wasActive !== active) {
    setWasActive(active);
    if (!active) {
      setCurrent(0);
      setVideoStarted(false);
    }
  }
  useEffect(() => {
    if (!active) rewind();
  }, [active]);

  // Moves on by itself only while active: the video once it ends (below) — or past one that never
  // started — and each photo after a pause. A swipe changes `current` and restarts the wait.
  useEffect(() => {
    if (!active || slides.length < 2) return;
    if (onVideo && videoStarted) return;
    const timer = setTimeout(next, onVideo ? VIDEO_START_TIMEOUT_MS : PHOTO_MS);
    return () => clearTimeout(timer);
  }, [active, current, onVideo, videoStarted, slides.length]);

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
              // A player only while it's the slide on screen (playing) or the next reel's first
              // slide (loading, paused); anywhere else just the poster, so nothing is left running.
              // Swiping off the video unmounts it rather than relying on a "pause" command.
              videoId && (mode === "preload" || (active && index === current)) ? (
                <BackgroundVideo
                  videoId={videoId}
                  title={`${title} — video`}
                  loop={false}
                  paused={!active}
                  onPlay={() => setVideoStarted(true)}
                  onEnded={() => goTo(current + 1)}
                  // Below the heart, clear of the details at the bottom of the reel.
                  soundToggleClassName="right-3 top-14"
                />
              ) : videoId ? (
                <VideoPoster videoId={videoId} />
              ) : null
            ) : active || index === 0 ? (
              // Photos past the first only load once the reel is active.
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
    </div>
  );
}
