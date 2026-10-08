import "server-only";

import { unstable_cache } from "next/cache";
import sharp from "sharp";

import { BRAND_COLOR_KEYS, type BrandColorKey, type BrandColors } from "@/lib/brand-colors";
import {
  colorDistance,
  colorsIn,
  isChromatic,
  isNearWhite,
  parseColor,
  toHex,
  type Rgb,
} from "@/lib/brand-color-extraction/color";
import {
  createPublicFetcher,
  ExtractionError,
  isBlockedStatus,
  type PublicFetcher,
} from "@/lib/brand-color-extraction/safe-fetch";

/**
 * Finds a website's brand palette without a headless browser: every place a
 * site declares color (theme-color, manifest, CSS custom properties, CSS
 * rules) casts weighted votes; when the CSS isn't conclusive, the logo /
 * share image pixels vote too. The strongest distinct colors become
 * primary, secondary and tertiary.
 */

/** Whole extraction: no site can hold the server longer or make it download more than this. */
const EXTRACTION_BUDGET = { deadlineMs: 15_000, maxTotalBytes: 6_000_000 };
const PAGE_LIMITS = { maxBytes: 1_000_000, timeoutMs: 8_000, kind: "document" } as const;
const STYLESHEET_LIMITS = { maxBytes: 1_000_000, timeoutMs: 5_000, kind: "style" } as const;
const MANIFEST_LIMITS = { maxBytes: 100_000, timeoutMs: 5_000, kind: "manifest" } as const;
/** Logos and icons weigh a few KB; anything heavier is cut off and skipped rather than downloaded. */
const IMAGE_LIMITS = { maxBytes: 512_000, timeoutMs: 5_000, kind: "image" } as const;
/**
 * Fallback when a site blocks automated access to its pages: Google's public
 * favicon service returns the site's icon (only the domain is sent), which
 * still carries the logo colors.
 */
const FAVICON_SERVICE = "https://www.google.com/s2/favicons?sz=128&domain=";
const MAX_STYLESHEETS = 4;
const MAX_IMAGES = 2;
/** Font services: their CSS never holds brand colors, so it isn't worth a request. */
const SKIPPED_STYLESHEET_HOSTS = /(^|\.)(fonts\.googleapis\.com|use\.typekit\.net|fonts\.bunny\.net|use\.fontawesome\.com)$/i;
/** Vendor libraries and CMS core CSS: their colors are the library's, never the brand's. */
const VENDOR_STYLESHEET =
  /bootstrap|owl\.carousel|fancybox|swiper|slick|splide|glide|animate|aos\.|font-?awesome|dashicons|jquery|select2|magnific|lightbox|photoswipe|normalize|reset\.|tailwind|bulma|foundation|\/wp-includes\//i;
/** Where a site's own styles usually live; fetched first. */
const OWN_STYLESHEET = /\/themes?\/|\/(main|style|styles|theme|app|site|custom|global|brand)[\w.-]*\.css/i;
/** Caps decoding work on huge or malicious images (≈ 2000 × 2000). */
const MAX_IMAGE_PIXELS = 4_000_000;
/**
 * Images are only sampled for their dominant colors, so they're shrunk to a
 * tiny thumbnail: 24 × 24 is ~600 pixels, plenty for a palette. SVGs are
 * rasterized at a low density so they never render large in the first place.
 */
const THUMBNAIL_SIZE = 24;
const SVG_DENSITY = 24;

// Images live only in RAM for the few milliseconds it takes to sample them:
// nothing is written to disk, and libvips' operation cache is off so decoded
// pixels aren't kept in memory after each analysis.
sharp.cache(false);
/** A site's palette rarely changes; re-extracting it within this window is served from cache. */
const CACHE_SECONDS = 7 * 24 * 60 * 60;
/** Bump when the algorithm changes so cached palettes are recomputed. */
const CACHE_VERSION = "brand-colors-v4";
/** Colors closer than this are treated as the same brand color. */
const SAME_COLOR_DISTANCE = 60;

