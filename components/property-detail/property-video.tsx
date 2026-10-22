"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

import { sendCommand, useIsPlaying, useOutOfSight } from "@/components/property-detail/gallery-video";

/**
 * The real player, once the visitor pressed play. It pauses while out of their sight (scrolled
 * away, another tab) and resumes on return — but only if it was playing when it left, so a video
 * the visitor paused themselves stays paused.
 */
function PropertyVideoPlayer({ videoId, title }: { videoId: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playingRef = useRef(false);
  const resumeOnReturnRef = useRef(false);
  const outOfSight = useOutOfSight(containerRef);

  useIsPlaying(iframeRef, {
    onPlay: () => {
      playingRef.current = true;
    },
    onPause: () => {
      playingRef.current = false;
    },
    onEnded: () => {
      playingRef.current = false;
    },
  });

  useEffect(() => {
    if (outOfSight) {
      if (!playingRef.current) return;
      resumeOnReturnRef.current = true;
      sendCommand(iframeRef.current, "pauseVideo");
    } else if (resumeOnReturnRef.current) {
      resumeOnReturnRef.current = false;
      sendCommand(iframeRef.current, "playVideo");
    }
  }, [outOfSight]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <iframe
        ref={iframeRef}
        // `enablejsapi` lets the page pause and resume it over `postMessage`.
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1&enablejsapi=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 size-full"
      />
    </div>
  );
}

/**
 * YouTube promo video as a click-to-load facade: only the thumbnail loads with
 * the page; YouTube's ~1 MB player is fetched when the visitor presses play.
 * Uses youtube-nocookie.com so no tracking cookies are set before playback.
 */
export function PropertyVideo({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      {playing ? (
        <PropertyVideoPlayer videoId={videoId} title={title} />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Reproducir video: ${title}`}
          className="group absolute inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static YouTube thumbnail, already sized */}
          <img
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="size-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
          />
          <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-foreground shadow-lg transition-transform group-hover:scale-105">
            <Play className="ml-1 size-7 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}
