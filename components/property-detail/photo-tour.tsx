import {
  memo,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PropertyActions } from "@/components/property-detail/favorite-share-bar";

const DESKTOP_QUERY = "(min-width: 640px)";

function subscribeToDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const isDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

type PhotoListProps = {
  title: string;
  photos: string[];
  itemsRef: RefObject<(HTMLElement | null)[]>;
  onVisible: (index: number) => void;
};

/**
 * Fullscreen "Recorrido gráfico": thumbnails of every photo, then the photos
 * themselves — stacked on desktop, a one-per-screen carousel on phones. Only
 * the layout for the current viewport is mounted, so each photo loads once.
 * Loaded lazily by PropertyGallery (a client component) and never
 * server-rendered, so it needs no "use client" boundary of its own.
 */
export function PhotoTour({
  title,
  photos,
  onClose,
}: {
  title: string;
  photos: string[];
  onClose: () => void;
}) {
  const desktop = useSyncExternalStore(subscribeToDesktop, isDesktop);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);

  function goTo(index: number) {
    const target = Math.max(0, Math.min(photos.length - 1, index));
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
          type="button"
          onClick={onClose}
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-secondary"
        >
          <ChevronLeft className="size-5" />
        </button>
        <PropertyActions compact />
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-foreground">Recorrido gráfico</h2>
          <p className="mt-1 text-sm text-muted">
            {photos.length} {photos.length === 1 ? "foto" : "fotos"}
          </p>

          {/* Thumbnails: a swipeable strip on phones, a grid from `sm` up. */}
          <div
            ref={stripRef}
            className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 md:grid-cols-6 [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Ver foto ${index + 1}`}
                aria-current={active === index}
                className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg ring-2 ring-offset-2 transition sm:w-auto ${
                  active === index ? "ring-foreground" : "ring-transparent opacity-80 hover:opacity-100"
                }`}
              >
                <Image src={src} alt="" fill sizes="(min-width: 640px) 160px, 80px" className="object-cover" />
              </button>
            ))}
          </div>

          {desktop ? (
            <StackedPhotos
              title={title}
              photos={photos}
              itemsRef={itemsRef}
              onVisible={setActive}
              scrollRef={scrollRef}
            />
          ) : (
            <div className="relative mt-6 overflow-hidden rounded-2xl">
              <PhotoCarousel
                title={title}
                photos={photos}
                itemsRef={itemsRef}
                onVisible={setActive}
              />

              <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                {active + 1} / {photos.length}
              </span>

              {active > 0 ? (
                <button
                  type="button"
                  onClick={() => goTo(active - 1)}
                  aria-label="Foto anterior"
                  className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow"
                >
                  <ChevronLeft className="size-5" />
                </button>
              ) : null}
              {active < photos.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goTo(active + 1)}
                  aria-label="Foto siguiente"
                  className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow"
                >
                  <ChevronRight className="size-5" />
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </motion.div>,
    document.body
  );
}

/** Reports the photo in view (read from `data-index`) as the user scrolls or swipes. */
function useTrackVisiblePhoto(
  { photos, itemsRef, onVisible }: PhotoListProps,
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
    itemsRef.current.slice(0, photos.length).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
    // `options` is a literal at each call site; the observer only needs to follow the photo list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, itemsRef, onVisible, root]);
}

/** Desktop: every photo at full width, stacked. Memoised so changing the active photo doesn't re-render the list. */
const StackedPhotos = memo(function StackedPhotos(
  props: PhotoListProps & { scrollRef: RefObject<HTMLDivElement | null> }
) {
  const { title, photos, itemsRef, scrollRef } = props;
  // A photo counts as "current" while it crosses the middle of the viewport.
  useTrackVisiblePhoto(props, scrollRef, { rootMargin: "-45% 0px -45% 0px" });

  return (
    <div className="mt-8 flex flex-col gap-4">
      {photos.map((src, index) => (
        <figure
          key={`${src}-${index}`}
          ref={(el) => {
            itemsRef.current[index] = el;
          }}
          data-index={index}
          // Fixed frame: photos above can't shift the list while they load,
          // so jumping to a photo lands on it. `cover` fills it edge to edge,
          // lined up with the thumbnails above.
          className="relative aspect-[3/2] scroll-mt-6 overflow-hidden rounded-2xl bg-surface"
        >
          <Image
            src={src}
            alt={`${title} — foto ${index + 1}`}
            fill
            sizes="(min-width: 896px) 848px, calc(100vw - 48px)"
            // The tour opens at the top, so the first photo is visible straight away.
            loading={index === 0 ? "eager" : "lazy"}
            className="object-cover"
          />
        </figure>
      ))}
    </div>
  );
});

/** Phones: one photo per screen in a snapping carousel. Memoised for the same reason as StackedPhotos. */
const PhotoCarousel = memo(function PhotoCarousel(props: PhotoListProps) {
  const { title, photos, itemsRef } = props;
  const carouselRef = useRef<HTMLDivElement>(null);
  useTrackVisiblePhoto(props, carouselRef, { threshold: 0.6 });

  return (
    <div
      ref={carouselRef}
      className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {photos.map((src, index) => (
        <div
          key={`${src}-${index}`}
          ref={(el) => {
            itemsRef.current[index] = el;
          }}
          data-index={index}
          className="relative h-[calc(100dvh-14rem)] min-h-80 w-full shrink-0 snap-center bg-surface"
        >
          <Image
            src={src}
            alt={`${title} — foto ${index + 1}`}
            fill
            sizes="100vw"
            loading={index === 0 ? "eager" : "lazy"}
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
});
