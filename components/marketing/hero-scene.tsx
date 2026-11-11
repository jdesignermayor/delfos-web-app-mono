"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  animate,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";

/**
 * The hero's intro, in brutalism on pastel (ink outlines, flat fills, hard edges): a ~4 s story.
 * Every character is a solid ink silhouette, one after another in the middle of the stage. Each
 * impact shakes the whole stage.
 *   0.0 s  A run-down house (crooked roof, boarded window, door off its hinge); a person steps in beside it.
 *   0.9 s  The person winds up (leans back, leg back)…
 *   1.5 s  …and kicks the house ("¡PAM!"): it shakes, cracks spread, it wobbles for a beat.
 *   1.9 s  It gives way: an ink flash, "CRASH", the house blows apart.
 *   2.4 s  A new house falls into the same spot and slams the ground (squash, shockwave).
 *   3.1 s  A "COMPRADA" stamp slams onto it; the person jumps for joy.
 *   4.0 s  Finale: the scene clears and the headline assembles from its shards (in `hero-section.tsx`,
 *          via `onRevealAction`); on desktop the ground line then stretches into the search bar.
 *
 * Where it plays:
 * - md+: over the hero itself, in place of the text it turns into.
 * - Phones: as a full-screen splash. At the finale the splash fades away and the headline assembles
 *   on the page underneath. A "Saltar" button skips it.
 * Reduced motion: skipped entirely; the text simply shows. Plays once per page load.
 */

export type HeadlineWord = "line1" | "hogar" | "line2";
/** What the scene reveals: the headline's words, then (desktop) the search bar. */
export type MorphTarget = HeadlineWord | "search";
type Phase = "story" | "finale";

/** When the story ends and the page takes over (ms). */
const FINALE_AT_MS = 4000;
/** The longest the intro waits for the page to finish loading before it plays anyway (ms). */
const READY_CAP_MS = 2500;
/** After the finale: when the words start assembling, and how long until their shards settle. */
const WORDS_AT_MS = 120;
const WORDS_SETTLE_MS = 1300;

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const;
const EASE_IN = [0.55, 0, 1, 0.45] as const;

const INK = "#0a0a0a";
const STROKE = {
  stroke: INK,
  strokeWidth: 2,
  strokeLinejoin: "miter" as const,
  strokeLinecap: "square" as const,
};

/** Every character is a solid ink silhouette; white only marks details (boards, cracks, windows). */
const OLD = { wall: INK, roof: INK, wood: "white", door: INK };

/** The ground line on the 400×260 stage (also what becomes the search bar on desktop). */
const W = 400;
const H = 260;
const GROUND = { x: 22, y: 222, w: 356, h: 1.5 };