/** How much one occurrence counts, by where it was found. */
const WEIGHT = {
  themeColor: 40,
  manifest: 30,
  roleVariable: 25,
  brandVariable: 15,
  background: 3,
  fillOrStroke: 2,
  text: 1,
  other: 0.5,
  variable: 0.3,
  /** Per image, split across that image's palette by pixel share. */
  image: 20,
} as const;

/** Custom-property names that say which role a color plays. */
const ROLE_HINTS: [BrandColorKey, RegExp][] = [
  ["primary", /primary|brand|main/],
  ["secondary", /secondary/],
  ["tertiary", /tertiary|accent/],
];

/** Framework palette variables (Tailwind, etc.) list every color, not the brand's. */
const PALETTE_VARIABLE =
  /^--(tw-|bs-|color-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|grey|zinc|neutral|stone|black|white)\b)/;

/**
 * Default palettes shipped by the frameworks and builders most sites use. A
 * site full of them is showing its template, not its brand, so they never vote.
 */
const FRAMEWORK_DEFAULTS = [
  // Bootstrap 5 theme colors and their alert/"subtle" backgrounds
  "#0d6efd", "#6c757d", "#198754", "#0dcaf0", "#ffc107", "#dc3545", "#f8f9fa", "#212529",
  "#cfe2ff", "#e2e3e5", "#d1e7dd", "#cff4fc", "#fff3cd", "#f8d7da", "#0a58ca", "#6610f2", "#6f42c1", "#d63384", "#fd7e14", "#20c997",
  // Bootstrap 4
  "#007bff", "#28a745", "#17a2b8", "#343a40",
  // Elementor global colors
  "#6ec1e4", "#54595f", "#7a7a7a", "#61ce70",
  // WordPress (Gutenberg) default palette
  "#cf2e2e", "#ff6900", "#fcb900", "#7bdcb5", "#00d084", "#8ed1fc", "#0693e3", "#abb8c3", "#9b51e0", "#f78da7",
]
  .map(parseColor)
  .filter((color): color is Rgb => color !== null);

function isFrameworkDefault(color: Rgb): boolean {
  return FRAMEWORK_DEFAULTS.some((preset) => colorDistance(preset, color) < 4);
}

type Candidate = { color: Rgb; score: number; roles: Set<BrandColorKey> };

/** Accumulates votes, merging near-identical shades into one candidate. */
class ColorVotes {
  private candidates: Candidate[] = [];

  add(color: Rgb, score: number, role?: BrandColorKey) {
    if (isFrameworkDefault(color)) return;
    const existing = this.candidates.find((candidate) => colorDistance(candidate.color, color) < SAME_COLOR_DISTANCE / 2);
    if (existing) {
      existing.score += score;
      if (role) existing.roles.add(role);
      return;
    }
    this.candidates.push({ color, score, roles: new Set(role ? [role] : []) });
  }

  ranked(): Candidate[] {
    return [...this.candidates].sort((a, b) => b.score - a.score);
  }

  chromaticCount(): number {
    return this.candidates.filter((candidate) => isChromatic(candidate.color)).length;
  }
}

/* ---------------------------------------------------------------------------
 * HTML helpers (regex-based: we only need a handful of tags and attributes)
 * ------------------------------------------------------------------------- */

function tags(html: string, name: string): string[] {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) ?? [];
}

function attr(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match ? (match[2] ?? match[3] ?? match[4]) : undefined;
}

function resolve(href: string | undefined, base: URL): URL | null {
  if (!href) return null;
  try {
    return new URL(href.replace(/&amp;/g, "&"), base);
  } catch {
    return null;
  }
}

function metaContent(html: string, names: string[]): string[] {
  return tags(html, "meta")
    .filter((tag) => names.includes((attr(tag, "name") ?? attr(tag, "property") ?? "").toLowerCase()))
    .map((tag) => attr(tag, "content") ?? "");
}

