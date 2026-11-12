"use client";

import { useEffect } from "react";

/**
 * The landing's scroll effects. Elements opt in with plain data attributes:
 *
 * - `data-reveal` (`up` | `left` | `stamp`): hidden until it scrolls into view, then wipes in hard
 *   (clip-path) with a short rise — brutalist, no fades. `style={{ "--i": n }}` staggers siblings.
 * - `data-parallax`: the photos inside drift against the scroll (a window, not a sticker).
 * - `data-marquee` + `data-speed`: a tape whose text runs with the scroll (negative = other way)
 *   and skews with scroll speed.
 * - `--scroll-p` on <html>: page progress 0–1 (the top progress bar).
 * - `data-theme` on sections: the page theme (`--theme-bg` / `--theme-nav` / `--theme-bar` on
 *   <html>) follows the section in the middle of the screen, and CSS transitions blend the colors.
 *
 * Hydration: the DOM is only touched *after* React has hydrated it. `ScrollFx` scans the page once
 * from its effect, skipping `[data-fx-scope]` subtrees (content streamed through Suspense, which may
 * still be waiting to hydrate); those register themselves from their own effect via `registerFx`.
 * Reduced motion: nothing hides, nothing moves.
 */

/** Page themes: background, navbar (always light, its type is ink) and progress-bar color. */
const THEMES = {
  paper: { bg: "#fafaf7", nav: "#fafaf7", bar: "#0a0a0a" },
  blue: { bg: "#b8dbff", nav: "#b8dbff", bar: "#0a0a0a" },
  pink: { bg: "#e8c6c9", nav: "#e8c6c9", bar: "#0a0a0a" },
  yellow: { bg: "#ebdca8", nav: "#ebdca8", bar: "#0a0a0a" },
  mint: { bg: "#c2dcca", nav: "#c2dcca", bar: "#0a0a0a" },
  ink: { bg: "#0a0a0a", nav: "#ebdca8", bar: "#ebdca8" },
} as const;

