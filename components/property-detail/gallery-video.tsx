import { useEffect, useRef, useState } from "react";
import { preconnect } from "react-dom";
import { Volume2, VolumeX } from "lucide-react";

/**
 * YouTube embed URL for a background-style player: autoplays muted, loops
 * (YouTube only loops when the video is also its own one-item playlist) unless
 * `loop` is false, and shows no controls. `enablejsapi` lets the page unmute it
 * and hear its state through `postMessage`.
 */
function youtubeBackgroundUrl(videoId: string, loop: boolean, autoplay: boolean) {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: "1",
    ...(loop ? { loop: "1", playlist: videoId } : {}),
    controls: "0",
    disablekb: "1",
    fs: "0",
    iv_load_policy: "3",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
}

/** Thumbnail shown while the player loads (and as the video's tile in the tour). */
export const youtubeThumbnail = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

/** 1280×720 and 16:9 — but YouTube only has it for HD uploads. */
const youtubeHdThumbnail = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
/** Size of the grey placeholder YouTube answers with when a thumbnail doesn't exist. */
const MISSING_THUMBNAIL_WIDTH = 120;

/**
 * The video's poster, filling its parent like `object-cover`: the sharp 16:9 HD thumbnail, or
 * the 4:3 one when the upload has no HD version. The 4:3 one has black bars above and below a
 * 16:9 video baked in, so it's zoomed by 4/3 to crop them — otherwise a tall card shows them as
 * borders.
 */
export function VideoPoster({ videoId, className = "" }: { videoId: string; className?: string }) {
  const [hd, setHd] = useState(true);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static YouTube thumbnail
    <img
      src={hd ? youtubeHdThumbnail(videoId) : youtubeThumbnail(videoId)}
      alt=""
      onError={() => setHd(false)}
      onLoad={(event) => {
        if (hd && event.currentTarget.naturalWidth <= MISSING_THUMBNAIL_WIDTH) setHd(false);
      }}
      className={`pointer-events-none absolute inset-0 size-full object-cover ${hd ? "" : "scale-[1.34]"} ${className}`}
    />
  );
}

function sendCommand(
  iframe: HTMLIFrameElement | null,
  func: "mute" | "unMute" | "playVideo" | "pauseVideo",
) {
  // Same envelope as the official IFrame API (and our "listening" handshake): without `id` and
  // `channel` the player may silently ignore the command.
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [], id: 1, channel: "widget" }), "*");
}

/** YouTube player states, as reported over `postMessage`. */
const ENDED = 0;
const PLAYING = 1;
const PAUSED = 2;

/** Short grace period after playback starts, while YouTube's start-up overlay fades. */
const CONTROLS_FADE_MS = 800;
/** On touch screens YouTube's mobile player keeps its play/pause overlay up a little longer. */
const TOUCH_CONTROLS_FADE_MS = 1500;
/** How often a "play" is re-sent while the player is still loading and can't take commands yet. */
const PLAY_RETRY_MS = 300;
/**
 * A preloaded player still not playing this long after being asked to is reloaded with autoplay:
 * commands over `postMessage` can be dropped while it boots, native autoplay never is.
 */
const PLAY_FALLBACK_MS = 1500;

const controlsFadeMs = () =>
  window.matchMedia("(pointer: coarse)").matches ? TOUCH_CONTROLS_FADE_MS : CONTROLS_FADE_MS;

/**
 * Whether the player is actually showing video frames. Subscribes to the
 * embed's state messages (the same "listening" handshake the official IFrame
 * API sends, without loading its script) and reports `true` a few seconds
 * after it starts playing.
 * Before that — and while ended or paused — YouTube paints its own play
 * button, title and controls, so the caller keeps them covered.
 */
function useIsPlaying(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  { onPlay, onEnded }: { onPlay?: () => void; onEnded?: () => void } = {},
) {
  const [playing, setPlaying] = useState(false);
  const revealTimer = useRef<number | undefined>(undefined);
  // Latest callbacks, read from the message listener without re-subscribing it.
  const callbacks = useRef({ onPlay, onEnded });
  useEffect(() => {
    callbacks.current = { onPlay, onEnded };
  });

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    function onMessage(event: MessageEvent) {
      if (event.source !== iframe?.contentWindow || typeof event.data !== "string") return;
      let data: { event?: string; info?: unknown };
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      const state =
        data.event === "onStateChange"
          ? data.info
          : data.event === "infoDelivery"
            ? (data.info as { playerState?: number } | null)?.playerState
            : undefined;
      if (state === PLAYING) {
        if (revealTimer.current === undefined) {
          callbacks.current.onPlay?.();
          revealTimer.current = window.setTimeout(() => setPlaying(true), controlsFadeMs());
        }
      } else if (state === ENDED || state === PAUSED) {
        if (state === ENDED) callbacks.current.onEnded?.();
        window.clearTimeout(revealTimer.current);
        revealTimer.current = undefined;
        setPlaying(false);
      }
    }

    // The embed only starts reporting after a "listening" message; repeat it
    // until the player has loaded (the first ones can arrive too early).
    const listen = () =>
      iframe.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
    window.addEventListener("message", onMessage);
    iframe.addEventListener("load", listen);
    const retry = window.setInterval(listen, 250);
    const stopRetry = window.setTimeout(() => window.clearInterval(retry), 15_000);

    return () => {
      window.removeEventListener("message", onMessage);
      iframe.removeEventListener("load", listen);
      window.clearInterval(retry);
      window.clearTimeout(stopRetry);
      window.clearTimeout(revealTimer.current);
    };
  }, [iframeRef]);

  return playing;
}

