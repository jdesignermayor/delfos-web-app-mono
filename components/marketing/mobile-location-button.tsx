"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { SearchIcon } from "@/components/icons";
import { LocationFields } from "@/components/marketing/property-search";
import { useSearchMode } from "@/components/marketing/search-mode-context";

/** Mobile-only trigger that opens just the location panel, without the full search bar. */
export function MobileLocationButton() {
  const router = useRouter();
  const { mode } = useSearchMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [ubicacion, setUbicacion] = useState("");

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function goToSearch(location: string) {
    const params = new URLSearchParams();
    params.set("operacion", mode === "arrendar" ? "arrendar" : "comprar");
    if (mode === "proyecto") params.set("tipo", "proyecto");
    if (location.trim()) params.set("ubicacion", location.trim());
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Buscar por ubicación"
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-full border px-4 py-3 text-left transition-colors ${
          open
            ? "border-foreground bg-surface-secondary text-foreground"
            : "border-separator text-foreground hover:bg-surface-secondary"
        }`}
      >
        <SearchIcon className="size-5 shrink-0 text-muted" />
        <span className="truncate text-sm font-medium">
          {ubicacion || "Barrio, proyecto o ciudad"}
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute inset-x-0 top-full z-20 mt-2 origin-top rounded-3xl border border-separator bg-surface p-5 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)]"
          >
            <LocationFields
              value={ubicacion}
              onValueChangeAction={setUbicacion}
              onPickAction={(location) => {
                setUbicacion(location);
                setOpen(false);
                goToSearch(location);
              }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
