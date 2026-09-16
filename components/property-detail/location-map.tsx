"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- the Google Maps SDK is
   loaded at runtime and this project intentionally avoids the @types dependency. */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CloseIcon, ExpandIcon, MapPinIcon, MaximizeIcon, MinimizeIcon } from "@/components/icons";
import { loadGoogleMaps } from "@/lib/google-maps";
import { createPinIcon, DELFOS_MAP_STYLE } from "@/lib/google-maps-style";
import type { Property } from "@/components/marketing/properties";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type Status = "nokey" | "loading" | "ready" | "error";

/** Renders its own Google Map instance — used both inline and inside the expand popup. */
function MapCanvas({ property }: { property: Property }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>(API_KEY ? "loading" : "nokey");

  useEffect(() => {
    if (!API_KEY || !containerRef.current) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      await loadGoogleMaps(API_KEY);
      if (cancelled || !containerRef.current) return;
      const maps = window.google!.maps as any;

      const position = { lat: property.lat, lng: property.lng };
      const map = new maps.Map(containerRef.current, {
        center: position,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: true,
        zoomControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        draggable: true,
        gestureHandling: "greedy",
        styles: DELFOS_MAP_STYLE,
      });
      new maps.Marker({ map, position, title: property.title, icon: createPinIcon(maps) });

      // Add custom zoom and street view controls
      const controlsContainer = document.createElement("div");
      controlsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 12px;
      `;

      const buttonStyle = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 4px;
        border: 1px solid rgb(229, 229, 229);
        background-color: rgb(255, 255, 255);
        color: rgb(96, 96, 96);
        font-size: 18px;
        cursor: pointer;
        transition: background-color 0.2s;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      `;

      const zoomInBtn = document.createElement("button");
      zoomInBtn.innerHTML = "+";
      zoomInBtn.style.cssText = buttonStyle;
      zoomInBtn.setAttribute("aria-label", "Zoom in");
      zoomInBtn.addEventListener("click", () => map.setZoom(Math.min(21, map.getZoom()! + 1)));
      zoomInBtn.addEventListener("mouseenter", () => {
        zoomInBtn.style.backgroundColor = "rgb(245, 245, 245)";
      });
      zoomInBtn.addEventListener("mouseleave", () => {
        zoomInBtn.style.backgroundColor = "rgb(255, 255, 255)";
      });

      const zoomOutBtn = document.createElement("button");
      zoomOutBtn.innerHTML = "−";
      zoomOutBtn.style.cssText = buttonStyle;
      zoomOutBtn.setAttribute("aria-label", "Zoom out");
      zoomOutBtn.addEventListener("click", () => map.setZoom(Math.max(0, map.getZoom()! - 1)));
      zoomOutBtn.addEventListener("mouseenter", () => {
        zoomOutBtn.style.backgroundColor = "rgb(245, 245, 245)";
      });
      zoomOutBtn.addEventListener("mouseleave", () => {
        zoomOutBtn.style.backgroundColor = "rgb(255, 255, 255)";
      });

      controlsContainer.appendChild(zoomInBtn);
      controlsContainer.appendChild(zoomOutBtn);
      map.controls[maps.ControlPosition.RIGHT_BOTTOM].push(controlsContainer);

      // The container can mount off-screen or change size (below the fold,
      // or toggling the popup's maximize state), which leaves the map canvas
      // blank/misaligned until it's told to resize and re-center.
      resizeObserver = new ResizeObserver(() => {
        maps.event.trigger(map, "resize");
        map.setCenter(position);
      });
      resizeObserver.observe(containerRef.current);

      setStatus("ready");
    })().catch((error) => {
      console.error("Google Maps failed to initialise:", error);
      if (!cancelled) setStatus("error");
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [property.lat, property.lng, property.title]);

  return (
    <div className="relative size-full bg-surface-secondary">
      <div ref={containerRef} className="size-full" />
      {status !== "ready" ? (
        <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted">
          {status === "loading" && "Cargando mapa…"}
          {status === "error" && "No se pudo cargar el mapa de Google."}
          {status === "nokey" && "Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY."}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Full-width Google Map for the listing's location, with an expand button
 * that opens a blurred-backdrop popup (toggleable between a windowed and a
 * maximized size) plus a "Cómo llegar" link. Falls back to a plain
 * placeholder when no coordinates are set yet.
 */
export function LocationMap({ property }: { property: Property }) {
  const hasCoordinates = property.lat != null && property.lng != null;
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [mounted] = useState(() => typeof document !== "undefined");

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!hasCoordinates) {
    return (
      <div className="mt-4 flex aspect-[21/9] w-full items-center justify-center overflow-hidden rounded-2xl border border-separator bg-surface-secondary">
        <MapPinIcon className="size-10 text-muted" />
      </div>
    );
  }

  return (
    <>
      <div className="relative mt-4 w-full overflow-hidden rounded-2xl border border-separator">
        <div className="h-[360px] w-full">
          <MapCanvas property={property} />
        </div>

        <button
          type="button"
          onClick={() => {
            setMaximized(true);
            setOpen(true);
          }}
          className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-separator bg-white/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
        >
          <ExpandIcon className="size-3.5" />
          Ver zona
        </button>

        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${property.lat},${property.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 border-t border-separator bg-surface px-4 py-3 text-sm font-semibold text-accent transition-colors hover:bg-surface-secondary"
        >
          <MapPinIcon className="size-4" />
          Cómo llegar
        </a>
      </div>

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
              <div
                className={`flex flex-col overflow-hidden bg-white shadow-2xl transition-all duration-200 ${
                  maximized
                    ? "size-full rounded-none"
                    : "h-[80vh] w-full max-w-5xl rounded-2xl"
                }`}
              >
                <div className="flex items-center justify-between border-b border-separator px-4 py-3">
                  <p className="truncate text-sm font-semibold text-foreground">{property.title}</p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setMaximized((value) => !value)}
                      aria-label={maximized ? "Minimizar" : "Maximizar"}
                      className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
                    >
                      {maximized ? (
                        <MinimizeIcon className="size-4" />
                      ) : (
                        <MaximizeIcon className="size-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Cerrar"
                      className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
                    >
                      <CloseIcon className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="relative flex-1">
                  <MapCanvas property={property} />
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
