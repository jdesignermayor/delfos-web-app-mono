"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useSearchMode } from "@/components/marketing/search-mode-context";

const ANCHORS = [
  { id: "fotos", label: "Fotos" },
  { id: "servicios", label: "Servicios" },
  { id: "ubicacion", label: "Ubicación" },
];

/**
 * Wraps the photo collage, owns the ref that watches its own visibility, and
 * reveals a fixed anchor sub-nav (docked under the sticky site header) once
 * the gallery scrolls out of view.
 */
export function GallerySection({ children }: { children: ReactNode }) {
  const { navbarRef } = useSearchMode();
  const galleryRef = useRef<HTMLDivElement>(null);
  const [pastGallery, setPastGallery] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(0);

  useEffect(() => {
    function updateNavbarHeight() {
      setNavbarHeight(navbarRef.current?.offsetHeight ?? 0);
    }
    updateNavbarHeight();
    window.addEventListener("resize", updateNavbarHeight);
    return () => window.removeEventListener("resize", updateNavbarHeight);
  }, [navbarRef]);

  useEffect(() => {
    const target = galleryRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setPastGallery(!entry.isIntersecting),
      { rootMargin: `-${navbarHeight}px 0px 0px 0px` }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [navbarHeight]);

  return (
    <>
      <div ref={galleryRef} id="fotos" className="scroll-mt-24">
        {children}
      </div>

      <AnimatePresence>
        {pastGallery ? (
          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ top: navbarHeight }}
            className="fixed inset-x-0 z-40 border-b border-separator bg-background/90 backdrop-blur-xl"
          >
            <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-6">
              {ANCHORS.map((anchor) => (
                <a
                  key={anchor.id}
                  href={`#${anchor.id}`}
                  className="text-sm font-medium text-muted transition-colors hover:text-foreground"
                >
                  {anchor.label}
                </a>
              ))}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