function linksByRel(html: string, base: URL, rel: RegExp): URL[] {
  return tags(html, "link")
    .filter((tag) => rel.test(attr(tag, "rel") ?? ""))
    .map((tag) => resolve(attr(tag, "href"), base))
    .filter((url): url is URL => url !== null);
}

/* ---------------------------------------------------------------------------
 * Sources
 * ------------------------------------------------------------------------- */

function voteThemeColors(html: string, votes: ColorVotes) {
  for (const content of metaContent(html, ["theme-color", "msapplication-tilecolor"])) {
    const color = parseColor(content);
    if (color) votes.add(color, WEIGHT.themeColor, "primary");
  }
}

async function voteManifest(html: string, base: URL, votes: ColorVotes, fetcher: PublicFetcher) {
  const [manifestUrl] = linksByRel(html, base, /\bmanifest\b/i);
  if (!manifestUrl) return;
  const manifest = await fetcher.tryFetchPublic(manifestUrl, { ...MANIFEST_LIMITS, referer: base });
  if (!manifest) return;
  try {
    const { theme_color: theme, background_color: background } = JSON.parse(manifest.body.toString("utf8"));
    const themeColor = typeof theme === "string" ? parseColor(theme) : null;
    const backgroundColor = typeof background === "string" ? parseColor(background) : null;
    if (themeColor) votes.add(themeColor, WEIGHT.manifest, "primary");
    if (backgroundColor) votes.add(backgroundColor, WEIGHT.manifest / 2);
  } catch {
    // Not valid JSON — ignore the manifest.
  }
}

function propertyWeight(property: string): number {
  if (property === "background" || property === "background-color" || property === "background-image") {
    return WEIGHT.background;
  }
  if (property === "fill" || property === "stroke") return WEIGHT.fillOrStroke;
  if (property === "color") return WEIGHT.text;
  return WEIGHT.other;
}

function variableVote(name: string): { weight: number; role?: BrandColorKey } {
  if (PALETTE_VARIABLE.test(name)) return { weight: 0 };
  const role = ROLE_HINTS.find(([, pattern]) => pattern.test(name))?.[0];
  if (role) return { weight: WEIGHT.roleVariable, role };
  if (/color|colour/.test(name)) return { weight: WEIGHT.brandVariable };
  return { weight: WEIGHT.variable };
}

/** Votes for every color declared in a chunk of CSS (stylesheet, <style> or style="…"). */
function voteCss(css: string, votes: ColorVotes) {
  for (const [, rawProperty, value] of css.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)/gi)) {
    const property = rawProperty.toLowerCase();
    const colors = colorsIn(value);
    if (colors.length === 0) continue;

    const { weight, role } = property.startsWith("--")
      ? variableVote(property)
      : { weight: propertyWeight(property), role: undefined };
    if (weight === 0) continue;
    for (const color of colors) votes.add(color, weight, role);
  }
}

function inlineCss(html: string): string {
  const styleBlocks = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(([, css]) => css);
  const styleAttributes = [...html.matchAll(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi)].map(
    ([, , double, single]) => double ?? single,
  );
  return [...styleBlocks, ...styleAttributes].join("\n");
}