/** Deterministic pseudo-random in [0, 1): same on server and client. */
export function hash01(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Rubble the old house breaks into: start point, flight, spin, size. Rounded for SSR-stable markup. */
const RUBBLE = Array.from({ length: 9 }, (_, i) => ({
  x: Math.round(58 + hash01(i) * 74),
  y: Math.round(150 + hash01(i + 10) * 50),
  dx: Math.round((hash01(i + 20) - 0.5) * 90),
  dy: Math.round(222 - (150 + hash01(i + 10) * 50) - 6),
  spin: Math.round((hash01(i + 30) - 0.5) * 300),
  size: Math.round(7 + hash01(i + 40) * 9),
  fill: [OLD.wall, OLD.roof, OLD.wood][i % 3],
}));

/** Dust puffs at the foot of the old house when it falls. */
const DUST = [
  { cx: 60, r: 12 },
  { cx: 92, r: 16 },
  { cx: 126, r: 13 },
  { cx: 150, r: 9 },
];

/**
 * Every impact shakes the whole stage: [when (s), how hard (px)] — the kick, the collapse, the new house
 * landing, the stamp. Built once into one keyframe track (times must only go up).
 */
const IMPACTS: [number, number][] = [
  [1.5, 6],
  [1.9, 11],
  [2.62, 9],
  [3.3, 7],
];
const SHAKE_S = 3.6;
const SHAKE = (() => {
  const times = [0];
  const x = [0];
  const y = [0];
  for (const [t, a] of IMPACTS) {
    for (const [dt, fx, fy] of [
      [0, 0, 0],
      [0.03, -1, 0.6],
      [0.07, 0.8, -0.5],
      [0.11, -0.4, 0.3],
      [0.16, 0, 0],
    ]) {
      times.push((t + dt) / SHAKE_S);
      x.push(fx * a);
      y.push(fy * a);
    }
  }
  times.push(1);
  x.push(0);
  y.push(0);
  return { times, x, y };
})();

/** A comic starburst's points around (cx, cy). Rounded so server and client print the same markup. */
function starburst(cx: number, cy: number, r: number, spikes = 12) {
  return Array.from({ length: spikes * 2 }, (_, i) => {
    const angle = (i / (spikes * 2)) * Math.PI * 2;
    const radius = i % 2 ? r * 0.56 : r * (0.88 + hash01(i + cx) * 0.24);
    return `${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`;
  }).join(" ");
}
/** The blows' bursts: where, how big, what they shout, when. */
const BURSTS = [
  { x: 246, y: 186, r: 28, text: "¡PAM!", at: 1.5, tilt: -12 },
  { x: 200, y: 162, r: 46, text: "CRASH", at: 1.9, tilt: 8 },
].map((b) => ({ ...b, points: starburst(b.x, b.y, b.r) }));

/** A one-shot keyframe track that starts `at` seconds into the story. */
const at = (
  start: number,
  duration: number,
  extra?: Transition,
): Transition => ({
  delay: start,
  duration,
  ease: EASE_OUT,
  ...extra,
});

export function HeroScene({
  targets,
  onRevealAction,
  onDoneAction,
}: {
  /** What gets revealed: the headline's word spans and the search bar (the ground line morphs into it). */
  targets: Record<MorphTarget, RefObject<HTMLElement | null>>;
  /** Show this part of the real page now (the headline words assemble from their shards). */
  onRevealAction: (target: MorphTarget) => void;
  /** The intro is over (or skipped): show everything, drop the overlay. */
  onDoneAction: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("story");
  const [closing, setClosing] = useState(false);
  /** The page has finished loading: the story can play (it isn't rendered before). */
  const [ready, setReady] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);

  function revealWords() {
    onRevealAction("line1");
    onRevealAction("hogar");
    onRevealAction("line2");
  }

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    document.documentElement.style.overflow = "";
    onDoneAction();
  }

  /** Phones: skip straight to the page (the words still assemble as the splash fades). */
  function skip() {
    revealWords();
    setClosing(true);
    setTimeout(finish, 450);
  }

  // Wait for the page to be ready before playing: the window's `load` (styles, scripts, above-the-fold
  // images) and the web fonts, then two frames so the first frame of the story is actually painted.
  // Otherwise the story plays while the browser is still busy loading and its first second is lost.
  // Capped, so a slow asset never holds the intro back for long.
  useEffect(() => {
    if (reduceMotion) return;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    };
    const loaded = new Promise<void>((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
    });
    void Promise.all([loaded, document.fonts?.ready]).then(start);
    const cap = setTimeout(start, READY_CAP_MS);
    return () => {
      started = true;
      clearTimeout(cap);
    };
  }, [reduceMotion]);

  // Phones: the splash covers the page from the start; keep it from scrolling underneath.
  // Reduced motion: no intro at all.
  useEffect(() => {
    if (reduceMotion) {
      const skipTimer = setTimeout(finish, 0);
      return () => clearTimeout(skipTimer);
    }
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (!isDesktop) document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
    // Runs once: the intro plays a single time per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  // The story runs on its own (declarative keyframes below) once ready; this only marks when it ends.
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => setPhase("finale"), FINALE_AT_MS);
    return () => clearTimeout(timer);
  }, [ready]);

  // The finale: the scene clears, the words assemble from shards, and then either the ground line
  // becomes the search bar (desktop) or the splash fades away (phones).
  useEffect(() => {
    if (phase !== "finale") return;
    let cancelled = false;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(revealWords, WORDS_AT_MS));

    if (!isDesktop) {
      timers.push(setTimeout(() => setClosing(true), 60));
      timers.push(setTimeout(finish, WORDS_AT_MS + WORDS_SETTLE_MS));
      return () => timers.forEach(clearTimeout);
    }

    async function groundToSearch() {
      const stage = stageRef.current;
      const box = stage?.querySelector<HTMLElement>("[data-ground]");
      const fill = box?.querySelector<HTMLElement>("[data-fill]");
      const goal = targets.search.current;
      if (!box || !fill || !goal || !stage) return;

      const from = stage.getBoundingClientRect();
      const to = goal.getBoundingClientRect();
      fill.style.background = "white";
      await Promise.all([
        animate(
          box,
          {
            x: to.left - (from.left + box.offsetLeft),
            y: to.top - (from.top + box.offsetTop),
            scaleX: to.width / box.offsetWidth,
            scaleY: to.height / box.offsetHeight,
          },
          { duration: 0.75, delay: 0.3, ease: EASE_IN_OUT },
        ),
        animate(
          fill,
          { opacity: 1 },
          { duration: 0.25, delay: 0.35, ease: "easeOut" },
        ),
      ]);
      if (cancelled) return;
      onRevealAction("search");
      await animate(fill, { scaleX: 0 }, { duration: 0.5, ease: EASE_IN_OUT });
      box.style.visibility = "hidden";
    }

    void Promise.all([
      groundToSearch(),
      new Promise((resolve) =>
        setTimeout(resolve, WORDS_AT_MS + WORDS_SETTLE_MS),
      ),
    ]).then(() => {
      if (!cancelled) finish();
    });
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const finale = phase === "finale";

  return (
    <motion.div
      aria-hidden="true"
      // Phones: a full-screen splash over everything. md+: an overlay inside the hero's content box.
      className="fixed inset-0 z-[70] flex items-center justify-center bg-delfos-pastel px-5 motion-reduce:hidden md:pointer-events-none md:absolute md:z-auto md:bg-transparent md:px-0"
      initial={false}
      animate={{ opacity: closing ? 0 : 1 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
    >
      {/* Phones: skip the intro. */}
      <button
        type="button"
        onClick={skip}
        className="absolute right-4 top-4 border border-ink/30 px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink/70 outline-none focus-visible:outline-2 focus-visible:outline-ink md:hidden"
      >
        Saltar
      </button>

      {/* While the page loads: three ink squares blinking in turn, in the stage's place. */}
      {ready ? null : (
        <div className="flex gap-2" role="presentation">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-3 bg-ink"
              initial={{ opacity: 0.2 }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}

      {ready ? (
        <motion.div
          ref={stageRef}
          className="relative aspect-[400/260] w-full max-w-[440px] md:h-full md:max-h-[300px] md:w-auto md:max-w-full"
          initial={{ x: 0, y: 0 }}
          animate={{ x: SHAKE.x, y: SHAKE.y }}
          transition={{ duration: SHAKE_S, times: SHAKE.times, ease: "linear" }}
        >
          <motion.svg
            viewBox={`0 0 ${W} ${H}`}
            className="absolute inset-0 size-full overflow-visible"
            initial={false}
            animate={
              finale ? { opacity: 0, scale: 0.96 } : { opacity: 1, scale: 1 }
            }
            transition={{ duration: 0.3, ease: EASE_IN }}
          >
            <OldHouse />
            <NewHouse />
            <Person />
            <Impacts />
          </motion.svg>

          {/* The ground; on desktop it finally stretches into the search bar. */}
          <div
            data-ground
            className="absolute origin-top-left"
            style={{
              left: `${(GROUND.x / W) * 100}%`,
              top: `${(GROUND.y / H) * 100}%`,
              width: `${(GROUND.w / W) * 100}%`,
              height: `${(GROUND.h / H) * 100}%`,
            }}
          >
            <motion.div
              className="size-full origin-left bg-ink"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={at(0, 0.45)}
            />
            <div
              data-fill
              className="absolute inset-0 origin-right opacity-0"
            />
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
}

/**
 * The run-down house: tired colors, a crooked roof, a boarded window, a door off its hinge. It shakes
 * and cracks at the first blow, and at the second its roof slides off, its walls split and fall, and
 * it crumbles into rubble and dust.
 */
function OldHouse() {
  const fall = (dx: number, rotate: number) => ({
    initial: { x: 0, y: 0, rotate: 0, opacity: 1 },
    animate: {
      x: [0, 0, dx * 1.6, dx * 3],
      y: [0, 0, -46, 150],
      rotate: [0, 0, rotate * 1.5, rotate * 3],
      opacity: [1, 1, 1, 0],
    },
    transition: at(1.9, 0.65, { times: [0, 0.04, 0.35, 1], ease: "linear" }),
  });

  return (
    <g transform="translate(105 0)">
      {/* Takes the kick, wobbles for a beat, gives way. */}
      <motion.g
        initial={{ x: 0, rotate: 0 }}
        animate={{
          x: [0, 0, -7, 5, -3, 2, -1, 0, -7, 0],
          rotate: [0, 0, -3, 2, -1.5, 1, -0.5, 0, -2, 0],
        }}
        transition={at(0, 2.0, {
          times: [0, 0.75, 0.77, 0.79, 0.81, 0.84, 0.875, 0.925, 0.965, 1],
          ease: "linear",
        })}
      >
        {/* Roof: crooked, slides off on the second blow. */}
        <motion.g {...fall(-26, -32)}>
          <path d="M40 154L92 110L150 150Z" fill={OLD.roof} {...STROKE} />
          <path
            d="M70 128L78 136M110 120L104 132"
            stroke="white"
            strokeWidth={2}
          />
        </motion.g>

        {/* Left wall, with the boarded window. */}
        <motion.g {...fall(-18, -24)}>
          <rect
            x="50"
            y="150"
            width="46"
            height="72"
            fill={OLD.wall}
            {...STROKE}
          />
          <rect
            x="60"
            y="166"
            width="24"
            height="22"
            fill={OLD.door}
            {...STROKE}
          />
          <path
            d="M57 170L87 184M57 182L87 170"
            stroke={OLD.wood}
            strokeWidth={4}
          />
        </motion.g>

        {/* Right wall, with the door hanging off its hinge. */}
        <motion.g {...fall(16, 28)}>
          <rect
            x="96"
            y="150"
            width="44"
            height="72"
            fill={OLD.wall}
            {...STROKE}
          />
          <path
            d="M108 222V184L126 180V222"
            fill={OLD.door}
            stroke="white"
            strokeWidth={2}
          />
        </motion.g>

        {/* Cracks, drawn by the first blow. */}
        <motion.path
          d="M138 158L124 170L130 178L116 192L122 200"
          fill="none"
          stroke="white"
          strokeWidth={2.5}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 1], opacity: [1, 1, 0] }}
          transition={at(1.5, 0.45, { times: [0, 0.3, 1] })}
        />
      </motion.g>

      {/* Rubble flying out and settling on the ground. */}
      {RUBBLE.map((piece, i) => (
        <motion.rect
          key={i}
          x={piece.x}
          y={piece.y}
          width={piece.size}
          height={Math.round(piece.size * 0.7)}
          fill={piece.fill}
          {...STROKE}
          strokeWidth={1.5}
          initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [0, piece.dx * 1.4, piece.dx * 2.6],
            y: [0, -50 - piece.size * 3, piece.dy],
            rotate: piece.spin * 2,
          }}
          transition={at(1.92, 0.6, {
            ease: "linear",
            x: {
              delay: 1.92,
              duration: 0.6,
              times: [0, 0.35, 1],
              ease: "easeOut",
            },
            y: {
              delay: 1.92,
              duration: 0.6,
              times: [0, 0.35, 1],
              ease: ["easeOut", "easeIn"],
            },
            opacity: { delay: 1.92, duration: 0.85, times: [0, 0.1, 0.7, 1] },
          })}
        />
      ))}

      {/* Dust puffs at the foot of the house. */}
      {DUST.map((puff, i) => (
        <motion.circle
          key={i}
          cx={puff.cx}
          cy={214}
          r={puff.r}
          fill={INK}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 1.3],
            opacity: [0, 0.85, 0],
            y: [0, -6, -14],
          }}
          transition={at(1.98 + i * 0.04, 0.6)}
        />
      ))}
    </g>
  );
}

