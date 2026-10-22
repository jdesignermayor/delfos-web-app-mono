"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";

import { FittedPhoto } from "@/components/marketing/fitted-photo";
import { LISTING_IMAGE_QUALITY } from "@/lib/image-quality";

/** How long each photo stays before the next one fades in (phones: one card cycles alone). */
const SLIDE_INTERVAL_MS = 5000;
/** Wider screens: how long a card holds its turn before fading and passing it to the next card. */
const RELAY_INTERVAL_MS = 2500;
/** A card that was just hovered (pinned) takes its first turn this fast, so it reacts at once. */
const PINNED_FIRST_TURN_MS = 300;
/** Slow, smooth crossfade plus a gentle zoom that runs while the photo is on screen. */
const SLIDE_TRANSITION = "opacity 1200ms ease-in-out, transform 6000ms ease-out";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => true,
  );
}

/** Share of a card that must be on screen before its slideshow may play. */
const VISIBLE_RATIO = 0.6;

/**
 * Only one slideshow plays at a time. On phones it's the first card (top-most, then left-most)
 * that is mostly on screen. On wider screens the turn passes along: each visible card fades to
 * its next photo once, then hands over to the next visible card in reading order, looping back.
 * Every slideshow registers its element here; one shared observer tracks them all. A hovered
 * card can pin the turn: it alone plays until the pointer leaves.
 */
const visibleCards = new Set<Element>();
const activeListeners = new Set<() => void>();
let activeCard: Element | null = null;
let pinnedCard: Element | null = null;
let cardObserver: IntersectionObserver | null = null;

const RELAY_QUERY = "(min-width: 768px)";
/** Whether visible cards take turns (wider screens) instead of only the first one playing. */
function isRelayMode() {
  return window.matchMedia(RELAY_QUERY).matches;
}

/** Visible cards in reading order; cards in the same row can differ by a pixel or two. */
function visibleCardsInOrder(): Element[] {
  const positioned = [...visibleCards].map((card) => ({ card, rect: card.getBoundingClientRect() }));
  positioned.sort((a, b) => (Math.abs(a.rect.top - b.rect.top) > 4 ? a.rect.top - b.rect.top : a.rect.left - b.rect.left));
  return positioned.map(({ card }) => card);
}

function setActiveCard(card: Element | null) {
  if (card === activeCard) return;
  activeCard = card;
  activeListeners.forEach((notify) => notify());
}

/** After scrolling: a pinned card keeps the turn; in relay mode so does the current one while visible. */
function pickActiveCard() {
  if (pinnedCard) return setActiveCard(pinnedCard);
  if (activeCard && visibleCards.has(activeCard) && isRelayMode()) return;
  setActiveCard(visibleCardsInOrder()[0] ?? null);
}

/** Relay mode: the card that just changed photo hands the turn to the next visible card. */
function passTurn(from: Element | null) {
  if (!from || from !== activeCard || from === pinnedCard) return;
  const ordered = visibleCardsInOrder();
  setActiveCard(ordered[(ordered.indexOf(from) + 1) % ordered.length] ?? null);
}

function observeCard(card: Element) {
  cardObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.intersectionRatio >= VISIBLE_RATIO) visibleCards.add(entry.target);
        else visibleCards.delete(entry.target);
      }
      pickActiveCard();
    },
    { threshold: [0, VISIBLE_RATIO, 1] },
  );
  cardObserver.observe(card);
  return () => {
    cardObserver?.unobserve(card);
    visibleCards.delete(card);
    pickActiveCard();
  };
}

/** Gives `card` the turn for as long as it's pinned (hovered); returns the unpin. */
function pinCard(card: Element) {
  pinnedCard = card;
  setActiveCard(card);
  return () => {
    if (pinnedCard !== card) return;
    pinnedCard = null;
    pickActiveCard();
  };
}

function subscribeActiveCard(notify: () => void) {
  activeListeners.add(notify);
  return () => activeListeners.delete(notify);
}

/** True while this element is the one card whose slideshow should be playing. */
function useIsActiveCard<T extends Element>(enabled: boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const card = ref.current;
    if (!enabled || !card) return;
    return observeCard(card);
  }, [enabled]);

  const isActive = useSyncExternalStore(
    subscribeActiveCard,
    () => activeCard !== null && activeCard === ref.current,
    () => false,
  );
  return [ref, isActive] as const;
}

/**
 * A card's photos stacked on top of each other: they crossfade slowly from one to the next while
 * this card holds the turn (see `pickActiveCard` / `passTurn`); the rest hold still. Only the
 * current photo and the next one are mounted, so waiting cards download a single image.
 * Pass `index` / `onIndexChangeAction` to drive it from outside (arrows, dots), and
 * `onTurnAction` / `paused` to spend a turn on something else (a video) without other cards moving,
 * and `pinned` to keep the turn (e.g. while hovered). With `playOnlyWhenPinned` the card stays out
 * of the relay and plays only while pinned.
 */
