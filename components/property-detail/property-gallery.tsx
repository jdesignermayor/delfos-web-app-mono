"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";

import type { Property } from "@/components/marketing/properties";
import { PhotoCollage } from "@/components/property-detail/photo-collage";

/** The tour is client-only and only needed after a click, so it ships as its own chunk. */
const loadPhotoTour = () => import("@/components/property-detail/photo-tour").then((mod) => mod.PhotoTour);
const PhotoTour = dynamic(loadPhotoTour, { ssr: false });

/** Every real photo of the listing, in the same order the collage indexes them. */
function getPhotos(property: Property) {
  if (property.images?.length) return property.images;
  return property.image ? [property.image] : [];
}

/**
 * Photo collage that opens a fullscreen "Recorrido gráfico" when a photo is
 * clicked. A YouTube video, when the listing has one, comes first in both. The tour always starts from the top, whichever photo was clicked.
 * It pushes a history entry so the browser/phone back button closes it
 * instead of leaving the page.
 */
export function PropertyGallery({ property, videoId }: { property: Property; videoId?: string | null }) {
  const photos = getPhotos(property);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onPopState = () => setIsOpen(false);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isOpen]);

  function open() {
    window.history.pushState(null, "", window.location.href);
    setIsOpen(true);
  }

  return (
    <>
      {/* Warm the tour chunk as soon as the user shows intent to open it. */}
      <div onPointerEnter={() => void loadPhotoTour()} onFocusCapture={() => void loadPhotoTour()}>
        <PhotoCollage property={property} videoId={videoId} onOpen={photos.length || videoId ? open : undefined} />
      </div>

      <AnimatePresence>
        {isOpen ? (
          <PhotoTour
            key="photo-tour"
            title={property.title}
            photos={photos}
            videoId={videoId}
            onClose={() => window.history.back()}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