/**
 * The new house: falls hard into the old one's spot (speed lines above it), slams the ground (it
 * squashes, a shockwave runs out along the ground), then gets stamped "COMPRADA".
 */
function NewHouse() {
  return (
    <g transform="translate(-105 0)">
      {/* Speed lines trailing the fall. */}
      {[275, 305, 335].map((x, i) => (
        <motion.rect
          key={x}
          x={x - 1.5}
          y={30 + i * 8}
          width={3}
          height={60}
          fill={INK}
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: [0, 1, 0], y: [-80, 10, 40] }}
          transition={at(2.41, 0.26, { ease: "linear" })}
        />
      ))}

      {/* Shockwave along the ground on landing. */}
      {[
        { x: 236, dx: -80 },
        { x: 344, dx: 80 },
      ].map((wave) => (
        <motion.rect
          key={wave.x}
          x={wave.x}
          y={216}
          width={30}
          height={4}
          fill={INK}
          initial={{ opacity: 0, x: 0, scaleX: 0.3 }}
          animate={{ opacity: [0, 1, 0], x: wave.dx, scaleX: [0.3, 1.4, 0.6] }}
          transition={at(2.62, 0.35)}
        />
      ))}

      <motion.g
        initial={{ y: -420, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          delay: 2.4,
          duration: 0.22,
          ease: EASE_IN,
          opacity: { delay: 2.4, duration: 0.05 },
        }}
      >
        <motion.g
          style={{ originY: 1 }}
          initial={{ scaleX: 1, scaleY: 1 }}
          animate={{ scaleX: [1, 1.16, 0.95, 1], scaleY: [1, 0.76, 1.08, 1] }}
          transition={at(2.62, 0.32, {
            times: [0, 0.25, 0.65, 1],
            ease: "easeOut",
          })}
        >
          <rect x="322" y="120" width="12" height="28" fill={INK} {...STROKE} />
          <rect x="262" y="158" width="86" height="64" fill={INK} {...STROKE} />
          <path d="M250 160L305 114L360 160Z" fill={INK} {...STROKE} />
          <rect x="272" y="172" width="15" height="15" fill="white" />
          <rect x="323" y="172" width="15" height="15" fill="white" />
          <rect x="297" y="190" width="16" height="32" fill="white" />
        </motion.g>
      </motion.g>

      {/* The stamp: slams down onto the house, a hard shadow under it. */}
      <motion.g
        initial={{ scale: 4.5, opacity: 0, rotate: 10 }}
        animate={{ scale: 1.15, opacity: 1, rotate: -12 }}
        transition={at(3.1, 0.2, { ease: EASE_IN })}
      >
        <rect x="257" y="166" width="104" height="26" fill={INK} />
        <rect
          x="253"
          y="162"
          width="104"
          height="26"
          fill="white"
          {...STROKE}
        />
        <text
          x="305"
          y="180"
          textAnchor="middle"
          className="font-mono"
          fontSize="12"
          fontWeight="700"
          letterSpacing="2.5"
          fill={INK}
        >
          COMPRADA
        </text>
      </motion.g>
    </g>
  );
}

