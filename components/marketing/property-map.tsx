"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- the Google Maps SDK is
   loaded at runtime and this project intentionally avoids the @types dependency. */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { loadGoogleMaps } from "@/lib/google-maps";
import { DELFOS_MAP_STYLE } from "@/lib/google-maps-style";
import {
  MEDELLIN_CENTER,
  formatPriceShort,
  type Property,
} from "@/components/marketing/properties";
import { MapPropertyPopup } from "@/components/marketing/map-property-popup";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type Status = "nokey" | "loading" | "ready" | "error";

/**
 * Positions an arbitrary DOM element over a lat/lng as a Google Maps
 * OverlayView. Used for both the price pins and the property popup: the
 * legacy `google.maps.Marker` is deprecated, `AdvancedMarkerElement` needs a
 * cloud mapId (which disables our custom `styles`), and `InfoWindow` forces
 * its own padding, close button and tail.
 */
type HtmlOverlay = {
  position: any;
  element: HTMLElement;
  setPosition: (position: any) => void;
  setMap: (map: any) => void;
};

let HtmlOverlayClass: any = null;

function createHtmlOverlay(maps: any, element: HTMLElement, position?: any): HtmlOverlay {
  if (!HtmlOverlayClass) {
    HtmlOverlayClass = class extends maps.OverlayView {
      position: any;
      element: HTMLElement;

      constructor(element: HTMLElement, position: any) {
        super();
        this.element = element;
        this.position = position;
        element.style.position = "absolute";
        maps.OverlayView.preventMapHitsAndGesturesFrom(element);
      }

      onAdd() {
        this.getPanes().floatPane.appendChild(this.element);
      }

      draw() {
        if (!this.position) return;
        const point = this.getProjection()?.fromLatLngToDivPixel(this.position);
        if (!point) return;
        this.element.style.left = `${point.x}px`;
        this.element.style.top = `${point.y}px`;
      }

      onRemove() {
        this.element.remove();
      }

      setPosition(position: any) {
        this.position = position;
        this.draw();
      }
    };
  }
  return new HtmlOverlayClass(element, position);
}

function priceMarkerElement(label: string, onClick: () => void) {
  const el = document.createElement("button");
  el.type = "button";
  el.textContent = label;
  Object.assign(el.style, {
    transform: "translate(-50%, -50%)",
    padding: "5px 10px",
    borderRadius: "999px",
    border: "none",
    font: "700 13px -apple-system, system-ui, sans-serif",
    whiteSpace: "nowrap",
    cursor: "pointer",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.18)",
    transition: "transform 150ms ease",
  });
  el.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  setMarkerActive(el, false);
  return el;
}

function setMarkerActive(el: HTMLElement, active: boolean) {
  el.style.background = active ? "#222222" : "#ffffff";
  el.style.color = active ? "#ffffff" : "#222222";
  el.style.zIndex = active ? "2" : "1";
  el.style.transform = active ? "translate(-50%, -50%) scale(1.08)" : "translate(-50%, -50%)";
}

export function PropertyMap({
  results,
  activeSlug,
  onActivate,
}: {
  results: Property[];
  activeSlug: string | null;
  onActivate: (slug: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const popupRef = useRef<HtmlOverlay | null>(null);
  const markersRef = useRef<Map<string, HtmlOverlay>>(new Map());
  const [popupContainer, setPopupContainer] = useState<HTMLElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [status, setStatus] = useState<Status>(API_KEY ? "loading" : "nokey");

  // Keep the latest callback without re-running the marker effects.
  const activateRef = useRef(onActivate);
  useEffect(() => {
    activateRef.current = onActivate;
  }, [onActivate]);

  // Initialise the map once.
  useEffect(() => {
    if (!API_KEY || !containerRef.current) return;
    let cancelled = false;

    (async () => {
      await loadGoogleMaps(API_KEY);
      if (cancelled || !containerRef.current) return;
      const maps = window.google!.maps as any;

      mapRef.current = new maps.Map(containerRef.current, {
        center: MEDELLIN_CENTER,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        draggable: true,
        gestureHandling: "greedy",
        styles: DELFOS_MAP_STYLE,
      });
      // Popup sits centred above its pin; React renders the card into it.
      const popupEl = document.createElement("div");
      Object.assign(popupEl.style, {
        transform: "translate(-50%, calc(-100% - 22px))",
        zIndex: "10",
      });
      popupRef.current = createHtmlOverlay(maps, popupEl);
      setPopupContainer(popupEl);
      mapRef.current.addListener("click", () => activateRef.current(null));

      // Keep the map painted correctly as its container is sized / resized.
      const observer = new ResizeObserver(() => {
        maps.event.trigger(mapRef.current, "resize");
      });
      observer.observe(containerRef.current);
      resizeObserverRef.current = observer;

      setStatus("ready");
    })().catch((error) => {
      console.error("Google Maps failed to initialise:", error);
      if (!cancelled) setStatus("error");
    });

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
    };
  }, []);

  // Rebuild markers whenever the result set changes.
  useEffect(() => {
    if (status !== "ready") return;
    const maps = window.google!.maps as any;
    const map = mapRef.current;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();

    if (results.length === 0) {
      map.setCenter(MEDELLIN_CENTER);
      map.setZoom(12);
      return;
    }

    const bounds = new maps.LatLngBounds();
    results.forEach((property) => {
      if (property.lat == null || property.lng == null) return;
      const marker = createHtmlOverlay(
        maps,
        priceMarkerElement(formatPriceShort(property), () => activateRef.current(property.slug)),
        new maps.LatLng(property.lat, property.lng),
      );
      marker.setMap(map);
      markersRef.current.set(property.slug, marker);
      bounds.extend(marker.position);
    });

    if (markersRef.current.size === 0) {
      map.setCenter(MEDELLIN_CENTER);
      map.setZoom(12);
      return;
    }
    map.fitBounds(bounds, 72);
    // A single pin (or tightly clustered pins) would otherwise zoom to street level.
    maps.event.addListenerOnce(map, "idle", () => {
      if (map.getZoom() > 15) map.setZoom(15);
    });
  }, [results, status]);

  // Reflect the active property on the map.
  useEffect(() => {
    if (status !== "ready") return;

    markersRef.current.forEach((marker, slug) =>
      setMarkerActive(marker.element, slug === activeSlug),
    );

    const marker = activeSlug ? markersRef.current.get(activeSlug) : undefined;
    if (!marker) {
      popupRef.current?.setMap(null);
      return;
    }

    popupRef.current!.setPosition(marker.position);
    popupRef.current!.setMap(mapRef.current);
    // Centre the pin in the lower part of the map so the card above it fits.
    mapRef.current.panTo(marker.position);
    mapRef.current.panBy(0, -170);
  }, [activeSlug, results, status]);

  // Only properties with coordinates have a pin to anchor the popup to.
  const activeProperty = results.find(
    (item) => item.slug === activeSlug && item.lat != null && item.lng != null,
  );

  return (
    <div className="relative size-full bg-surface-secondary">
      <div ref={containerRef} className="size-full" />
      {popupContainer && activeProperty
        ? createPortal(
            <MapPropertyPopup
              key={activeProperty.slug}
              property={activeProperty}
              onClose={() => onActivate(null)}
            />,
            popupContainer,
          )
        : null}
      {status !== "ready" ? (
        <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted">
          {status === "loading" && "Cargando mapa…"}
          {status === "error" && "No se pudo cargar el mapa de Google."}
          {status === "nokey" &&
            "Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en .env.local para ver el mapa."}
        </div>
      ) : null}
    </div>
  );
}
