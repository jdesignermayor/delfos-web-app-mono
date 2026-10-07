/**
 * Placeholder for `next/image` while the optimized image is generated:
 * a soft, animated shimmer (same idea as Next's `placeholder="blur"`, but it
 * needs no per-image data). Neutral grays read fine in light and dark mode.
 */
const SHIMMER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9" preserveAspectRatio="none">
<defs><linearGradient id="g" x1="0" x2="1">
<stop offset="0" stop-color="#9ca3af" stop-opacity=".18"/>
<stop offset=".5" stop-color="#9ca3af" stop-opacity=".38"/>
<stop offset="1" stop-color="#9ca3af" stop-opacity=".18"/>
</linearGradient></defs>
<rect width="16" height="9" fill="#9ca3af" fill-opacity=".18"/>
<rect width="16" height="9" fill="url(#g)">
<animate attributeName="x" from="-16" to="16" dur="1.2s" repeatCount="indefinite"/>
</rect></svg>`;

export const IMAGE_PLACEHOLDER: `data:image/${string}` = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SHIMMER_SVG)}`;
