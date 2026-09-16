"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- the Google Maps SDK is
   loaded at runtime and this project intentionally avoids the @types dependency. */

import { useEffect, useRef, useState } from "react";
import { Button, Input, Label, Modal, TextField, useOverlayState } from "@heroui/react";

import { loadGoogleMaps } from "@/lib/google-maps";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/** Medellín — used only when no coordinates are known yet. */
const DEFAULT_CENTER = { lat: 6.23, lng: -75.58 };

type LatLng = { lat: number; lng: number };
type Status = "nokey" | "loading" | "ready" | "error";

function geocodeAddress(geocoder: any, address: string): Promise<{
  address: string;
  coords: LatLng;
  city?: string;
  region?: string;
} | null> {
  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results: any[], status: string) => {
      if (status !== "OK" || !results?.[0]) {
        resolve(null);
        return;
      }
      const result = results[0];
      const location = result.geometry.location;
      let city = "";
      let region = "";

      if (result.address_components) {
        for (const component of result.address_components) {
          if (component.types.includes("locality")) {
            city = component.long_name;
          }
          if (component.types.includes("administrative_area_level_1")) {
            region = component.long_name;
          }
        }
      }

      resolve({
        address: result.formatted_address,
        coords: { lat: location.lat(), lng: location.lng() },
        city: city || undefined,
        region: region || undefined,
      });
    });
  });
}

function reverseGeocode(geocoder: any, coords: LatLng): Promise<{
  address: string;
  city?: string;
  region?: string;
} | null> {
  return new Promise((resolve) => {
    geocoder.geocode({ location: coords }, (results: any[], status: string) => {
      if (status !== "OK" || !results?.[0]) {
        resolve(null);
        return;
      }
      const result = results[0];
      let city = "";
      let region = "";

      if (result.address_components) {
        for (const component of result.address_components) {
          if (component.types.includes("locality")) {
            city = component.long_name;
          }
          if (component.types.includes("administrative_area_level_1")) {
            region = component.long_name;
          }
        }
      }

      resolve({
        address: result.formatted_address,
        city: city || undefined,
        region: region || undefined,
      });
    });
  });
}

/**
 * Reusable address picker: a read-only field that opens a Google Maps popup.
 * The user searches or clicks/drags a marker to a spot; the picked point is
 * reverse-geocoded into a formatted address string and reported via `onChange`.
 */
