"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { ArrowDown } from "lucide-react";

import { HeroScene, hash01, type HeadlineWord, type MorphTarget } from "@/components/marketing/hero-scene";
import { PropertySearch } from "@/components/marketing/property-search";
import { useSearchMode } from "@/components/marketing/search-mode-context";

/**
 * The headline's parts. `offset`: where each part's letters start in the whole headline, so the
 * after-intro wave runs through it in reading order. `accentFrom`: letters from this index on are set
 * in the italic serif accent ("vivir").
 */
const WORDS: Record<HeadlineWord, { text: string; offset: number; accentFrom?: number }> = {
  line1: { text: "Encuentra el", offset: 0 },
  hogar: { text: "hogar", offset: 12 },
  line2: { text: "donde quieres vivir", offset: 17, accentFrom: 14 },
};

/** The italic serif accent: a touch larger (Instrument Serif runs small next to Poppins), no negative tracking. */
const ACCENT = "font-serif font-normal italic text-[1.14em] leading-none tracking-normal";

/**
 * Where one broken piece of a letter starts: scattered across the whole viewport, spun hard, and a
 * short random beat late, so the headline slams together from debris almost all at once.
 */
function shardStart(seed: number) {
  return {
    "--dx": `${((hash01(seed) - 0.5) * 96).toFixed(1)}vw`,
    "--dy": `${((hash01(seed + 1) - 0.5) * 80).toFixed(1)}vh`,
    "--r": `${((hash01(seed + 2) - 0.5) * 360).toFixed(0)}deg`,
    "--d": `${Math.round(hash01(seed + 3) * 90)}ms`,
  } as React.CSSProperties;
}

/**
 * A headline word split into letters, each letter cut into two jagged pieces (top and bottom). When
 * the word is revealed the pieces fly in from all over the hero and lock together; once the intro is
 * over a slow wave keeps running through the letters toward the search. Screen readers get the plain
 * word. Without the reveal (reduced motion) the two pieces simply sit together as one letter.
 */
function StampedWord({ word, stamped, waving }: { word: HeadlineWord; stamped: boolean; waving: boolean }) {
  const { text, offset, accentFrom } = WORDS[word];
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {[...text].map((char, i) => {
          if (char === " ") return " ";
          const n = offset + i;
          const cut = n % 2 ? "piece-alt" : "";
          const accent = accentFrom !== undefined && i >= accentFrom;
          return (
            <span
              key={i}
              className={`relative inline-block ${accent ? `${ACCENT} pr-[0.02em]` : ""} ${waving ? "letter-wave" : ""}`}
              style={{ "--n": n } as React.CSSProperties}
            >
              <span className={`piece-top block ${cut} ${stamped ? "shard" : ""}`} style={shardStart(n * 11)}>
                {char}
              </span>
              <span className={`piece-bottom absolute inset-0 ${cut} ${stamped ? "shard" : ""}`} style={shardStart(n * 11 + 5)}>
                {char}
              </span>
            </span>
          );
        })}
      </span>
    </>
  );
}

/** Matte whites for the "hogar" house: lit front, shaded side, darker roof top. */
const HOUSE = {
  front: "#f7f7f3",
  side: "#e2e2db",
  roof: "#d3d3cb",
  ink: "var(--color-ink)",
};

/**
 * The "hogar" word as a small 3D house in matte whites (oblique projection, flat fills, fine ink
 * edges): the word's box is the lit front wall, a shaded side wall runs back to the right, and a
 * gabled roof sits on top (white gable in front, darker slope going back). Drawn as one SVG measured
 * to the word's box (in px, so the edges stay crisp and the depth scales with the font size), behind
 * the word. The walls come in with the word; the roof drops on right after, with a small bounce.
 */