/**
 * The person, right beside the house: steps in, winds up (steps back, front leg drawn back), then
 * lunges and kicks the house down; jumps for joy when the new house is stamped. The kicking leg turns
 * about the hip: an invisible circle centered on the hip makes it the group's center.
 */
function Person() {
  return (
    <g transform="translate(105 0)">
      <motion.g
        initial={{ x: 36, y: 0, opacity: 0 }}
        animate={{
          opacity: 1,
          // Step in, hold, wind up (back), lunge into the kick, hold, settle.
          x: [36, 0, 0, 7, -10, -10, 0],
          y: [0, -16, 0, -10, 0],
        }}
        transition={{
          opacity: at(0.2, 0.2),
          x: at(0.2, 1.8, {
            times: [0, 0.167, 0.389, 0.611, 0.722, 0.833, 1],
            ease: [
              EASE_IN_OUT,
              "linear",
              "easeOut",
              [0.7, 0, 0.84, 0],
              "linear",
              "easeInOut",
            ],
          }),
          y: {
            delay: 3.15,
            duration: 0.5,
            times: [0, 0.25, 0.5, 0.75, 1],
            ease: "easeInOut",
          },
        }}
      >
        {/* Standing leg, body, arms, head. */}
        <rect x="182" y="192" width="7" height="30" fill={INK} />
        <rect x="170" y="162" width="21" height="32" fill={INK} />
        <rect x="164" y="164" width="5" height="24" fill={INK} />
        <rect x="192" y="164" width="5" height="24" fill={INK} />
        <circle cx="180.5" cy="151" r="9" fill={INK} />

        {/* Kicking leg, pointing down at rest: drawn back, then snapped out into the wall. */}
        <motion.g
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -35, 100, 100, 0] }}
          transition={at(0.9, 1.05, {
            times: [0, 0.381, 0.571, 0.762, 1],
            ease: ["easeOut", [0.7, 0, 0.84, 0], "linear", "easeInOut"],
          })}
        >
          <circle cx="175.5" cy="192" r="32" fill="none" />
          <rect x="172" y="192" width="7" height="30" fill={INK} />
          <rect x="166" y="217" width="13" height="5" fill={INK} />
        </motion.g>
      </motion.g>
    </g>
  );
}

