"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";

import { LISTING_IMAGE_QUALITY } from "@/lib/image-quality";

/** Wider than this (width / height) counts as landscape. */
const LANDSCAPE_RATIO = 1.05;

const isLandscape = (img: HTMLImageElement) =>
  img.naturalHeight > 0 && img.naturalWidth / img.naturalHeight > LANDSCAPE_RATIO;

/**
 * A listing photo filling a tall frame (the highlighted cards and phone reels). Portrait and
 * square photos cover it. Landscape ones are shown whole, centred over a blurred copy of
 * themselves (as Instagram does): covering a tall frame would blow a small landscape photo up
 * several times and blur it. The blurred copy is fetched tiny — the blur hides it.
 */
export function FittedPhoto({
  src,
  alt,
  sizes,
  loading,
  className = "",
  style,
  onLoadAction,
}: {
  src: string;
  alt: string;
  sizes?: string;
  loading?: "eager" | "lazy";
  /** On the wrapper, e.g. its fade in a slideshow. */
  className?: string;
  style?: CSSProperties;
  /** The main photo finished loading (also when it already had, before hydration). */
  onLoadAction?: () => void;
}) {
  const [landscape, setLandscape] = useState(false);

  function handleLoaded(img: HTMLImageElement) {
    setLandscape(isLandscape(img));
    onLoadAction?.();
  }

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} style={style}>
      {landscape ? (
        <Image
          src={src}
          alt=""
          aria-hidden
          fill
          sizes="64px"
          className="scale-125 object-cover blur-2xl brightness-90"
        />
      ) : null}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        quality={LISTING_IMAGE_QUALITY}
        loading={loading}
        // An image that finished before hydration never fires onLoad, so check `complete` too.
        ref={(img) => {
          if (img?.complete && img.naturalWidth > 0) handleLoaded(img);
        }}
        onLoad={(event) => handleLoaded(event.currentTarget)}
        className={landscape ? "object-contain" : "object-cover"}
      />
    </div>
  );
}
