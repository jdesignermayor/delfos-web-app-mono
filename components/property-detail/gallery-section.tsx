"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Images, MapPin, Sparkles } from "lucide-react";

import { useSearchMode } from "@/components/marketing/search-mode-context";

const ANCHORS = [
  { id: "fotos", label: "Fotos", icon: Images },
  { id: "servicios", label: "Servicios", icon: Sparkles },
  { id: "ubicacion", label: "Ubicación", icon: MapPin },
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
  const [activeId, setActiveId] = useState(ANCHORS[0].id);

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

  // The active tab is the last section whose top has scrolled under the sticky headers.
  useEffect(() => {
    if (!pastGallery) return;
    let frame = 0;
    function update() {
      frame = 0;
      const offset = navbarHeight + 96;
      let current = ANCHORS[0].id;
      for (const anchor of ANCHORS) {
        const top = document.getElementById(anchor.id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= offset) current = anchor.id;
      }
      setActiveId(current);
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [pastGallery, navbarHeight]);

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
            className="fixed inset-x-0 z-40 border-b border-separator bg-white/95 backdrop-blur-xl"
          >
            <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 sm:gap-2 sm:px-6">
              {ANCHORS.map(({ id, label, icon: Icon }) => {
                const active = id === activeId;
                return (
                  <a
                    key={id}
                    href={`#${id}`}
                    aria-current={active ? "location" : undefined}
                    className={`relative flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
                      active ? "text-foreground" : "text-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                    {active ? (
                      <motion.span
                        layoutId="property-tab-indicator"
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-foreground"
                      />
                    ) : null}
                  </a>
                );
              })}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
