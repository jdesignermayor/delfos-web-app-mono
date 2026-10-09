import {
  memo,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

import { PropertyActions } from "@/components/property-detail/favorite-share-bar";
import { BackgroundVideo, youtubeThumbnail } from "@/components/property-detail/gallery-video";

const DESKTOP_QUERY = "(min-width: 640px)";

function subscribeToDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const isDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

/** A tour entry: the listing's YouTube video (always first) or a photo URL. */
type TourItem = { kind: "video"; videoId: string } | { kind: "photo"; src: string };

const itemKey = (item: TourItem, index: number) =>
  `${item.kind === "video" ? item.videoId : item.src}-${index}`;

/** Same clean, muted player as the collage: no YouTube controls, just the sound toggle. */
function TourVideo({ videoId, title }: { videoId: string; title: string }) {
  return <BackgroundVideo videoId={videoId} title={`${title} — video`} />;
}

type PhotoListProps = {
  title: string;
  items: TourItem[];
  itemsRef: RefObject<(HTMLElement | null)[]>;
  onVisible: (index: number) => void;
};

/**
 * Fullscreen "Recorrido gráfico": thumbnails of the video (if any) and every
 * photo, then the items themselves — stacked on desktop, a one-per-screen carousel on phones. Only
 * the layout for the current viewport is mounted, so each photo loads once.
 * Loaded lazily by PropertyGallery (a client component) and never
 * server-rendered, so it needs no "use client" boundary of its own.
 */
export function PhotoTour({
  title,
  photos,
  videoId,
  onClose,
}: {
  title: string;
  photos: string[];
  /** Shown first, autoplaying muted, when the listing has a YouTube video. */
  videoId?: string | null;
  onClose: () => void;
}) {
  // Stable between renders so the memoised lists below don't re-render on every active change.
  const items = useMemo<TourItem[]>(
    () => [
      ...(videoId ? [{ kind: "video" as const, videoId }] : []),
      ...photos.map((src) => ({ kind: "photo" as const, src })),
    ],
    [photos, videoId],
  );
  const desktop = useSyncExternalStore(subscribeToDesktop, isDesktop);
  const dialogRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);

  function goTo(index: number) {
    const target = Math.max(0, Math.min(items.length - 1, index));
    setActive(target);
    itemsRef.current[target]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }

  // Lock the page behind the overlay.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Keep keyboard and screen-reader focus inside the tour: the rest of the
  // page goes inert, focus starts on "Volver" and returns to the clicked
  // photo when the tour closes. Modals opened later (login) are appended
  // after this point, so they stay interactive.
  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const background = [...document.body.children].filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== dialog && !el.inert
    );
    background.forEach((el) => (el.inert = true));
    backRef.current?.focus();
    return () => {
      background.forEach((el) => (el.inert = false));
      opener?.focus({ preventScroll: true });
    };
  }, []);

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") onClose();
    else if (event.key === "ArrowRight") goTo(active + 1);
    else if (event.key === "ArrowLeft") goTo(active - 1);
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Phones: keep the active thumbnail centred in the horizontal strip. Scrolls
  // the strip only, so the tour's vertical position is left alone.
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.children[active] as HTMLElement | undefined;
    if (!strip || !thumb || desktop) return;
    strip.scrollTo({
      left: thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2,
      behavior: "smooth",
    });
  }, [active, desktop]);

  return createPortal(
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Recorrido gráfico de ${title}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex flex-col bg-white"
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-separator px-4 py-3 sm:px-6">
        <button
          ref={backRef}
          type="button"
          onClick={onClose}
          aria-label="Volver"
          className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-foreground pl-2.5 pr-4 text-sm font-semibold text-white shadow-md transition-[filter] hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent max-sm:w-10 max-sm:px-0"
        >
          <ChevronLeft className="size-5" />
          <span className="max-sm:sr-only">Volver</span>
        </button>
        <PropertyActions compact />
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-foreground">Recorrido gráfico</h2>
          <p className="mt-1 text-sm text-muted">
            {videoId ? "1 video · " : null}
            {photos.length} {photos.length === 1 ? "foto" : "fotos"}
          </p>
          {/* Announces the item shown after a thumbnail, arrow key or swipe. */}
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {items[active]?.kind === "video" ? "Video" : "Foto"} {active + 1} de {items.length}
          </p>

          {/* Thumbnails: a swipeable strip on phones, a grid from `sm` up. */}
          <div
            ref={stripRef}
            role="group"
            aria-label="Miniaturas de las fotos"
            className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 md:grid-cols-6 [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item, index) => (
              <button
                key={itemKey(item, index)}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Ver ${item.kind === "video" ? "video" : "foto"} ${index + 1} de ${items.length}`}
                aria-current={active === index ? "true" : undefined}
                // The ring marks the photo in view; the outline marks keyboard focus.
                className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg ring-2 ring-offset-2 transition focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-accent sm:w-auto ${
                  active === index ? "ring-foreground" : "ring-transparent opacity-80 hover:opacity-100"
                }`}
              >
                {item.kind === "video" ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- static YouTube thumbnail */}
                    <img src={youtubeThumbnail(item.videoId)} alt="" className="size-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                      <Play className="size-5 fill-current" />
                    </span>
                  </>
                ) : (
                  <Image src={item.src} alt="" fill sizes="(min-width: 640px) 160px, 80px" className="object-cover" />
                )}
              </button>
            ))}
          </div>

          {desktop ? (
            <StackedPhotos
              title={title}
              items={items}
              itemsRef={itemsRef}
              onVisible={setActive}
              scrollRef={scrollRef}
            />
          ) : (
            <div className="relative mt-6 overflow-hidden rounded-2xl">
              <PhotoCarousel
                title={title}
                items={items}
                itemsRef={itemsRef}
                onVisible={setActive}
              />

              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white"
              >
                {active + 1} / {items.length}
              </span>

              {/* Always mounted (aria-disabled at the ends) so a focused button never vanishes and drops focus. */}
              <CarouselButton direction="previous" disabled={active === 0} onClick={() => goTo(active - 1)} />
              <CarouselButton
                direction="next"
                disabled={active === items.length - 1}
                onClick={() => goTo(active + 1)}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>,
    document.body
  );
}

function CarouselButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "previous" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
      aria-label={direction === "previous" ? "Foto anterior" : "Foto siguiente"}
      className={`absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white aria-disabled:cursor-default aria-disabled:opacity-0 aria-disabled:focus-visible:opacity-60 ${
        direction === "previous" ? "left-3" : "right-3"
      }`}
    >
      <Icon className="size-5" />
    </button>
  );
}

/** Reports the photo in view (read from `data-index`) as the user scrolls or swipes. */
function useTrackVisiblePhoto(
  { items, itemsRef, onVisible }: PhotoListProps,
  root: RefObject<HTMLElement | null>,
  options: Omit<IntersectionObserverInit, "root">
) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) onVisible(Number((visible.target as HTMLElement).dataset.index));
      },
      { ...options, root: root.current }
    );
    itemsRef.current.slice(0, items.length).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
    // `options` is a literal at each call site; the observer only needs to follow the item count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, itemsRef, onVisible, root]);
}

/** Desktop: every photo at full width, stacked. Memoised so changing the active photo doesn't re-render the list. */
const StackedPhotos = memo(function StackedPhotos(
  props: PhotoListProps & { scrollRef: RefObject<HTMLDivElement | null> }
) {
  const { title, items, itemsRef, scrollRef } = props;
  // A photo counts as "current" while it crosses the middle of the viewport.
  useTrackVisiblePhoto(props, scrollRef, { rootMargin: "-45% 0px -45% 0px" });

  return (
    <div className="mt-8 flex flex-col gap-4">
      {items.map((item, index) => (
        <figure
          key={itemKey(item, index)}
          ref={(el) => {
            itemsRef.current[index] = el;
          }}
          data-index={index}
          // Fixed frame: photos above can't shift the list while they load,
          // so jumping to a photo lands on it. `cover` fills it edge to edge,
          // lined up with the thumbnails above.
          className={`relative scroll-mt-6 overflow-hidden rounded-2xl bg-surface ${
            item.kind === "video" ? "aspect-video" : "aspect-[3/2]"
          }`}
        >
          {item.kind === "video" ? (
            <TourVideo videoId={item.videoId} title={title} />
          ) : (
            <Image
              src={item.src}
              alt={`${title} — foto ${index + 1}`}
              fill
              sizes="(min-width: 896px) 848px, calc(100vw - 48px)"
              // The tour opens at the top, so the first photo is visible straight away.
              loading={index === 0 ? "eager" : "lazy"}
              className="object-cover"
            />
          )}
        </figure>
      ))}
    </div>
  );
});

/** Phones: one photo per screen in a snapping carousel. Memoised for the same reason as StackedPhotos. */
const PhotoCarousel = memo(function PhotoCarousel(props: PhotoListProps) {
  const { title, items, itemsRef } = props;
  const carouselRef = useRef<HTMLDivElement>(null);
  useTrackVisiblePhoto(props, carouselRef, { threshold: 0.6 });

  return (
    <div
      ref={carouselRef}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Fotos"
      className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item, index) => (
        <div
          key={itemKey(item, index)}
          ref={(el) => {
            itemsRef.current[index] = el;
          }}
          data-index={index}
          role="group"
          aria-roledescription={item.kind === "video" ? "video" : "foto"}
          aria-label={`${index + 1} de ${items.length}`}
          className="relative h-[calc(100dvh-14rem)] min-h-80 w-full shrink-0 snap-center bg-surface"
        >
          {item.kind === "video" ? (
            <div className="absolute inset-0 flex items-center bg-black">
              <div className="relative aspect-video w-full">
                <TourVideo videoId={item.videoId} title={title} />
              </div>
            </div>
          ) : (
            <Image
              src={item.src}
              alt={`${title} — foto ${index + 1}`}
              fill
              sizes="100vw"
              loading={index === 0 ? "eager" : "lazy"}
              className="object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );
});