/** Lower goes first: the site's own theme CSS, then other same-site CSS, then plugins and other hosts. */
function stylesheetPriority(url: URL): number {
  if (OWN_STYLESHEET.test(url.pathname) && !/\/plugins\//i.test(url.pathname)) return 0;
  if (/\/plugins\//i.test(url.pathname)) return 2;
  return 1;
}

async function voteStylesheets(html: string, base: URL, votes: ColorVotes, fetcher: PublicFetcher) {
  const stylesheets = linksByRel(html, base, /\bstylesheet\b/i)
    .filter((url) => !SKIPPED_STYLESHEET_HOSTS.test(url.hostname) && !VENDOR_STYLESHEET.test(url.pathname))
    .sort((a, b) => stylesheetPriority(a) - stylesheetPriority(b))
    .slice(0, MAX_STYLESHEETS);
  const sheets = await Promise.all(
    stylesheets.map((url) => fetcher.tryFetchPublic(url, { ...STYLESHEET_LIMITS, referer: base })),
  );
  for (const sheet of sheets) {
    if (sheet) voteCss(sheet.body.toString("utf8"), votes);
  }
}

/** Lightest and most brand-specific first: logo, then icons; the share image (heaviest) last. */
function brandImageUrls(html: string, base: URL): URL[] {
  const logos = tags(html, "img")
    .filter((tag) => /logo/i.test(`${attr(tag, "src") ?? ""} ${attr(tag, "alt") ?? ""} ${attr(tag, "class") ?? ""}`))
    .map((tag) => resolve(attr(tag, "src"), base));
  const shareImages = metaContent(html, ["og:image", "twitter:image"]).map((content) => resolve(content, base));
  const icons = linksByRel(html, base, /apple-touch-icon|\bicon\b/i);

  const unique = new Map<string, URL>();
  for (const url of [...logos, ...icons, ...shareImages]) {
    if (url && !url.protocol.startsWith("data")) unique.set(url.href, url);
  }
  return [...unique.values()].slice(0, MAX_IMAGES);
}

/**
 * Most common colors of an image, bucketed so similar pixels count together.
 * The image is decoded straight into a tiny raw RGBA buffer (JPEG/WebP use
 * shrink-on-load, so the full-size image is never materialized).
 */
async function imagePalette(body: Buffer): Promise<{ color: Rgb; share: number }[]> {
  const { data, info } = await sharp(body, {
    density: SVG_DENSITY,
    limitInputPixels: MAX_IMAGE_PIXELS,
    sequentialRead: true,
    failOn: "none",
  })
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: "inside", kernel: "nearest", fastShrinkOnLoad: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map<number, { r: number; g: number; b: number; count: number }>();
  let opaquePixels = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3] < 128) continue;
    opaquePixels += 1;
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0 };
    bucket.r += data[i];
    bucket.g += data[i + 1];
    bucket.b += data[i + 2];
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map(({ r, g, b, count }) => ({
      color: { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) },
      share: count / Math.max(opaquePixels, 1),
    }));
}

