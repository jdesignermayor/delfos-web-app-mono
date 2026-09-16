"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- the Google Maps SDK is
   loaded at runtime and this project intentionally avoids the @types dependency. */

import { useEffect, useRef, useState } from "react";
import { Button, Input, Modal, TextField, useOverlayState } from "@heroui/react";

import { loadGoogleMaps } from "@/lib/google-maps";
import { createPinIcon, DELFOS_MAP_STYLE } from "@/lib/google-maps-style";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/** Medellín — used only when no coordinates are known yet. */
const DEFAULT_CENTER = { lat: 6.23, lng: -75.58 };

type LatLng = { lat: number; lng: number };
type Status = "nokey" | "loading" | "ready" | "error";

function geocodeAddress(geocoder: any, address: string): Promise<{
  address: string;
  coords: LatLng;
} | null> {
  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results: any[], status: string) => {
      if (status !== "OK" || !results?.[0]) {
        resolve(null);
        return;
      }
      const location = results[0].geometry.location;
      resolve({
        address: results[0].formatted_address,
        coords: { lat: location.lat(), lng: location.lng() },
      });
    });
  });
}

function reverseGeocode(geocoder: any, coords: LatLng): Promise<string | null> {
  return new Promise((resolve) => {
    geocoder.geocode({ location: coords }, (results: any[], status: string) => {
      if (status !== "OK" || !results?.[0]) {
        resolve(null);
        return;
      }
      resolve(results[0].formatted_address);
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
  onChange: (address: string, coords: LatLng) => void;
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
  const [isSearching, setIsSearching] = useState(false);

  function placeMarker(maps: any, coords: LatLng) {
    if (!markerRef.current) {
      markerRef.current = new maps.Marker({
        map: mapRef.current,
        position: coords,
        draggable: true,
        icon: createPinIcon(maps),
      });
      markerRef.current.addListener("dragend", async () => {
        const pos = markerRef.current.getPosition();
        const coords = { lat: pos.lat(), lng: pos.lng() };
        setDraftCoords(coords);
        const address = await reverseGeocode(geocoderRef.current, coords);
        if (address) setDraftAddress(address);
      });
    } else {
      markerRef.current.setPosition(coords);
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
      if (cancelled || !containerRef.current) return;
      const maps = window.google!.maps as any;

      geocoderRef.current = new maps.Geocoder();
      const center = coordinates ?? defaultCenter;
      mapRef.current = new maps.Map(containerRef.current, {
        center,
        zoom: coordinates ? 16 : 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        draggable: true,
        gestureHandling: "greedy",
        styles: DELFOS_MAP_STYLE,
      });

      if (coordinates) placeMarker(maps, coordinates);

      mapRef.current.addListener("click", async (event: any) => {
        const coords = { lat: event.latLng.lat(), lng: event.latLng.lng() };
        placeMarker(maps, coords);
        const address = await reverseGeocode(geocoderRef.current, coords);
        if (address) setDraftAddress(address);
      });

      setStatus("ready");
    })().catch((error) => {
      console.error("Google Maps failed to initialise:", error);
      if (!cancelled) setStatus("error");
    });

    return () => {
      cancelled = true;
      markerRef.current = null;
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the popup opens.
  }, [overlay.isOpen]);

  async function handleSearch() {
    if (!query.trim() || !geocoderRef.current) return;
    setIsSearching(true);
    const result = await geocodeAddress(geocoderRef.current, query.trim());
    setIsSearching(false);
    if (!result) return;

    const maps = window.google!.maps as any;
    placeMarker(maps, result.coords);
    mapRef.current.panTo(result.coords);
    mapRef.current.setZoom(16);
    setDraftAddress(result.address);
  }

  function handleConfirm() {
    if (!draftAddress || !draftCoords) return;
    onChange(draftAddress, draftCoords);
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