export function CardSlideshow({
  images,
  alt,
  sizes,
  eager = false,
  optimized = true,
  index: controlledIndex,
  onIndexChangeAction,
  onTurnAction,
  paused = false,
  pinned = false,
  playOnlyWhenPinned = false,
  onTurnStartAction,
  onTurnEndAction,
  fitLandscape = false,
}: {
  images: string[];
  alt: string;
  /** Rendered width hint for next/image. */
  sizes?: string;
  eager?: boolean;
  /** Serve photos through next/image; off for sources outside `images.remotePatterns`. */
  optimized?: boolean;
  index?: number;
  onIndexChangeAction?: (index: number) => void;
  /**
   * Called when this card's turn comes, before it moves to the next photo. Returning true means
   * the caller used the turn (e.g. started a video): the card keeps the turn and stays put.
   */
  onTurnAction?: () => boolean;
  /** Holds the turn without moving, so no other card moves either. Resuming hands the turn on. */
  paused?: boolean;
  /** Holds the turn (e.g. while the card is hovered): only this card plays, every other one waits. */
  pinned?: boolean;
  /** Never takes a turn on its own: it plays (zoom and photos) only while `pinned`, e.g. hovered. */
  playOnlyWhenPinned?: boolean;
  /** This card just got the turn (back), even while `paused`. */
  onTurnStartAction?: () => void;
  /** This card just lost the turn (another card was hovered or took over, or it scrolled away). */
  onTurnEndAction?: () => void;
  /** Tall frames: show landscape photos whole over a blurred copy instead of blowing them up. */
  fitLandscape?: boolean;
}) {
  const [ownIndex, setOwnIndex] = useState(0);
  const index = controlledIndex ?? ownIndex;
  const setIndex = onIndexChangeAction ?? setOwnIndex;

  const [furthest, setFurthest] = useState(0);
  const [firstLoaded, setFirstLoaded] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  // A caller that spends turns on something else takes part even with a single photo, and so does a
  // hover-only card (its single photo still zooms).
  const canPlay = !reducedMotion && (images.length > 1 || Boolean(onTurnAction) || playOnlyWhenPinned);
  // A hover-only card isn't registered in the relay; pinning still hands it the turn.
  const [containerRef, isPlaying] = useIsActiveCard<HTMLDivElement>(canPlay && !playOnlyWhenPinned);
  const autoplay = canPlay && isPlaying && !paused;

  // Mount photos up to one past the furthest shown, so the next fade has its image ready.
  if (index > furthest) setFurthest(index);

  /** This card's turn: let the caller use it, or move to the next photo and hand the turn on. */
  const takeTurn = useEffectEvent((relay: boolean) => {
    if (onTurnAction?.()) return;
    setIndex((index + 1) % images.length);
    if (relay) passTurn(containerRef.current);
  });

  // Set when the card gets pinned; its next turn comes right away instead of after the interval.
  const freshlyPinned = useRef(false);

  useEffect(() => {
    if (!autoplay) return;
    const relay = isRelayMode();
    const delay = freshlyPinned.current ? PINNED_FIRST_TURN_MS : relay ? RELAY_INTERVAL_MS : SLIDE_INTERVAL_MS;
    freshlyPinned.current = false;
    const timer = setTimeout(() => takeTurn(relay), delay);
    return () => clearTimeout(timer);
  }, [autoplay, index]);

  useEffect(() => {
    const card = containerRef.current;
    if (!pinned || !card) return;
    freshlyPinned.current = true;
    return pinCard(card);
  }, [pinned, containerRef]);

  const startTurn = useEffectEvent(() => onTurnStartAction?.());
  const endTurn = useEffectEvent(() => onTurnEndAction?.());
  const wasPlaying = useRef(isPlaying);
  useEffect(() => {
    if (wasPlaying.current && !isPlaying) endTurn();
    else if (!wasPlaying.current && isPlaying) startTurn();
    wasPlaying.current = isPlaying;
  }, [isPlaying]);

  // Resuming after a pause (the video ended) hands the turn on, so the next card goes first.
  const wasPaused = useRef(paused);
  useEffect(() => {
    if (wasPaused.current && !paused && isRelayMode()) passTurn(containerRef.current);
    wasPaused.current = paused;
  }, [paused, containerRef]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      {firstLoaded ? null : <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-surface-secondary" />}
      {images.slice(0, autoplay ? furthest + 2 : furthest + 1).map((src, i) => {
        const isActive = i === index;
        const className = "absolute inset-0 size-full object-cover";
        const style = {
          opacity: isActive && firstLoaded ? 1 : 0,
          transform: isActive && autoplay ? "scale(1.08)" : "scale(1)",
          transition: reducedMotion ? "opacity 300ms ease-in-out" : SLIDE_TRANSITION,
        };
        const onFirstLoad = i === 0 ? () => setFirstLoaded(true) : undefined;

        return optimized && fitLandscape ? (
          <FittedPhoto
            key={src + i}
            src={src}
            alt={isActive ? alt : ""}
            sizes={sizes}
            loading={eager && i === 0 ? "eager" : "lazy"}
            onLoadAction={onFirstLoad}
            style={style}
          />
        ) : optimized ? (
          <Image
            key={src + i}
            src={src}
            alt={isActive ? alt : ""}
            fill
            sizes={sizes}
            quality={LISTING_IMAGE_QUALITY}
            loading={eager && i === 0 ? "eager" : "lazy"}
            // An image that finished before hydration never fires onLoad, so check `complete` too.
            ref={(img) => {
              if (i === 0 && img?.complete && img.naturalWidth > 0) setFirstLoaded(true);
            }}
            onLoad={onFirstLoad}
            className={className}
            style={style}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src + i}
            src={src}
            alt={isActive ? alt : ""}
            loading={eager && i === 0 ? "eager" : "lazy"}
            draggable={false}
            ref={(img) => {
              if (i === 0 && img?.complete && img.naturalWidth > 0) setFirstLoaded(true);
            }}
            onLoad={onFirstLoad}
            className={className}
            style={style}
          />
        );
      })}
    </div>
  );
}
