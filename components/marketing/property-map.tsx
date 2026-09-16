"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- the Google Maps SDK is
   loaded at runtime and this project intentionally avoids the @types dependency. */

import { useEffect, useRef, useState } from "react";

import { loadGoogleMaps } from "@/lib/google-maps";
import { DELFOS_MAP_STYLE } from "@/lib/google-maps-style";
import {
  MEDELLIN_CENTER,
  formatPrice,
  formatPriceShort,
  type Property,
} from "@/components/marketing/properties";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type Status = "nokey" | "loading" | "ready" | "error";

function priceMarkerIcon(maps: any, label: string, active: boolean) {
  const width = Math.max(48, Math.round(18 + label.length * 8));
  const bg = active ? "#2db1fc" : "#ffffff";
  const fg = active ? "#ffffff" : "#063d65";
  const stroke = active ? "#2db1fc" : "#063d65";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="40" viewBox="0 0 ${width} 40">
    <rect x="1.5" y="1.5" width="${width - 3}" height="25" rx="12.5" fill="${bg}" stroke="${stroke}" stroke-width="1.5"/>
    <path d="M${width / 2 - 6} 26 L${width / 2} 35 L${width / 2 + 6} 26 Z" fill="${bg}"/>
    <text x="${width / 2}" y="18" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="12.5" font-weight="600" fill="${fg}">${label}</text>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(width, 40),
    anchor: new maps.Point(width / 2, 35),
  };
}

function buildInfoContent(property: Property) {
  const el = document.createElement("div");
  el.style.maxWidth = "220px";
  el.style.fontFamily = "-apple-system, system-ui, sans-serif";
  el.innerHTML = `
    <div style="font-weight:600;font-size:14px;color:#000000">${formatPrice(property)}</div>
    <div style="font-size:13px;color:#000000;margin-top:2px">${property.title}</div>
    <div style="font-size:12px;color:#063d65;margin-top:2px">${property.neighborhood}, ${property.city}</div>
    <div style="font-size:12px;color:#063d65;margin-top:4px">${property.beds} hab · ${property.baths} baños · ${property.area} m²</div>`;
  return el;
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
  const infoRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
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
      infoRef.current = new maps.InfoWindow();
      infoRef.current.addListener("closeclick", () => activateRef.current(null));
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
      const marker = new maps.Marker({
        map,
        position: { lat: property.lat, lng: property.lng },
        title: property.title,
        icon: priceMarkerIcon(maps, formatPriceShort(property), false),
        zIndex: 1,
      });
      marker.addListener("click", () => activateRef.current(property.slug));
      markersRef.current.set(property.slug, marker);
      bounds.extend(marker.getPosition());
    });

    map.fitBounds(bounds, 72);
  }, [results, status]);

  // Reflect the active property on the map.
  useEffect(() => {
    if (status !== "ready") return;
    const maps = window.google!.maps as any;

    markersRef.current.forEach((marker, slug) => {
      const property = results.find((item) => item.slug === slug);
      if (!property) return;
      const isActive = slug === activeSlug;
      marker.setIcon(priceMarkerIcon(maps, formatPriceShort(property), isActive));
      marker.setZIndex(isActive ? 999 : 1);
    });

    if (!activeSlug) {
      infoRef.current?.close();
      return;
    }

    const marker = markersRef.current.get(activeSlug);
    const property = results.find((item) => item.slug === activeSlug);
    if (marker && property) {
      infoRef.current.setContent(buildInfoContent(property));
      infoRef.current.open(mapRef.current, marker);
      mapRef.current.panTo(marker.getPosition());
    }
  }, [activeSlug, results, status]);

  return (
    <div className="relative size-full bg-surface-secondary">
      <div ref={containerRef} className="size-full" />
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