/**
 * Muted, looping YouTube video that fills its parent like `object-cover`.
 *
 * Even with `controls=0` YouTube overlays its title, share / "ver más tarde"
 * buttons and logo along the player's edges. The iframe is made 120px taller
 * than the video — YouTube letterboxes the video in the middle and draws those
 * overlays in the extra strips — and the parent crops the strips away. The
 * iframe ignores the pointer, so only our sound toggle is interactive, and the
 * thumbnail stays on top until the video is really playing, hiding the play
 * button and controls YouTube shows while it loads.
 *
 * The parent must be `relative` and sized; this fills it.
 */
export function BackgroundVideo({
  videoId,
  title,
  children,
  loop = true,
  paused,
  onPlay,
  onEnded,
  soundToggleClassName = "bottom-3 right-3",
}: {
  videoId: string;
  title: string;
  /** Overlays rendered between the video and the sound toggle (e.g. a click target). */
  children?: React.ReactNode;
  /** False plays the video once; `onEnded` then fires. */
  loop?: boolean;
  /**
   * Controlled playback, to preload a player before it's shown: mounted paused, it loads without
   * autoplay; when this turns false it's asked to play (falling back to an autoplay reload). Mounted
   * already unpaused, it simply autoplays.
   */
  paused?: boolean;
  /** The video actually started playing. */
  onPlay?: () => void;
  onEnded?: () => void;
  /** Where the sound toggle sits (Tailwind position classes). */
  soundToggleClassName?: string;
}) {
  // Open the connections early (also during SSR, as <link rel="preconnect">) so the player starts sooner.
  preconnect("https://www.youtube-nocookie.com");
  preconnect("https://www.youtube.com");
  preconnect("https://i.ytimg.com");
  preconnect("https://www.google.com");

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [muted, setMuted] = useState(true);
  const isPlayingRef = useRef(false);
  const playing = useIsPlaying(iframeRef, {
    onPlay: () => {
      isPlayingRef.current = true;
      onPlay?.();
    },
    onEnded,
  });
  const controlled = paused !== undefined;
  // Autoplay in the URL whenever the video should play from the start — the reliable path.
  // Only a player preloaded paused relies on commands, and is reloaded with autoplay if they fail.
  const [nativeAutoplay, setNativeAutoplay] = useState(() => !controlled || !paused);

  useEffect(() => {
    if (!controlled) return;
    const iframe = iframeRef.current;
    if (paused) {
      isPlayingRef.current = false;
      sendCommand(iframe, "pauseVideo");
      return;
    }
    if (nativeAutoplay) return;
    // Keep asking to play while the player boots; reload it with autoplay if it never starts.
    sendCommand(iframe, "playVideo");
    const retry = window.setInterval(() => {
      if (isPlayingRef.current) window.clearInterval(retry);
      else sendCommand(iframe, "playVideo");
    }, PLAY_RETRY_MS);
    const fallback = window.setTimeout(() => {
      if (!isPlayingRef.current) setNativeAutoplay(true);
    }, PLAY_FALLBACK_MS);
    return () => {
      window.clearInterval(retry);
      window.clearTimeout(fallback);
    };
  }, [controlled, paused, nativeAutoplay]);

  function toggleSound(event: React.MouseEvent) {
    // The player may sit inside a link (a listing card): toggling sound must not navigate.
    event.preventDefault();
    event.stopPropagation();
    sendCommand(iframeRef.current, muted ? "unMute" : "mute");
    setMuted(!muted);
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-black [container-type:size]">
      <iframe
        ref={iframeRef}
        src={youtubeBackgroundUrl(videoId, loop, nativeAutoplay)}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture"
        tabIndex={-1}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[calc(max(100cqh,56.25cqw)+120px)] w-[max(100cqw,177.78cqh)] -translate-x-1/2 -translate-y-1/2"
      />
      {/* Covers the player until it really plays, hiding YouTube's loading UI and controls. */}
      <VideoPoster
        videoId={videoId}
        className={`transition-opacity duration-300 ${playing ? "opacity-0" : "opacity-100"}`}
      />

      {children}

      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? "Activar sonido del video" : "Silenciar video"}
        aria-pressed={!muted}
        className={`absolute ${soundToggleClassName} flex size-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
      >
        {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
      </button>
    </div>
  );
}

/** The collage's large tile: the background video, clickable to open the tour. */
export function GalleryHeroVideo({
  videoId,
  title,
  onOpen,
}: {
  videoId: string;
  title: string;
  onOpen?: () => void;
}) {
  return (
    <div className="group relative aspect-video sm:aspect-auto">
      <BackgroundVideo videoId={videoId} title={title}>
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Ver video y fotos de ${title}`}
            className="absolute inset-0 cursor-pointer transition-colors group-hover:bg-black/10 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
          />
        ) : null}
      </BackgroundVideo>
    </div>
  );
}
