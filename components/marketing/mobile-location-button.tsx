"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { SearchIcon } from "@/components/icons";
import { LocationFields } from "@/components/marketing/location-fields";
import { DROPDOWN_MOTION } from "@/components/marketing/motion-presets";
import { useSearchMode } from "@/components/marketing/search-mode-context";
import { buildSearchHref } from "@/components/marketing/search-url";
import { useClickOutside } from "@/hooks/use-click-outside";

/** Mobile-only trigger that opens just the location panel, without the full search bar. */
export function MobileLocationButton() {
  const router = useRouter();
  const { mode } = useSearchMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [ubicacion, setUbicacion] = useState("");

  useClickOutside(containerRef, () => setOpen(false));

  function searchAt(location: string) {
    setOpen(false);
    router.push(buildSearchHref({ mode, location }));
  }

  function pickLocation(location: string) {
    setUbicacion(location);
    searchAt(location);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-label="Buscar por ubicación"
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-full border bg-white px-4 py-3 text-left text-foreground shadow-[0_2px_10px_-4px_rgba(15,23,42,0.18)] transition-colors ${
          open ? "border-foreground" : "border-separator"
        }`}
      >
        <SearchIcon className="size-5 shrink-0 text-muted" />
        <span className="truncate text-sm font-medium">{ubicacion || "Barrio, proyecto o ciudad"}</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            {...DROPDOWN_MOTION}
            className="absolute inset-x-0 top-full z-20 mt-2 origin-top rounded-3xl border border-separator bg-white p-5 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)]"
          >
            {/* A form so typing a place and pressing Enter (or "Buscar") searches, not only the chips. */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                searchAt(ubicacion);
              }}
              className="flex flex-col gap-4"
            >
              <LocationFields value={ubicacion} onValueChangeAction={setUbicacion} onPickAction={pickLocation} />
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
              >
                <SearchIcon className="size-4" />
                Buscar
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
