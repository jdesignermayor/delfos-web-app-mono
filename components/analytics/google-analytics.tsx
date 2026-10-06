import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";

import { GA_DEBUG, GA_ENABLED, GA_ID } from "@/lib/analytics";

/**
 * Google Analytics 4 (gtag.js) via Next's official integration: the script
 * loads after the page is interactive, so it doesn't slow the first render.
 * Page views — including client-side navigations — are recorded by GA4's
 * enhanced measurement ("page changes based on browser history events", on by
 * default in the GA4 data stream).
 */
export function GoogleAnalytics() {
  if (!GA_ENABLED) return null;
  return <NextGoogleAnalytics gaId={GA_ID} debugMode={GA_DEBUG} />;
}
