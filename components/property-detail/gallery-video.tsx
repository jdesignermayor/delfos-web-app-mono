import { useEffect, useRef, useState } from "react";
import { preconnect } from "react-dom";
import { Volume2, VolumeX } from "lucide-react";

/**
 * YouTube embed URL for a background-style player: autoplays muted, loops
 * (YouTube only loops when the video is also its own one-item playlist) unless
 * `loop` is false, and shows no controls. `enablejsapi` lets the page unmute it
 * and hear its state through `postMessage`. `start` resumes it where it was left.
 */
function youtubeBackgroundUrl(videoId: string, loop: boolean, { reload = 0, start = 0 } = {}) {
  const params = new URLSearchParams({
    autoplay: "1",
    ...(start >= 1 ? { start: String(Math.floor(start)) } : {}),
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
    // Changes the URL so the iframe reloads from scratch when a stuck player is retried.
    ...(reload ? { reload: String(reload) } : {}),
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
}

/**
 * Where each video was left (seconds), so a player that's unmounted — a reel swiped away, a card
 * losing its turn, a stuck player reloaded — carries on from there when it comes back instead of
 * starting over. Kept for the session; a video that plays to the end starts over next time.
 */
const resumePositions = new Map<string, number>();

/** Thumbnail shown while the player loads (and as the video's tile in the tour). */
export const youtubeThumbnail = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

/** 1280×720 and 16:9 — but YouTube only has it for HD uploads. */
const youtubeHdThumbnail = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
/** Size of the grey placeholder YouTube answers with when a thumbnail doesn't exist. */
const MISSING_THUMBNAIL_WIDTH = 120;

/**
 * Opens the player's connections early (also during SSR, as <link rel="preconnect">), so a player
 * mounted later — e.g. when a reel is swiped in — skips the DNS/TLS handshakes.
 */
function preconnectYouTube() {
  preconnect("https://www.youtube-nocookie.com");
  preconnect("https://www.youtube.com");
  preconnect("https://i.ytimg.com");
  preconnect("https://www.google.com");
}

/**
 * The video's poster, filling its parent like `object-cover`: the sharp 16:9 HD thumbnail, or
 * the 4:3 one when the upload has no HD version. The 4:3 one has black bars above and below a
 * 16:9 video baked in, so it's zoomed by 4/3 to crop them — otherwise a tall card shows them as
 * borders. A poster means a player may follow, so it warms up the connections too.
 */
export function VideoPoster({ videoId, className = "" }: { videoId: string; className?: string }) {
  preconnectYouTube();
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

/**
 * Whether the page may play sound: browsers only allow it once the visitor has interacted with the
 * page (a click, a tap, a key). Where that can't be told, assume it may.
 */
const canPlaySound = () =>
  typeof navigator !== "undefined" && (navigator.userActivation?.hasBeenActive ?? true);

/** Share of a player that must be on screen for it to keep playing. */
const IN_SIGHT_RATIO = 0.25;

/**
 * Whether `ref`'s element is out of the visitor's sight right now: scrolled (mostly) off screen,
 * hidden by CSS (e.g. the desktop-only block on a phone), or in a background tab. Players pause
 * while it's true and resume when it turns false.
 */
export function useOutOfSight(ref: React.RefObject<HTMLElement | null>) {
  const [outOfSight, setOutOfSight] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let offScreen = false;
    const update = () => setOutOfSight(offScreen || document.visibilityState === "hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        offScreen = !entry.isIntersecting || entry.intersectionRatio < IN_SIGHT_RATIO;
        update();
      },
      { threshold: [0, IN_SIGHT_RATIO] },
    );
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [ref]);

  return outOfSight;
}

export function sendCommand(
  iframe: HTMLIFrameElement | null,
  func: "mute" | "unMute" | "playVideo" | "pauseVideo" | "seekTo",
  args: unknown[] = [],
) {
  // Same envelope as the official IFrame API (and our "listening" handshake): without `id` and
  // `channel` the player may silently ignore the command.
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args, id: 1, channel: "widget" }), "*");
}

