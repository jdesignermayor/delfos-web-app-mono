import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/** A failure whose message can be shown to the dashboard user as-is. */
export class ExtractionError extends Error {
  constructor(
    message: string,
    /** HTTP status when the site answered with an error. */
    readonly status?: number,
  ) {
    super(message);
  }
}

/** Statuses sites use to turn away automated clients; worth one retry looking like another browser. */
const BLOCKED_STATUSES = new Set([401, 403, 429, 503]);

export function isBlockedStatus(status: number | undefined): boolean {
  return status !== undefined && BLOCKED_STATUSES.has(status);
}

const MAX_REDIRECTS = 3;

/**
 * Many sites (WAFs, nginx rules) reject anything that announces itself as a
 * bot, so requests carry the headers a real browser sends. If the first
 * profile is rejected, the request is retried once with the second one.
 */
const BROWSER_PROFILES = [
  {
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
  },
  {
    "user-agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1",
  },
] as const;

/** What a browser is loading changes the Accept / Sec-Fetch headers it sends. */
export type ResourceKind = "document" | "style" | "image" | "manifest";

const KIND_HEADERS: Record<ResourceKind, Record<string, string>> = {
  document: {
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
  },
  style: { accept: "text/css,*/*;q=0.1", "sec-fetch-dest": "style", "sec-fetch-mode": "no-cors" },
  image: {
    accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "sec-fetch-dest": "image",
    "sec-fetch-mode": "no-cors",
  },
  manifest: { accept: "application/manifest+json,application/json,*/*;q=0.8", "sec-fetch-dest": "manifest", "sec-fetch-mode": "cors" },
};

function browserHeaders(kind: ResourceKind, profile: number, referer: URL | undefined): Record<string, string> {
  return {
    ...BROWSER_PROFILES[profile],
    ...KIND_HEADERS[kind],
    "accept-language": "es-CO,es;q=0.9,en;q=0.8",
    "sec-fetch-site": referer ? "same-origin" : "none",
    ...(referer ? { referer: referer.href } : {}),
  };
}

/** Loopback, private, link-local, CGNAT and other non-public IPv4 ranges. */
function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIPv4(v6.slice(7));
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

async function assertPublicHost(host: string): Promise<void> {
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (addresses.length === 0) {
    throw new ExtractionError("No pudimos encontrar ese sitio web. Revisa la URL.");
  }
  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new ExtractionError("Ese sitio web no es público.");
  }
}

export type FetchedResource = { url: URL; contentType: string; body: Buffer };

type FetchOptions = {
  /** Per-resource cap; the fetcher's overall byte budget still applies. */
  maxBytes: number;
  /** Per-resource timeout; the fetcher's overall deadline still applies. */
  timeoutMs: number;
  kind: ResourceKind;
  /** The page that "loads" this resource, sent as Referer like a browser would. */
  referer?: URL;
};

/**
 * Fetches public URLs for one extraction. All requests share one deadline and
 * one byte budget, so a slow or huge site can't hold the server longer than
 * `deadlineMs` or make it download more than `maxTotalBytes`. Host checks
 * (DNS + SSRF guard) run once per host.
 */
export function createPublicFetcher({ deadlineMs, maxTotalBytes }: { deadlineMs: number; maxTotalBytes: number }) {
  const deadline = AbortSignal.timeout(deadlineMs);
  const hostChecks = new Map<string, Promise<void>>();
  let bytesLeft = maxTotalBytes;

  /**
   * The server fetches URLs typed by users, so it must never be pointed at our
   * own network (SSRF): only http(s) on the default ports, to hosts that resolve
   * exclusively to public addresses.
   */
  function assertPublicUrl(url: URL): Promise<void> {
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return Promise.reject(new ExtractionError("Solo se admiten sitios web http o https."));
    }
    if (url.port && url.port !== "80" && url.port !== "443") {
      return Promise.reject(new ExtractionError("El sitio web debe usar el puerto estándar."));
    }
    const host = url.hostname.replace(/^\[|\]$/g, "");
    let check = hostChecks.get(host);
    if (!check) {
      check = assertPublicHost(host);
      hostChecks.set(host, check);
    }
    return check;
  }

  /** Reads at most `maxBytes` (and what's left of the budget), then stops downloading. */
  async function readLimited(response: Response, maxBytes: number): Promise<Buffer> {
    if (!response.body) return Buffer.alloc(0);
    const limit = Math.min(maxBytes, bytesLeft);
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < limit) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.byteLength;
    }
    await reader.cancel().catch(() => {});
    bytesLeft -= Math.min(size, limit);
    return Buffer.concat(chunks).subarray(0, limit);
  }

  /** One attempt with one browser profile, following redirects by hand so every hop is checked. */
  async function fetchWithProfile(
    input: string | URL,
    { maxBytes, timeoutMs, kind, referer }: FetchOptions,
    profile: number,
  ): Promise<FetchedResource> {
    if (bytesLeft <= 0) throw new ExtractionError("El sitio web es demasiado pesado para analizarlo.");
    const signal = AbortSignal.any([deadline, AbortSignal.timeout(timeoutMs)]);
    let url = new URL(input);

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertPublicUrl(url);
      const response = await fetch(url, {
        redirect: "manual",
        signal,
        headers: browserHeaders(kind, profile, referer),
        cache: "no-store",
      });

      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) {
        await response.body?.cancel().catch(() => {});
        url = new URL(location, url);
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel().catch(() => {});
        throw new ExtractionError(
          isBlockedStatus(response.status)
            ? `El sitio web bloqueó el acceso automático (${response.status}).`
            : `El sitio respondió con un error (${response.status}).`,
          response.status,
        );
      }
      return {
        url,
        contentType: response.headers.get("content-type") ?? "",
        body: await readLimited(response, maxBytes),
      };
    }
    throw new ExtractionError("El sitio web redirige demasiadas veces.");
  }

  /** GETs a public URL as a browser would; retried once with another browser profile if rejected. */
  async function fetchPublic(input: string | URL, options: FetchOptions): Promise<FetchedResource> {
    try {
      return await fetchWithProfile(input, options, 0);
    } catch (error) {
      if (!(error instanceof ExtractionError) || !isBlockedStatus(error.status) || deadline.aborted) throw error;
      return fetchWithProfile(input, options, 1);
    }
  }

  /** `fetchPublic` for secondary resources (stylesheets, images): failures are skipped, not fatal. */
  async function tryFetchPublic(input: string | URL, options: FetchOptions): Promise<FetchedResource | null> {
    try {
      return await fetchPublic(input, options);
    } catch {
      return null;
    }
  }

  return { fetchPublic, tryFetchPublic, isExpired: () => deadline.aborted };
}

export type PublicFetcher = ReturnType<typeof createPublicFetcher>;
