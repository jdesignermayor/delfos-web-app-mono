/** GA4 measurement ID (public by design — it ships in every page's HTML). Override per environment if needed. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-T5HCGYSPY2";

/**
 * Analytics only runs in production builds, so local development doesn't
 * pollute the reports. Set NEXT_PUBLIC_GA_DEBUG=1 to also send from `next dev`
 * (events then show up in GA4 → Admin → DebugView).
 */
export const GA_DEBUG = process.env.NEXT_PUBLIC_GA_DEBUG === "1";
export const GA_ENABLED = Boolean(GA_ID) && (process.env.NODE_ENV === "production" || GA_DEBUG);

type Gtag = (command: "event", name: string, params: Record<string, unknown>) => void;
declare global {
  interface Window {
    gtag?: Gtag;
  }
}

/**
 * Sends a GA4 event once gtag.js is ready. The Google tag loads after the page
 * becomes interactive, so an event fired on mount (e.g. a property view) can
 * arrive first; it waits briefly for `window.gtag` instead of being dropped.
 */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (!GA_ENABLED || typeof window === "undefined") return;
  let attempts = 0;
  const send = () => {
    if (window.gtag) {
      window.gtag("event", name, params);
    } else if (attempts++ < 50) {
      setTimeout(send, 200); // up to ~10 s
    }
  };
  send();
}

/** GA4 ecommerce "item" for a listing, so property views and clicks report per property. */
export function propertyItem(
  property: { slug: string; title: string; price: number; type: string; city?: string; neighborhood?: string },
  index?: number,
) {
  return {
    item_id: property.slug,
    item_name: property.title,
    item_category: property.type,
    item_category2: property.neighborhood || property.city || undefined,
    price: property.price || undefined,
    index,
  };
}