async function voteImages(html: string, base: URL, votes: ColorVotes, fetcher: PublicFetcher) {
  const palettes = await Promise.all(
    brandImageUrls(html, base).map(async (url) => {
      const image = await fetcher.tryFetchPublic(url, { ...IMAGE_LIMITS, referer: base });
      if (!image || !/^image\//.test(image.contentType)) return [];
      return imagePalette(image.body).catch(() => []);
    }),
  );
  for (const palette of palettes) {
    for (const { color, share } of palette) votes.add(color, WEIGHT.image * share);
  }
}

/* ---------------------------------------------------------------------------
 * Ranking
 * ------------------------------------------------------------------------- */

/**
 * Hinted roles first (e.g. `--secondary`), then by score; brand colors before
 * neutrals, and each pick distinct from the ones already chosen.
 */
function assignRoles(ranked: Candidate[]): BrandColors {
  const chosen = new Map<BrandColorKey, Rgb>();
  const isDistinct = (color: Rgb) =>
    [...chosen.values()].every((picked) => colorDistance(picked, color) >= SAME_COLOR_DISTANCE);

  for (const role of BRAND_COLOR_KEYS) {
    const hinted = ranked.find(
      (candidate) => candidate.roles.has(role) && !isNearWhite(candidate.color) && isDistinct(candidate.color),
    );
    if (hinted) chosen.set(role, hinted.color);
  }

  const pools = [
    ranked.filter((candidate) => isChromatic(candidate.color)),
    ranked.filter((candidate) => !isNearWhite(candidate.color)),
  ];
  for (const pool of pools) {
    for (const role of BRAND_COLOR_KEYS) {
      if (chosen.has(role)) continue;
      const next = pool.find((candidate) => isDistinct(candidate.color));
      if (next) chosen.set(role, next.color);
    }
  }

  return Object.fromEntries(
    BRAND_COLOR_KEYS.map((role) => [role, chosen.has(role) ? toHex(chosen.get(role)!) : ""]),
  ) as BrandColors;
}

/** Colors from the site's icon alone, for sites that block their pages; null if it has no brand colors. */
async function colorsFromFavicon(websiteUrl: string, fetcher: PublicFetcher): Promise<BrandColors | null> {
  const { hostname } = new URL(websiteUrl);
  const icon = await fetcher.tryFetchPublic(`${FAVICON_SERVICE}${encodeURIComponent(hostname)}`, IMAGE_LIMITS);
  if (!icon || !/^image\//.test(icon.contentType)) return null;

  const votes = new ColorVotes();
  for (const { color, share } of await imagePalette(icon.body).catch(() => [])) {
    votes.add(color, WEIGHT.image * share);
  }
  // The service's generic globe for unknown sites is gray: no brand color there.
  return votes.chromaticCount() > 0 ? assignRoles(votes.ranked()) : null;
}

async function fetchPage(websiteUrl: string, fetcher: PublicFetcher) {
  try {
    return await fetcher.fetchPublic(websiteUrl, PAGE_LIMITS);
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    throw new ExtractionError("No pudimos abrir el sitio web. Revisa la URL o inténtalo más tarde.");
  }
}

async function extractUncached(websiteUrl: string): Promise<BrandColors> {
  const fetcher = createPublicFetcher(EXTRACTION_BUDGET);

  let page;
  try {
    page = await fetchPage(websiteUrl, fetcher);
  } catch (error) {
    // Blocked even with browser headers (e.g. a JavaScript challenge): fall back to the site's icon.
    if (error instanceof ExtractionError && isBlockedStatus(error.status)) {
      const fallback = await colorsFromFavicon(websiteUrl, fetcher);
      if (fallback) return fallback;
    }
    throw error;
  }
  if (!/html/i.test(page.contentType)) {
    throw new ExtractionError("La URL no es una página web.");
  }

  const html = page.body.toString("utf8");
  const votes = new ColorVotes();

  voteThemeColors(html, votes);
  voteCss(inlineCss(html), votes);
  await Promise.all([
    voteManifest(html, page.url, votes, fetcher),
    voteStylesheets(html, page.url, votes, fetcher),
  ]);
  // Images are slower and noisier: only when the CSS didn't give a full palette and time is left.
  if (votes.chromaticCount() < BRAND_COLOR_KEYS.length && !fetcher.isExpired()) {
    await voteImages(html, page.url, votes, fetcher);
  }

  return assignRoles(votes.ranked());
}

/**
 * Persisted in Next's Data Cache, keyed by URL: shared by every user and server
 * instance and kept across deploys. Only successful results are stored — a
 * thrown error is never cached, so a site that was down can be retried.
 */
const extractCached = unstable_cache(extractUncached, [CACHE_VERSION], { revalidate: CACHE_SECONDS });

/** Same URL requested again while it's still running (double click, two admins): one extraction. */
const inFlight = new Map<string, Promise<BrandColors>>();

/** "HTTPS://Proyecto.com/#x" and "https://proyecto.com" are the same site for caching. */
function cacheKey(websiteUrl: string): string {
  const url = new URL(websiteUrl);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  return url.href.replace(/\/$/, "");
}

export function extractBrandColorsFromWebsite(websiteUrl: string): Promise<BrandColors> {
  const key = cacheKey(websiteUrl);
  let pending = inFlight.get(key);
  if (!pending) {
    pending = extractCached(key).finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }
  return pending;
}

export { ExtractionError };
