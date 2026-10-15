/**
 * `next/image` qualities; each must be listed in `images.qualities` in
 * `next.config.ts`, or Next silently serves the closest allowed one.
 */

/**
 * Public listing photos (landing cards, property gallery). Uploads are
 * already WebP-compressed once, so re-encoding them at Next's default 75
 * stacks a second round of artifacts; 90 keeps them crisp.
 */
export const LISTING_IMAGE_QUALITY = 90;

/** Dashboard previews only need to be recognizable. */
export const DASHBOARD_IMAGE_QUALITY = 40;