/** YouTube player states, as reported over `postMessage`. */
const ENDED = 0;
const PLAYING = 1;
const PAUSED = 2;

/** Short grace period after playback starts, while YouTube's start-up overlay fades. */
const CONTROLS_FADE_MS = 800;
/** On touch screens YouTube's mobile player keeps its play/pause overlay up a little longer. */
const TOUCH_CONTROLS_FADE_MS = 1000;
/** How often a "play" is re-sent while the player is still loading and can't take commands yet. */
const PLAY_RETRY_MS = 300;
/**
 * A preloaded player still not playing this long after being asked to is reloaded (it always
 * autoplays): commands over `postMessage` can be dropped while it boots, native autoplay never is.
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
 * button, title and controls, so the caller keeps them covered. An `onPlay`
 * returning false keeps the player covered (a warm-up play, paused right away).
 */
export function useIsPlaying(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  {
    onPlay,
    onPause,
    onEnded,
    onTime,
  }: {
    onPlay?: () => boolean | void;
    onPause?: () => void;
    onEnded?: () => void;
    /** The playback position (seconds), as the player reports it. */
    onTime?: (seconds: number) => void;
  } = {},
) {
  const [playing, setPlaying] = useState(false);
  const revealTimer = useRef<number | undefined>(undefined);
  // Latest callbacks, read from the message listener without re-subscribing it.
  const callbacks = useRef({ onPlay, onPause, onEnded, onTime });
  useEffect(() => {
    callbacks.current = { onPlay, onPause, onEnded, onTime };
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
      const info = data.event === "infoDelivery" ? (data.info as { playerState?: number; currentTime?: number } | null) : null;
      if (typeof info?.currentTime === "number") callbacks.current.onTime?.(info.currentTime);
      const state = data.event === "onStateChange" ? data.info : info?.playerState;
      if (state === PLAYING) {
        if (revealTimer.current === undefined) {
          if (callbacks.current.onPlay?.() === false) return;
          revealTimer.current = window.setTimeout(() => setPlaying(true), controlsFadeMs());
        }
      } else if (state === ENDED || state === PAUSED) {
        if (state === ENDED) callbacks.current.onEnded?.();
        else callbacks.current.onPause?.();
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
 * Whatever `paused` says, the video pauses while it's out of the visitor's sight (see
 * `useOutOfSight`) and carries on from there when it's back in view. It's never cancelled: a
 * player mounted again for the same video resumes where the last one was left.
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
  soundOn,
  soundToggleClassName = "bottom-3 right-3",
}: {
  videoId: string;
  title: string;
  /** Overlays rendered between the video and the sound toggle (e.g. a click target). */
  children?: React.ReactNode;
  /** False plays the video once; `onEnded` then fires. */
  loop?: boolean;
  /**
   * Controlled playback, to preload a player before it's shown. Mounted paused, it still autoplays
   * (muted, covered) and is paused back at its starting point as soon as it starts, so its video
   * is already buffered; when this turns false it's asked to resume (falling back to a reload).
   * Mounted already unpaused, it simply autoplays.
   */
  paused?: boolean;
  /** The video actually started playing. */
  onPlay?: () => void;
  onEnded?: () => void;
  /**
   * Turning true unmutes it (e.g. while its card is hovered), turning false mutes it again; the
   * sound toggle still works in between. Ignored until the visitor has interacted with the page:
   * browsers pause, rather than unmute, a video asked to play sound before that.
   */
  soundOn?: boolean;
  /** Where the sound toggle sits (Tailwind position classes). */
  soundToggleClassName?: string;
}) {
  preconnectYouTube();

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Mounted with `soundOn` already true (a hovered card's video), it starts with sound.
  const [muted, setMuted] = useState(() => !(soundOn && canPlaySound()));
  // Follows `soundOn` when it changes (during render, as React recommends for derived state).
  const [lastSoundOn, setLastSoundOn] = useState(soundOn);
  if (soundOn !== lastSoundOn) {
    setLastSoundOn(soundOn);
    if (soundOn === false) setMuted(true);
    else if (soundOn && canPlaySound()) setMuted(false);
  }
  const mutedRef = useRef(muted);
  useEffect(() => {
    mutedRef.current = muted;
    sendCommand(iframeRef.current, muted ? "mute" : "unMute");
  }, [muted]);
  const outOfSight = useOutOfSight(containerRef);
  // Held still by the caller, or because nobody can see it.
  const hold = Boolean(paused) || outOfSight;
  const isPlayingRef = useRef(false);
  // Whether it has really played (not just a warm-up), so a hold never rewinds what was watched.
  const hasPlayedRef = useRef(false);
  const holdRef = useRef(hold);
  useEffect(() => {
    holdRef.current = hold;
  });
  // What the iframe loads: where it starts (where this video was left), and a reload counter.
  const [source, setSource] = useState(() => ({ reload: 0, start: resumePositions.get(videoId) ?? 0 }));
  const playing = useIsPlaying(iframeRef, {
    onPlay: () => {
      if (holdRef.current) {
        // It (auto)played while it should be still — e.g. a preloaded player warming up. Stop it;
        // one that wasn't watched yet goes back to where it starts, buffered.
        sendCommand(iframeRef.current, "pauseVideo");
        if (!hasPlayedRef.current) sendCommand(iframeRef.current, "seekTo", [source.start, true]);
        return false;
      }
      isPlayingRef.current = true;
      hasPlayedRef.current = true;
      // The embed always starts muted, and an unmute sent while it was loading may have been lost.
      if (!mutedRef.current) sendCommand(iframeRef.current, "unMute");
      onPlay?.();
    },
    onEnded: () => {
      resumePositions.delete(videoId);
      onEnded?.();
    },
    onTime: (seconds) => {
      // Only real playback counts — not a warm-up's first frames.
      if (isPlayingRef.current) resumePositions.set(videoId, seconds);
    },
  });
  const controlled = paused !== undefined;
  // Whether the player was ever held, so playing needs commands rather than its autoplay.
  const heldPausedRef = useRef(Boolean(paused));

  useEffect(() => {
    const iframe = iframeRef.current;
    if (hold) {
      isPlayingRef.current = false;
      heldPausedRef.current = true;
      sendCommand(iframe, "pauseVideo");
      return;
    }
    if (!heldPausedRef.current) return;
    // Keep asking to play while the player boots; reload it (autoplaying, from where it was left)
    // if it never starts.
    sendCommand(iframe, "playVideo");
    const retry = window.setInterval(() => {
      if (isPlayingRef.current) window.clearInterval(retry);
      else sendCommand(iframe, "playVideo");
    }, PLAY_RETRY_MS);
    const fallback = window.setTimeout(() => {
      if (isPlayingRef.current) return;
      heldPausedRef.current = false;
      setSource((current) => ({
        reload: current.reload + 1,
        start: resumePositions.get(videoId) ?? current.start,
      }));
    }, PLAY_FALLBACK_MS);
    return () => {
      window.clearInterval(retry);
      window.clearTimeout(fallback);
    };
  }, [hold, source.reload, videoId]);

  function toggleSound(event: React.MouseEvent) {
    // The player may sit inside a link (a listing card): toggling sound must not navigate.
    event.preventDefault();
    event.stopPropagation();
    setMuted(!muted);
  }

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-black [container-type:size]">
      <iframe
        ref={iframeRef}
        src={youtubeBackgroundUrl(videoId, loop, source)}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture"
        // A preloaded (controlled) player loads off screen on purpose; any other waits until it's near.
        loading={controlled ? "eager" : "lazy"}
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