/**
 * The blows' punctuation, over everything: a one-frame ink flash when the house gives way, and a
 * comic starburst shouting each blow ("¡PAM!" for the kick, then "CRASH"), popping in and gone in a blink.
 */
function Impacts() {
  return (
    <g>
      <motion.rect
        x={-20}
        y={-20}
        width={W + 40}
        height={H + 40}
        fill={INK}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={at(1.9, 0.14, { times: [0, 0.1, 0.55, 1], ease: "linear" })}
      />
      {BURSTS.map((burst) => (
        <motion.g
          key={burst.text}
          initial={{ scale: 0, opacity: 0, rotate: burst.tilt }}
          animate={{ scale: [0, 1.25, 1, 1.05], opacity: [1, 1, 1, 0] }}
          transition={at(burst.at, 0.42, {
            times: [0, 0.2, 0.6, 1],
            ease: "easeOut",
          })}
        >
          <polygon
            points={burst.points}
            fill="white"
            {...STROKE}
            strokeWidth={2.5}
          />
          <text
            x={burst.x}
            y={burst.y + burst.r * 0.16}
            textAnchor="middle"
            className="font-display"
            fontSize={burst.r * 0.46}
            fontWeight="900"
            fill={INK}
          >
            {burst.text}
          </text>
        </motion.g>
      ))}
    </g>
  );
}