function HogarHouse({
  boxRef,
  shown,
  dropping,
}: {
  boxRef: RefObject<HTMLSpanElement | null>;
  shown: boolean;
  dropping: boolean;
}) {
  const [box, setBox] = useState<{ w: number; h: number; f: number } | null>(null);

  // The word's box is a later sibling, so its ref may not be attached yet when this first runs: keep
  // trying each frame until it is, then measure it and follow its size (font load, breakpoints).
  useLayoutEffect(() => {
    let observer: ResizeObserver | undefined;
    let frame = 0;
    const attach = () => {
      const el = boxRef.current;
      if (!el) {
        frame = requestAnimationFrame(attach);
        return;
      }
      const measure = () =>
        setBox({ w: el.offsetWidth, h: el.offsetHeight, f: parseFloat(getComputedStyle(el).fontSize) || 16 });
      measure();
      observer = new ResizeObserver(measure);
      observer.observe(el);
    };
    attach();
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [boxRef]);

  if (!box) return null;
  const { w, h, f } = box;
  // Depth (back and up), roof height, eaves.
  const dx = 0.2 * f;
  const dy = -0.13 * f;
  const rh = 0.36 * f;
  const e = 0.06 * f;
  const edge = { stroke: HOUSE.ink, strokeWidth: 2, strokeLinejoin: "round" as const };
  const walls = shown ? "" : "opacity-0 motion-reduce:opacity-100";
  const roof = shown ? (dropping ? "roof-in" : "") : "opacity-0 motion-reduce:opacity-100";
  const pts = (...p: number[][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 overflow-visible"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
    >
      <g className={walls}>
        {/* Side wall, in shade. */}
        <polygon points={pts([w, 0], [w + dx, dy], [w + dx, h + dy], [w, h])} fill={HOUSE.side} {...edge} />
        {/* Front wall, lit: the word sits on it. */}
        <rect x={0} y={0} width={w} height={h} fill={HOUSE.front} {...edge} />
      </g>
      <g className={roof}>
        {/* Roof slope going back, then the gable in front of it. */}
        <polygon
          points={pts([w / 2, -rh], [w + e, 0], [w + e + dx, dy], [w / 2 + dx, -rh + dy])}
          fill={HOUSE.roof}
          {...edge}
        />
        <polygon points={pts([-e, 0], [w / 2, -rh], [w + e, 0])} fill={HOUSE.front} {...edge} />
      </g>
    </svg>
  );
}

/**
 * Pastel hero in quiet brutalism, one piece with the landing navbar (same flat pastel Delfos
 * blue, no grid), so the two read as one surface.
 *
 * It opens with `HeroScene` (over the hero on md+, as a full-screen splash on phones): a ~4 s story
 * where a person kicks down a run-down house and gets a new one stamped "COMPRADA", then the headline
 * assembles from broken letter pieces scattered across the hero; on md+ the ground line then
 * stretches into the search bar. From then on the only motion
 * points at the search: a slow wave through the headline, a breathing ink hard shadow behind the bar
 * and a bobbing "start here" arrow. Until revealed, everything is invisible but keeps its place
 * (nothing shifts). With reduced motion the text simply shows.
 *
 * No `isolate`/z-index on the section: the phone splash is `fixed` and must stack above the navbar.
 *
 * No `overflow-hidden` on the section: the search's dropdowns hang below it over the next section.
 */
export function HeroSection() {
  const { heroSearchRef } = useSearchMode();
  const line1Ref = useRef<HTMLSpanElement>(null);
  const hogarRef = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState<Record<MorphTarget, boolean>>({
    line1: false,
    hogar: false,
    line2: false,
    search: false,
  });
  const [introDone, setIntroDone] = useState(false);

  const shown = (target: MorphTarget) => revealed[target] || introDone;
  /** Hidden until revealed (it keeps its place); always visible with reduced motion. */
  const hiddenUntil = (target: MorphTarget) => (shown(target) ? "" : "opacity-0 motion-reduce:opacity-100");
  const word = (target: HeadlineWord) => <StampedWord word={target} stamped={revealed[target]} waving={introDone} />;

  return (
    <section id="inicio" className="relative border-b-[1.5px] border-ink bg-delfos-pastel text-ink">
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-8 pt-6 sm:px-6 md:pb-12 md:pt-10 lg:pb-14 lg:pt-12">
        {/* Eyebrow: a fine rule and a quiet mono line; fades in once the headline has assembled. */}
        <p
          className={`mb-4 flex items-center gap-3 font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-ink/80 transition-opacity delay-300 duration-700 sm:text-[11px] md:mb-5 ${
            shown("line2") ? "opacity-100" : "opacity-0 motion-reduce:opacity-100"
          }`}
        >
          <span aria-hidden="true" className="h-px w-8 bg-ink" />
          Vivienda nueva y usada · Colombia
        </p>
        <h1 className={`${revealed.line2 ? "headline-hit" : ""} font-display text-[2.35rem] font-bold leading-[0.98] tracking-[-0.045em] text-ink min-[400px]:text-[2.65rem] sm:text-6xl lg:text-[4.4rem] xl:text-[4.9rem]`}>
          {/* One phrase per line on every screen (the space between them stays in the text). */}
          <span className="block">
            <span ref={line1Ref} className={hiddenUntil("line1")}>
              {word("line1")}
            </span>{" "}
            {/* "hogar" is a little 3D house in matte whites: the word sits on its front wall, a roof on top.
                It slams down from huge, squashes, and flashes ink on impact. */}
            <span className={`relative mr-[0.2em] mt-[0.52em] inline-block ${revealed.hogar ? "house-slam" : ""}`}>
              <HogarHouse boxRef={hogarRef} shown={shown("hogar")} dropping={revealed.hogar} />
              <span ref={hogarRef} className={`relative inline-block px-[0.12em] pb-[0.04em] text-ink ${revealed.hogar ? "block-flash" : ""} ${hiddenUntil("hogar")}`}>
                {word("hogar")}
              </span>
            </span>
          </span>{" "}
          <span className="block">
            <span ref={line2Ref} className={hiddenUntil("line2")}>
              {word("line2")}
            </span>
          </span>
        </h1>
        {/* Lead: one calm sentence under a fine ink rule, after the headline settles. */}
        <p
          className={`mt-5 max-w-md border-l-[1.5px] border-ink pl-4 text-[15px] leading-relaxed text-ink/90 transition-[opacity,translate] delay-500 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] sm:text-base md:mt-6 ${
            shown("line2") ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
          }`}
        >
          Compra o arrienda con la información clara desde el primer vistazo.
        </p>

        <div ref={heroSearchRef} className="mt-6 hidden w-full md:block lg:mt-8">
          {/* The call to action: appears when the intro ends, its arrow keeps bobbing toward the bar. */}
          <p
            className={`mb-3.5 flex items-center gap-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-ink/85 transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              introDone ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
            }`}
          >
            <span aria-hidden="true" className="h-px w-6 bg-ink" />
            Empieza aquí
            <ArrowDown aria-hidden="true" className="cta-bob size-3.5 text-ink" strokeWidth={2.25} />
          </p>
          {/* Holds the open bar's height (6rem), so opening it on hover never pushes the page down. */}
          <div className="min-h-24">
          {/* Rests as a short, minimal line and widens into the full bar while the search is open
              (PropertySearch `collapsible` marks itself `data-search-expanded`); the ink shadow follows. */}
          <div
            ref={searchRef}
            className={`relative max-w-xl transition-[max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] has-[[data-search-expanded]]:max-w-5xl motion-reduce:transition-none ${hiddenUntil("search")}`}
          >
            {/* Yellow hard shadow: slides out when the intro ends, then slowly breathes. */}
            <div
              aria-hidden="true"
              className={`absolute inset-0 bg-ink ${introDone ? "cta-shadow" : "opacity-0 motion-reduce:opacity-100"}`}
            />
            <div className={`relative ${shown("search") ? "" : "md:pointer-events-none motion-reduce:md:pointer-events-auto"}`}>
              <PropertySearch brutal align="start" collapsible />
            </div>
          </div>
          </div>
        </div>

        {introDone ? null : (
          <HeroScene
            targets={{ line1: line1Ref, hogar: hogarRef, line2: line2Ref, search: searchRef }}
            onRevealAction={(target) => setRevealed((current) => ({ ...current, [target]: true }))}
            onDoneAction={() => setIntroDone(true)}
          />
        )}
      </div>
    </section>
  );
}
