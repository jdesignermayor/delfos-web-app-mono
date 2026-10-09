/* eslint-disable @typescript-eslint/no-explicit-any -- the Google Maps SDK is
   loaded at runtime and this project intentionally avoids the @types dependency. */

/**
 * Shared Google Maps style used everywhere a map renders on the site — the
 * dashboard's location picker, the /search results map, and the property
 * detail page. Google's own default rendering (colors, landmark icons,
 * labels) — no custom overrides.
 */
export const DELFOS_MAP_STYLE: unknown[] = [];

/**
 * A house-in-a-circle marker in a bright red with a white ring and a soft
 * drop shadow, sized so it stands out against Google's blue/grey basemap.
 */
export function createPinIcon(maps: any) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="74" viewBox="0 0 60 74">
      <defs>
        <filter id="s" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <g filter="url(#s)">
        <path d="M22 46 L30 64 L38 46 Z" fill="#e53935" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="30" cy="27" r="23" fill="#e53935" stroke="#ffffff" stroke-width="3"/>
      </g>
      <g transform="translate(30 27) scale(1.35)">
        <path d="M0 -9 L-10 0 L-7 0 L-7 9 L-2 9 L-2 2 L2 2 L2 9 L7 9 L7 0 L10 0 Z" fill="#ffffff"/>
      </g>
    </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(60, 74),
    anchor: new maps.Point(30, 64),
  };
}