type Controller = { register: (scope: ParentNode, skipScopes?: boolean) => () => void; destroy: () => void };
let controller: Controller | null = null;
let registrations = 0;

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function createController(): Controller {
  const root = document.documentElement;
  const inView = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0 && r.left < window.innerWidth && r.right > 0;
  };
  // Elements waiting to be revealed. Checked by position on each scroll frame rather than with an
  // IntersectionObserver: the hidden state clips the element itself (clip-path), and Chromium
  // clips the observed area with it — the element would never count as visible.
  const pending = new Set<HTMLElement>();
  const reachedView = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.92 && r.bottom > 0 && r.left < window.innerWidth && r.right > 0;
  };
  const parallax = new Set<HTMLElement>();
  const marquees = new Set<HTMLElement>();

  let frame = 0;
  let lastY = window.scrollY;
  let smoothY = lastY;
  let skew = 0;
  let last = performance.now();
  // Touch screens: follow the finger much more tightly (a soft lag reads as sluggish on a phone).
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const follow = 10;

  /** Width of one repeat of each tape's text; measured on register and resize, never mid-frame. */
  const tapeWidth = new WeakMap<HTMLElement, number>();
  const measureTapes = () =>
    marquees.forEach((el) => tapeWidth.set(el, (el.firstElementChild?.firstElementChild as HTMLElement | null)?.offsetWidth || 1));
  let theme = "";

  function tick(now = performance.now()) {
    frame = 0;
    const y = window.scrollY;
    // Time-based easing: the tapes glide after the scroll instead of jumping with each wheel step.
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    smoothY = touch ? y : smoothY + (y - smoothY) * (1 - Math.exp(-dt * follow));
    const vh = window.innerHeight;
    const max = Math.max(1, root.scrollHeight - vh);

    // Scroll speed → a little skew on the tapes, easing back to straight when the page stops.
    skew += (Math.max(-10, Math.min(10, (y - lastY) * 0.35)) - skew) * 0.2;
    lastY = y;

    // ── Read phase: every layout read happens before any write, so the frame never forces a
    //    reflow per element (that interleaving was what made scrolling stutter).
    const toShow: HTMLElement[] = [];
    for (const el of pending) {
      if (!el.isConnected) pending.delete(el);
      else if (reachedView(el)) toShow.push(el);
    }
    const parallaxWrites: [HTMLElement, string][] = [];
    for (const el of parallax) {
      if (!el.isConnected) {
        parallax.delete(el);
        continue;
      }
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      // -1 (photo entering at the bottom) → 1 (leaving at the top).
      const t = (vh / 2 - (r.top + r.height / 2)) / (vh / 2 + r.height / 2);
      parallaxWrites.push([el, `${(t * r.height * 0.06).toFixed(1)}px`]);
    }
    const tapeWrites: [HTMLElement, string][] = [];
    for (const el of marquees) {
      if (!el.isConnected) {
        marquees.delete(el);
        continue;
      }
      const r = el.getBoundingClientRect();
      const track = el.firstElementChild as HTMLElement | null;
      if (!track || r.bottom < -200 || r.top > vh + 200) continue;
      const width = tapeWidth.get(el) ?? 1;
      const speed = Number(el.dataset.speed ?? 0.5);
      const offset = (((smoothY * Math.abs(speed)) % width) + width) % width;
      const x = speed >= 0 ? -offset : offset - width;
      tapeWrites.push([track, `translate3d(${x.toFixed(1)}px,0,0) skewX(${(-skew).toFixed(2)}deg)`]);
    }
    const nextTheme = themeAt(vh * 0.5);

    // ── Write phase.
    root.style.setProperty("--scroll-p", String(Math.min(1, y / max)));
    for (const el of toShow) {
      el.setAttribute("data-shown", "");
      pending.delete(el);
    }
    for (const [el, value] of parallaxWrites) el.style.setProperty("--py", value);
    for (const [el, value] of tapeWrites) el.style.transform = value;
    if (nextTheme !== theme) applyTheme((theme = nextTheme));

    // Keep easing (tapes catching up, skew back to 0) after the last scroll event.
    if (Math.abs(skew) > 0.05 || Math.abs(y - smoothY) > 0.3) frame = requestAnimationFrame(tick);
  }

  /**
   * The page theme follows the section in the middle of the screen (`data-theme` on it). An empty
   * `data-theme` keeps the theme of the section before it (e.g. a takeover not yet covered).
   */
  function themeAt(lineY: number) {
    const themed = [...document.querySelectorAll<HTMLElement>("[data-theme]")];
    let index = -1;
    for (let i = 0; i < themed.length; i++) {
      const r = themed[i].getBoundingClientRect();
      if (r.top <= lineY && r.bottom > lineY) index = i;
    }
    for (let i = index; i >= 0; i--) if (themed[i].dataset.theme) return themed[i].dataset.theme!;
    return "blue";
  }

  function applyTheme(name: string) {
    const t = THEMES[name as keyof typeof THEMES] ?? THEMES.paper;
    root.style.setProperty("--theme-bg", t.bg);
    root.style.setProperty("--theme-nav", t.nav);
    root.style.setProperty("--theme-bar", t.bar);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t.nav);
  }

  const schedule = () => {
    if (frame) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };
  const onResize = () => {
    measureTapes();
    schedule();
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", onResize);
  // Sections switch their own theme without a scroll (a step changing, a takeover covering).
  const themeChanges = new MutationObserver(schedule);
  themeChanges.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-theme"] });
  root.classList.add("fx-ready");

  return {
    register(scope, skipScopes = false) {
      const pick = <T extends Element>(selector: string) =>
        [...scope.querySelectorAll<T & HTMLElement>(selector)].filter(
          (el) => !skipScopes || !el.closest("[data-fx-scope]"),
        );
      const revealed = pick("[data-reveal]:not([data-shown])");
      // Measure all first, then write (no reflow per element).
      const visible = revealed.map(inView);
      revealed.forEach((el, i) => {
        if (visible[i]) el.setAttribute("data-shown", "");
        else {
          el.setAttribute("data-armed", "");
          pending.add(el);
        }
      });
      // Photo parallax only with a mouse: on phones it's per-frame layout work for a barely visible drift.
      const photos = touch ? [] : pick<HTMLElement>("[data-parallax]");
      const tapes = pick<HTMLElement>("[data-marquee]");
      photos.forEach((el) => parallax.add(el));
      tapes.forEach((el) => marquees.add(el));
      measureTapes();
      schedule();
      return () => {
        revealed.forEach((el) => pending.delete(el));
        photos.forEach((el) => parallax.delete(el));
        tapes.forEach((el) => marquees.delete(el));
      };
    },
    destroy() {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      themeChanges.disconnect();
      ["--theme-bg", "--theme-nav", "--theme-bar"].forEach((name) => root.style.removeProperty(name));
      pending.clear();
      root.classList.remove("fx-ready");
    },
  };
}

