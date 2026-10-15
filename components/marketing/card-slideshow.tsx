"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";

import { LISTING_IMAGE_QUALITY } from "@/lib/image-quality";

/** How long each photo stays before the next one fades in (phones: one card cycles alone). */
const SLIDE_INTERVAL_MS = 5000;
/** Wider screens: how long a card holds its turn before fading and passing it to the next card. */
const RELAY_INTERVAL_MS = 2500;
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
 * Every slideshow registers its element here; one shared observer tracks them all.
 */
const visibleCards = new Set<Element>();
const activeListeners = new Set<() => void>();
let activeCard: Element | null = null;
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

/** After scrolling: in relay mode the current card keeps its turn while still visible. */
function pickActiveCard() {
  if (activeCard && visibleCards.has(activeCard) && isRelayMode()) return;
  setActiveCard(visibleCardsInOrder()[0] ?? null);
}

/** Relay mode: the card that just changed photo hands the turn to the next visible card. */
function passTurn(from: Element | null) {
  if (!from || from !== activeCard) return;
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
 * Pass `index` / `onIndexChangeAction` to drive it from outside (arrows, dots).
 */
export function CardSlideshow({
  images,
  alt,
  sizes,
  eager = false,
  optimized = true,
  index: controlledIndex,
  onIndexChangeAction,
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
}) {
  const [ownIndex, setOwnIndex] = useState(0);
  const index = controlledIndex ?? ownIndex;
  const setIndex = onIndexChangeAction ?? setOwnIndex;

  const [furthest, setFurthest] = useState(0);
  const [firstLoaded, setFirstLoaded] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const canPlay = !reducedMotion && images.length > 1;
  const [containerRef, isPlaying] = useIsActiveCard<HTMLDivElement>(canPlay);
  const autoplay = canPlay && isPlaying;

  // Mount photos up to one past the furthest shown, so the next fade has its image ready.
  if (index > furthest) setFurthest(index);

  useEffect(() => {
    if (!autoplay) return;
    const relay = isRelayMode();
    const timer = setTimeout(
      () => {
        setIndex((index + 1) % images.length);
        if (relay) passTurn(containerRef.current);
      },
      relay ? RELAY_INTERVAL_MS : SLIDE_INTERVAL_MS,
    );
    return () => clearTimeout(timer);
  }, [autoplay, index, images.length, setIndex, containerRef]);

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

        return optimized ? (
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
