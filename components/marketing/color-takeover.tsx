"use client";

import { useEffect, useRef, useState } from "react";

const TONES = {
  yellow: { panel: "bg-brut-yellow", shadow: "bg-ink", text: "text-ink" },
  ink: { panel: "bg-ink", shadow: "bg-brut-yellow", text: "text-white mix-blend-difference" },
} as const;

/** The block starts as this share of the screen (it scales up to 1). */
const START_SCALE = { x: 0.24, y: 0.32 };
const START_TURN = -9;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * A full-screen color takeover between two sections, scrubbed by the scroll: a small tilted block of
 * the next section's color (with its hard ink shadow) straightens and grows until it covers the whole
 * screen, while huge lines of type slam in from alternating sides. It ends fully covered, so the
 * section after it — in the same color — continues seamlessly. Until the block covers most of the
 * screen the page keeps the previous section's theme; then the whole page switches to this color. Decorative (the words repeat the next
 * section's message). Reduced motion: shown already covered, nothing moves.
 */
export function ColorTakeover({ tone, lines }: { tone: keyof typeof TONES; lines: string[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const panel = panelRef.current;
    const shadow = shadowRef.current;
    if (!section || !panel || !shadow) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let target = 0;
    let shown = 0;
    let frame = 0;
    let last = performance.now();
    let wasCovered = false;
    // Touch: tied 1:1 to the scroll; mouse wheels get a short glide.
    const touch = window.matchMedia("(pointer: coarse)").matches;

    function readScroll() {
      const r = section!.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      // Starts a little before the section pins, so the block is already growing as it arrives.
      target = total > 0 ? clamp01((window.innerHeight * 0.5 - r.top) / (total + window.innerHeight * 0.5)) : 1;
    }

    function paint(p: number) {
      const cover = smooth(clamp01(p / 0.55));
      // Hysteresis, so hovering around the threshold doesn't flip the page theme back and forth.
      const isCovered = wasCovered ? cover > 0.55 : cover > 0.7;
      if (isCovered !== wasCovered) setCovered((wasCovered = isCovered));
      // Scale + rotate only: the GPU moves the layer, nothing is repainted per frame.
      const sx = START_SCALE.x + (1 - START_SCALE.x) * cover;
      const sy = START_SCALE.y + (1 - START_SCALE.y) * cover;
      const block = `rotate(${((1 - cover) * START_TURN).toFixed(2)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
      panel!.style.transform = block;
      const off = (1 - cover) * 16;
      shadow!.style.transform = `translate(${off.toFixed(1)}px, ${off.toFixed(1)}px) ${block}`;
      lineRefs.current.forEach((el, i) => {
        if (!el) return;
        const t = smooth(clamp01((p - 0.2 - i * 0.09) / 0.32));
        const dir = i % 2 ? 1 : -1;
        el.style.transform = `translate3d(${((1 - t) * dir * 110).toFixed(2)}vw,0,0) skewX(${((1 - t) * dir * -12).toFixed(2)}deg)`;
      });
    }

    function loop(now: number) {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      shown += (target - shown) * (touch ? 1 : 1 - Math.exp(-dt * 12));
      paint(shown);
      frame = Math.abs(target - shown) > 0.0005 ? requestAnimationFrame(loop) : 0;
    }

    const onScroll = () => {
      readScroll();
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
    };

    if (reduced) {
      paint(1);
      return;
    }
    readScroll();
    shown = target;
    paint(shown);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const t = TONES[tone];
  const startBlock = `rotate(${START_TURN}deg) scale(${START_SCALE.x}, ${START_SCALE.y})`;

  return (
    <section
      ref={sectionRef}
      aria-hidden="true"
      data-theme={covered ? tone : ""}
      className="relative h-[160svh] motion-reduce:h-auto md:h-[230svh]"
    >
      <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden motion-reduce:relative">
        <div
          ref={shadowRef}
          className={`absolute inset-0 will-change-transform ${t.shadow}`}
          style={{ transform: `translate(16px,16px) ${startBlock}` }}
        />
        <div
          ref={panelRef}
          className={`absolute inset-0 border-[3px] border-ink will-change-transform ${t.panel}`}
          style={{ transform: startBlock }}
        >
          <div className={`brut-grid absolute inset-0 ${tone === "ink" ? "text-white" : "text-ink"}`} />
        </div>
        <p className={`relative z-10 flex w-full flex-col items-center px-2 text-center ${t.text}`}>
          {lines.map((line, i) => (
            <span
              key={line}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              className="block whitespace-nowrap font-display text-[15vw] font-bold uppercase leading-[0.84] tracking-tighter will-change-transform lg:text-[12vw]"
              style={{ transform: `translate3d(${i % 2 ? 110 : -110}vw,0,0)` }}
            >
              {line}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
