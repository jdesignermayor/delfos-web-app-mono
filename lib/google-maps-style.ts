/* eslint-disable @typescript-eslint/no-explicit-any -- the Google Maps SDK is
   loaded at runtime and this project intentionally avoids the @types dependency. */

/**
 * Shared Google Maps style used everywhere a map renders on the site — the
 * dashboard's location picker, the /search results map, and the property
 * detail page. Google's own default rendering (colors, landmark icons,
 * labels) — no custom overrides.
 */
export const DELFOS_MAP_STYLE: unknown[] = [];

/** A flat house-in-a-circle marker — solid navy fill, no gradients or shadows. */
export function createPinIcon(maps: any) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
      <path d="M15 32 L20 42 L25 32 Z" fill="#063d65"/>
      <circle cx="20" cy="18" r="16" fill="#063d65"/>
      <g transform="translate(20 18)">
        <path d="M0 -9 L-10 0 L-7 0 L-7 9 L-2 9 L-2 2 L2 2 L2 9 L7 9 L7 0 L10 0 Z" fill="#ffffff"/>
      </g>
    </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(40, 50),
    anchor: new maps.Point(20, 42),
  };
}
