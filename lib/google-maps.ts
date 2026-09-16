/**
 * Minimal promise-based loader for the Google Maps JavaScript API, following
 * https://developers.google.com/maps/documentation/javascript/overview
 *
 * The script tag is injected once and shared across every caller. The API's
 * `callback` parameter resolves the promise only when `google.maps` is fully
 * ready. Consumers `await loadGoogleMaps(key)` then read `window.google.maps`.
 */

declare global {
  interface Window {
    // The Maps SDK is loaded at runtime; typed loosely to avoid a types dep.
    google?: { maps: Record<string, unknown> } & Record<string, unknown>;
    __delfosGoogleMapsInit?: () => void;
  }
}

const CALLBACK_NAME = "__delfosGoogleMapsInit";

let loaderPromise: Promise<void> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only be loaded in the browser"));
  }
  if (window.google?.maps) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<void>((resolve, reject) => {
    window[CALLBACK_NAME] = () => resolve();

    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      callback: CALLBACK_NAME,
      loading: "async",
      libraries: "marker",
    });

    const script = document.createElement("script");
    script.id = "google-maps-js";
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load the Google Maps script"));
    document.head.appendChild(script);
  });

  return loaderPromise;
}
