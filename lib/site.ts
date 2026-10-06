/** Public origin for absolute URLs (Open Graph, canonical, JSON-LD). Override per environment with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://godelfos.co").replace(/\/+$/, "");
