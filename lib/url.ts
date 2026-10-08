/**
 * "proyecto.com" → "https://proyecto.com". Returns null for an empty value and
 * for anything that still isn't a valid http(s) URL.
 */
export function normalizeWebsiteUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    // Kept as typed (no trailing slash added); `URL` only validates it.
    return new URL(withProtocol).hostname.includes(".") ? withProtocol : null;
  } catch {
    return null;
  }
}