/**
 * Registers the effects inside `scope` (call from a client component's effect, i.e. after it has
 * hydrated). Returns the cleanup.
 */
export function registerFx(scope: ParentNode | null, skipScopes = false) {
  if (!scope || reducedMotion()) return () => {};
  controller ??= createController();
  // The shared observer lives while anything is registered. Counting registrations (instead of
  // tying it to `ScrollFx`) matters: StrictMode remounts effects one component at a time, and
  // tearing the observer down under the carousel left its cards hidden for good.
  registrations++;
  const unregister = controller.register(scope, skipScopes);
  let done = false;
  return () => {
    if (done) return;
    done = true;
    unregister();
    if (--registrations === 0) {
      controller?.destroy();
      controller = null;
    }
  };
}

/** Mount once per page: the progress bar plus the scan of everything outside `[data-fx-scope]`. */
export function ScrollFx() {
  useEffect(() => registerFx(document, true), []);

  return (
    <div
      aria-hidden="true"
      className="theme-bar pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 origin-left motion-reduce:hidden"
      style={{ transform: "scaleX(var(--scroll-p, 0))" }}
    />
  );
}

/**
 * Two crossed tapes of huge type that run with the scroll, in opposite directions: an ink one and a
 * yellow outlined one. Decorative; the words repeat what the page already says.
 */
export function ScrollMarquee() {
  const words = ["Vivienda nueva", "Medellín", "Compra", "Arrienda", "Sobre planos", "Sin planillas"];
  const row = (outlined: boolean) => (
    <div className="flex shrink-0 items-center">
      {words.map((word) => (
        <span key={word} className="flex items-center">
          <span
            className={`px-5 font-display text-4xl font-bold uppercase leading-none tracking-tight sm:text-7xl ${
              outlined ? "marquee-outline" : ""
            }`}
          >
            {word}
          </span>
          <span className={`size-4 shrink-0 sm:size-6 ${outlined ? "bg-ink" : "bg-brut-yellow"}`} />
        </span>
      ))}
    </div>
  );

  return (
    <div aria-hidden="true" className="relative overflow-hidden py-10 sm:py-16">
      <div className="-mx-8 -rotate-2 border-y-[3px] border-ink bg-ink py-3 text-paper sm:py-4" data-marquee="" data-speed="0.45">
        <div className="flex w-max will-change-transform">
          {row(false)}
          {row(false)}
          {row(false)}
        </div>
      </div>
      <div
        className="-mx-8 -mt-3 rotate-[1.5deg] border-y-[3px] border-ink bg-brut-yellow py-3 text-ink shadow-brut-lg sm:-mt-4 sm:py-4"
        data-marquee=""
        data-speed="-0.35"
      >
        <div className="flex w-max will-change-transform">
          {row(true)}
          {row(true)}
          {row(true)}
        </div>
      </div>
    </div>
  );
}