export function LocationPicker({
  label = "Ubicación",
  value,
  onChange,
  coordinates = null,
  defaultCenter = DEFAULT_CENTER,
  placeholder = "Selecciona una dirección en el mapa",
  isRequired,
}: {
  label?: string;
  value: string;
  onChange: (address: string, coords: LatLng, location?: string) => void;
  coordinates?: LatLng | null;
  defaultCenter?: LatLng;
  placeholder?: string;
  isRequired?: boolean;
}) {
  const overlay = useOverlayState();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const [status, setStatus] = useState<Status>(API_KEY ? "loading" : "nokey");
  const [query, setQuery] = useState("");
  const [draftAddress, setDraftAddress] = useState("");
  const [draftCoords, setDraftCoords] = useState<LatLng | null>(null);
  const [draftCity, setDraftCity] = useState("");
  const [draftRegion, setDraftRegion] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  function placeMarker(maps: any, coords: LatLng) {
    if (!markerRef.current) {
      const pinIcon = document.createElement("div");
      pinIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
          <path d="M15 32 L20 42 L25 32 Z" fill="#063d65"/>
          <circle cx="20" cy="18" r="16" fill="#063d65"/>
          <g transform="translate(20 18)">
            <path d="M0 -9 L-10 0 L-7 0 L-7 9 L-2 9 L-2 2 L2 2 L2 9 L7 9 L7 0 L10 0 Z" fill="#ffffff"/>
          </g>
        </svg>`;
      pinIcon.style.cursor = "grab";
      pinIcon.style.width = "40px";
      pinIcon.style.height = "50px";

      markerRef.current = new maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: coords,
        content: pinIcon,
        draggable: true,
      });

      markerRef.current.addListener("dragend", async () => {
        const pos = markerRef.current.position;
        const newCoords = { lat: pos.lat, lng: pos.lng };
        setDraftCoords(newCoords);
        const result = await reverseGeocode(geocoderRef.current, newCoords);
        if (result) {
          setDraftAddress(result.address);
          setDraftCity(result.city || "");
          setDraftRegion(result.region || "");
        }
      });
    } else {
      markerRef.current.position = coords;
    }
    setDraftCoords(coords);
  }

  // Initialise the map once the popup opens.
  useEffect(() => {
    if (!overlay.isOpen || !API_KEY || !containerRef.current) return;
    let cancelled = false;

    setDraftAddress(value);
    setDraftCoords(coordinates);
    setQuery("");

    (async () => {
      await loadGoogleMaps(API_KEY);
      if (cancelled || !containerRef.current) {
        console.warn("Map init cancelled or container unavailable");
        return;
      }

      // Ensure container has dimensions
      const container = containerRef.current;
      if (!container.offsetHeight || !container.offsetWidth) {
        console.warn("Container has no dimensions", { height: container.offsetHeight, width: container.offsetWidth });
        return;
      }

      const maps = window.google!.maps as any;

      try {
        geocoderRef.current = new maps.Geocoder();
        const center = coordinates ?? defaultCenter;

        if (mapRef.current) {
          mapRef.current = null;
        }

        mapRef.current = new maps.Map(container, {
          center,
          zoom: coordinates ? 16 : 12,
          mapId: "DEMO_MAP_ID",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          draggable: true,
          gestureHandling: "greedy",
        });

        if (coordinates) placeMarker(maps, coordinates);

        mapRef.current.addListener("click", async (event: any) => {
          const coords = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          placeMarker(maps, coords);
          const result = await reverseGeocode(geocoderRef.current, coords);
          if (result) {
            setDraftAddress(result.address);
            setDraftCity(result.city || "");
            setDraftRegion(result.region || "");
          }
        });

        setStatus("ready");
      } catch (error) {
        console.error("Google Maps initialization error:", error);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      markerRef.current = null;
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the popup opens.
  }, [overlay.isOpen]);

  async function handleSearch() {
    if (!query.trim() || !geocoderRef.current) {
      console.warn("Search failed: query or geocoder not ready", { query: query.trim(), geocoder: !!geocoderRef.current });
      return;
    }
    setIsSearching(true);
    try {
      const result = await geocodeAddress(geocoderRef.current, query.trim());
      if (!result) {
        console.warn("Geocoding returned no result for query:", query.trim());
        setIsSearching(false);
        return;
      }

      const maps = window.google!.maps as any;
      placeMarker(maps, result.coords);
      if (mapRef.current) {
        mapRef.current.panTo(result.coords);
        mapRef.current.setZoom(16);
      }
      setDraftAddress(result.address);
      setDraftCoords(result.coords);
      setDraftCity(result.city || "");
      setDraftRegion(result.region || "");
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }

  function handleConfirm() {
    if (!draftAddress || !draftCoords) return;
    const location = [draftCity, draftRegion].filter(Boolean).join(", ");
    onChange(draftAddress, draftCoords, location || undefined);
    overlay.close();
  }

  return (
    <>
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          {label}
          {isRequired ? <span className="text-danger"> *</span> : null}
        </label>
        <div className="flex gap-2">
          <input
            readOnly
            value={value}
            placeholder={placeholder}
            onClick={() => overlay.open()}
            className="h-10 w-full cursor-pointer rounded-lg border border-separator bg-surface px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-focus/30"
          />
          <Button type="button" variant="outline" onPress={() => overlay.open()}>
            Mapa
          </Button>
        </div>
      </div>

      <Modal state={overlay}>
        <Modal.Backdrop className="light" style={{ colorScheme: "light" }}>
          <Modal.Container size="lg" placement="center">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Selecciona la ubicación</Modal.Heading>
              </Modal.Header>

              <Modal.Body>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <TextField
                      value={query}
                      onChange={setQuery}
                      fullWidth
                      validationBehavior="aria"
                    >
                      <Label className="sr-only">Busca una dirección</Label>
                      <Input placeholder="Busca una dirección…" />
                    </TextField>
                    <Button
                      type="button"
                      variant="outline"
                      onPress={handleSearch}
                      isDisabled={isSearching || status !== "ready"}
                    >
                      {isSearching ? "Buscando…" : "Buscar"}
                    </Button>
                  </div>

                  <div className="relative h-80 w-full overflow-hidden rounded-lg bg-surface-secondary">
                    <div ref={containerRef} className="size-full" />
                    {status !== "ready" ? (
                      <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted">
                        {status === "loading" && "Cargando mapa…"}
                        {status === "error" && "No se pudo cargar el mapa de Google."}
                        {status === "nokey" &&
                          "Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en .env.local."}
                      </div>
                    ) : null}
                  </div>

                  <p className="text-sm text-muted">
                    Haz clic en el mapa o arrastra el marcador para ajustar el punto exacto.
                  </p>

                  {draftAddress ? (
                    <p className="rounded-lg bg-surface-secondary px-3 py-2 text-sm">
                      {draftAddress}
                    </p>
                  ) : null}
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button type="button" variant="outline" onPress={() => overlay.close()}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onPress={handleConfirm}
                  isDisabled={!draftAddress || !draftCoords}
                >
                  Usar esta dirección
                </Button>
              </Modal.Footer>

              <Modal.CloseTrigger />
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
