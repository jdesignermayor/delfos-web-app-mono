"use client";

import { useEffect, useRef, useState } from "react";
import type * as Three from "three";

type ThreeModule = typeof Three;

const STEPS = [
  { n: "01", title: "Busca", body: "Recorre la ciudad y filtra por zona, precio y entrega.", bg: "#b8dbff", theme: "blue" },
  { n: "02", title: "Compara", body: "Quédate con dos proyectos y ponlos lado a lado.", bg: "#e8c6c9", theme: "pink" },
  { n: "03", title: "Separa", body: "Elige tu unidad y apártala en línea.", bg: "#ebdca8", theme: "yellow" },
  { n: "04", title: "Estrena", body: "Abre la puerta de tu hogar nuevo.", bg: "#c2dcca", theme: "mint" },
] as const;

/** Scroll progress (0–1) at which each step takes over. */
const STEP_AT = [0, 0.3, 0.52, 0.76, 1.0001];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
/** 0 → 1 between progress `a` and `b`, eased. */
const ph = (p: number, a: number, b: number) => smooth(clamp01((p - a) / (b - a)));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Piecewise-eased keyframes: `[p, ...values]` rows. Returns the values and the segment's local t. */
function track(keys: number[][], p: number): [number[], number] {
  if (p <= keys[0][0]) return [keys[0].slice(1), 0];
  for (let k = 0; k < keys.length - 1; k++) {
    const [a, b] = [keys[k], keys[k + 1]];
    if (p <= b[0]) {
      const t = smooth((p - a[0]) / (b[0] - a[0]));
      return [a.slice(1).map((v, i) => lerp(v, b[i + 1], t)), t];
    }
  }
  return [keys[keys.length - 1].slice(1), 1];
}

/** Deterministic pseudo-random in [0, 1). */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const GAP = 2.3;
const A = { x: -GAP, z: 0, h: 4.2 };
const B = { x: GAP, z: 0, h: 5.2 };

/** Pin path: [p, x, y, z, scale] — over the city (busca), then A, B (compara), the unit (separa), away. */
const PIN_KEYS = [
  [0, -4.6, 7.6, -4.6, 1],
  [0.07, 0, 7.6, -4.6, 1],
  [0.13, 4.6, 7.6, -2.3, 1],
  [0.19, 0, 7.6, 2.3, 1],
  [0.25, -4.6, 7.6, 2.3, 1],
  [0.35, A.x, 6.6, A.z, 1],
  [0.46, B.x, 7.6, B.z, 1],
  [0.6, B.x, 4.4, 1.5, 1],
  [0.72, B.x, 4.4, 1.5, 1],
  [0.82, B.x, 9.5, 2.5, 0],
];
/** Camera: [p, orbit angle, zoom, look-at x, y, z]. */
const CAM_KEYS = [
  [0, 0.8, 0.95, 0, 1.5, 0],
  [0.26, 1.15, 1.0, 0, 1.6, 0],
  [0.44, 0.85, 1.3, 0, 3, 0],
  [0.62, 0.6, 1.8, B.x, 3.2, 1],
  [0.84, 0.5, 1.65, B.x, 1.6, 3.2],
  [1, 0.4, 1.75, B.x, 1.4, 3.6],
];
/** Full-screen backdrop per step, crossfading at each step change. */
const BG_KEYS = (C: ThreeModule) => {
  const c = STEPS.map((s) => new C.Color(s.bg));
  return [
    [0, c[0]],
    [0.27, c[0]],
    [0.33, c[1]],
    [0.49, c[1]],
    [0.55, c[2]],
    [0.73, c[2]],
    [0.79, c[3]],
    [1, c[3]],
  ] as const;
};

function buildScene(T: ThreeModule) {
  const disposables: { dispose: () => void }[] = [];
  const keep = <D extends { dispose: () => void }>(d: D) => (disposables.push(d), d);
  const INK = "#0a0a0a";

  const hullMat = keep(new T.MeshBasicMaterial({ color: INK, side: T.BackSide }));
  const edgeMat = keep(new T.LineBasicMaterial({ color: INK }));
  const inkMat = keep(new T.MeshBasicMaterial({ color: INK }));

  const textures = new Map<string, Three.CanvasTexture>();
  /** A tile of the facade: the face color with two ink windows. */
  function facade(hex: string) {
    let tex = textures.get(hex);
    if (!tex) {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 64;
      const g = canvas.getContext("2d")!;
      g.fillStyle = hex;
      g.fillRect(0, 0, 64, 64);
      g.fillStyle = INK;
      g.fillRect(11, 20, 16, 16);
      g.fillRect(37, 20, 16, 16);
      tex = keep(new T.CanvasTexture(canvas));
      tex.colorSpace = T.SRGBColorSpace;
      tex.wrapS = tex.wrapT = T.RepeatWrapping;
      textures.set(hex, tex);
    }
    return tex;
  }

  /**
   * A flat-toned box (top lightest, sides darker) with a thick ink outline (back-face hull) and ink
   * edges. `base`: origin at the bottom face, so scaling Y grows it from the ground.
   */
  function brutBox(w: number, h: number, d: number, hex: string, opts: { windows?: boolean; base?: boolean } = {}) {
    const geo = keep(new T.BoxGeometry(w, h, d));
    if (opts.base) geo.translate(0, h / 2, 0);
    const side = (k: number, across: number) => {
      if (!opts.windows) return keep(new T.MeshBasicMaterial({ color: new T.Color(hex).multiplyScalar(k) }));
      const map = keep(facade(hex).clone());
      map.repeat.set(Math.max(1, Math.round(across / 0.8)), Math.max(1, Math.round(h / 0.7)));
      map.needsUpdate = true;
      return keep(new T.MeshBasicMaterial({ map, color: new T.Color(k, k, k) }));
    };
    const flat = (k: number) => keep(new T.MeshBasicMaterial({ color: new T.Color(hex).multiplyScalar(k) }));
    const mats = [side(0.9, d), side(0.72, d), flat(1.04), flat(0.6), side(1, w), side(0.8, w)];
    const group = new T.Group();
    group.add(new T.Mesh(geo, mats));
    const hull = new T.Mesh(geo, hullMat);
    hull.scale.set(1 + 0.1 / w, 1 + 0.1 / h, 1 + 0.1 / d);
    group.add(hull);
    group.add(new T.LineSegments(keep(new T.EdgesGeometry(geo)), edgeMat));
    return group;
  }

  const scene = new T.Scene();
  const world = new T.Group();
  scene.add(world);

  // Ground: a deep white plinth (towers sink into it). The backdrop grid is CSS (static): thin 3D
  // lines shimmered as the camera moved.
  const slab = brutBox(13.5, 8, 13.5, "#ffffff", { base: true });
  slab.position.y = -8;
  world.add(slab);

  // The city: a 5×5 block of towers. A and B are the two that make the shortlist.
  const PALETTE = ["#ffffff", "#bfd1e3", "#c2dcca", "#e8c6c9", "#ebdca8"];
  const city = [] as { group: Three.Group; kind: "a" | "b" | "other"; delay: number; h: number }[];
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      const x = i * GAP;
      const z = j * GAP;
      const kind = x === A.x && z === A.z ? "a" : x === B.x && z === B.z ? "b" : "other";
      const h = kind === "a" ? A.h : kind === "b" ? B.h : 1.3 + hash(i * 7 + j * 13) * 2.6;
      const hex = kind === "a" ? "#ffffff" : kind === "b" ? "#0b84ff" : PALETTE[Math.floor(hash(i * 3 + j * 11) * PALETTE.length)];
      const tower = brutBox(1.6, h, 1.6, hex, { windows: true, base: true });
      tower.position.set(x, 0, z);
      world.add(tower);
      city.push({ group: tower, kind, delay: (Math.abs(i) + Math.abs(j)) / 4, h });
    }
  }

  // The map pin: an inverted ink pyramid with a yellow block on top, and its square target on the ground.
  const pin = new T.Group();
  const cone = new T.Mesh(keep(new T.ConeGeometry(0.55, 1.3, 4)), inkMat);
  cone.rotation.set(Math.PI, Math.PI / 4, 0);
  pin.add(cone);
  const head = brutBox(0.75, 0.75, 0.75, "#ebdca8");
  head.position.y = 0.95;
  pin.add(head);
  world.add(pin);
  const ring = new T.Mesh(keep(new T.RingGeometry(0.85, 1.1, 4, 1)), inkMat);
  ring.rotation.set(-Math.PI / 2, 0, Math.PI / 4);
  world.add(ring);

  // The unit that gets "separada": hidden inside B, slides out, then becomes the house.
  const unit = new T.Group();
  const unitBox = brutBox(1.3, 0.7, 1.0, "#e8c6c9");
  unit.add(unitBox);
  // Roof in the chosen tower's blue, so the house reads as "your unit from that project".
  const roofGeo = keep(new T.ConeGeometry(0.92, 0.55, 4));
  const roof = new T.Mesh(roofGeo, keep(new T.MeshBasicMaterial({ color: "#0b84ff" })));
  const roofHull = new T.Mesh(roofGeo, hullMat);
  roofHull.scale.setScalar(1.07);
  const roofEdges = new T.LineSegments(keep(new T.EdgesGeometry(roofGeo)), edgeMat);
  const roofGroup = new T.Group();
  roofGroup.add(roof, roofHull, roofEdges);
  roofGroup.rotation.y = Math.PI / 4;
  roofGroup.position.y = 0.35 + 0.275;
  unit.add(roofGroup);
  const doorway = new T.Mesh(keep(new T.PlaneGeometry(0.34, 0.5)), inkMat);
  doorway.position.set(0, -0.1, 0.502);
  unit.add(doorway);
  const doorPivot = new T.Group();
  doorPivot.position.set(-0.17, -0.1, 0.505);
  const door = new T.Mesh(keep(new T.PlaneGeometry(0.34, 0.5)), keep(new T.MeshBasicMaterial({ color: "#ebdca8", side: T.DoubleSide })));
  door.position.x = 0.17;
  doorPivot.add(door);
  unit.add(doorPivot);
  world.add(unit);

  // Confetti for the move-in: little pastel blocks thrown from the door, scrubbed with the scroll.
  const confettiGeo = keep(new T.BoxGeometry(0.16, 0.16, 0.05));
  const confettiMats = ["#ebdca8", "#0b84ff", "#e8c6c9", "#c2dcca", "#ffffff", INK].map((c) =>
    keep(new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })),
  );
  const confetti = Array.from({ length: 56 }, (_, k) => {
    const mesh = new T.Mesh(confettiGeo, confettiMats[k % confettiMats.length]);
    world.add(mesh);
    return {
      mesh,
      v: new T.Vector3((hash(k) - 0.5) * 7, 4 + hash(k + 50) * 5, (hash(k + 100) - 0.2) * 6),
      spin: (hash(k + 150) - 0.5) * 14,
    };
  });

  const allTextures = disposables.filter((d): d is Three.Texture => d instanceof T.Texture);
  return { scene, city, pin, ring, unit, roofGroup, doorPivot, confetti, disposables, textures: allTextures };
}

/**
 * "Cómo funciona": a tall section whose full-screen stage pins while you scroll through it. One
 * three.js city tells the four steps, and the whole screen takes each step's color:
 *   01 Busca   — a map pin hops over the city, scanning towers (blue).
 *   02 Compara — every tower sinks except two, which grow side by side; the pin weighs both (pink).
 *   03 Separa  — the other one sinks too; a unit slides out of the chosen tower (yellow).
 *   04 Estrena — the unit lands in front as a house: roof, the door swings open, confetti (mint).
 * Everything is scrubbed by the scroll (scrolling back plays it backwards) and eased per frame so it
 * glides. three.js loads only when the section mounts. Reduced motion: a normal-height section with
 * the finished scene, standing still.
 */
export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let cleanup = () => {};

    import("three").then((T) => {
      if (disposed) return;
      // Touch screens: the scene is drawn straight from the scroll position (no easing, no idle
      // animation), only on frames where the scroll moved, at full sharpness without MSAA.
      const touch = window.matchMedia("(pointer: coarse)").matches;
      let renderer: Three.WebGLRenderer;
      try {
        renderer = new T.WebGLRenderer({ antialias: !touch, alpha: true, powerPreference: "high-performance" });
      } catch {
        return; // No WebGL: the section keeps its flat color and the steps still work.
      }
      // Full-screen canvas: 1.5× is sharp enough and keeps the frame rate steady on retina screens.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, touch ? 2 : 1.5));
      const follow = 9;
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.className = "absolute inset-0 size-full";
      stage.appendChild(renderer.domElement);

      const s = buildScene(T);
      // Sharper window textures on faces seen at an angle (less shimmer while moving).
      const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      s.textures.forEach((tex) => {
        tex.anisotropy = anisotropy;
        tex.needsUpdate = true;
      });
      const camera = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
      const bgKeys = BG_KEYS(T);
      let bgHex = "";

      let target = reduced ? 1 : 0;
      let shown = target;
      let enterTarget = reduced ? 1 : 0;
      let enter = enterTarget;
      let pointer = 0;
      let pointerShown = 0;
      let running = false;
      let frame = 0;
      let lastStep = -1;
      const fills: string[] = [];
      let last = performance.now();
      const clock = new T.Clock();
      let wide = false;

      function resize() {
        const { width: w, height: h } = stage!.getBoundingClientRect();
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        wide = w >= 1024;
        // Push the scene off-center so the step text has its side: right on desktop, down on phones.
        const dx = wide ? w * 0.22 : 0;
        const dy = wide ? 0 : h * 0.13;
        const fullW = w + 2 * dx;
        const fullH = h + 2 * dy;
        // World units per pixel: the city fits the screen's height on desktop, its width on phones.
        const unit = wide ? Math.max(17 / h, 20 / w) : Math.max(15 / h, 18 / w);
        camera.left = (-fullW * unit) / 2;
        camera.right = (fullW * unit) / 2;
        camera.top = (fullH * unit) / 2;
        camera.bottom = (-fullH * unit) / 2;
        camera.setViewOffset(fullW, fullH, 0, 0, w, h);
        camera.updateProjectionMatrix();
      }

      function readScroll() {
        const r = section!.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = r.height - vh;
        target = total > 0 ? clamp01(-r.top / total) : 1;
        // The city rises as the section scrolls into view.
        enterTarget = clamp01((vh - r.top) / vh);
      }

      function render(now: number) {
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        const k = reduced || touch ? 1 : 1 - Math.exp(-dt * follow);
        shown += (target - shown) * k;
        enter += (enterTarget - enter) * k;
        pointerShown += (pointer - pointerShown) * (1 - Math.exp(-dt * 3));
        const p = shown;
        // Touch: no idle motion (bob, pulse, spin follow the scroll instead), so nothing needs a frame
        // unless the page moved.
        const time = touch ? p * 8 : clock.getElapsedTime();

        // Backdrop: the step's color, full screen (behind the transparent canvas and the CSS grid),
        // written only when it actually changes.
        const [bg] = trackColor(bgKeys, p);
        const hex = `#${bg.getHexString()}`;
        if (hex !== bgHex) section!.style.backgroundColor = bgHex = hex;

        // City: rises in, then shortlists A and B, then only B stays.
        const shortlist = ph(p, 0.3, 0.44);
        const pickB = ph(p, 0.52, 0.64);
        // Estrena: the stubs go under too, leaving only the chosen tower and the new house.
        const clear = ph(p, 0.74, 0.84);
        for (const t of s.city) {
          const rise = smooth(clamp01((enter - 0.15 - t.delay * 0.35) / 0.45));
          // Growing stretches the tower; dropping out sinks it into the plinth, leaving a stub.
          let grow = 1;
          let sink = 0;
          if (t.kind === "other") sink = shortlist;
          if (t.kind === "a") {
            grow = lerp(1, 1.25, shortlist);
            sink = pickB;
          }
          if (t.kind === "b") grow = lerp(1, 1.2, shortlist);
          t.group.scale.y = Math.max(0.001, rise * grow);
          // Fully cleared stubs end a little under the plinth's top, so it hides them cleanly.
          t.group.position.y = -(t.h * grow - 0.22 * (1 - clear) + 0.08 * clear) * sink;
          t.group.visible = rise > 0.002 && !(sink > 0.999 && clear > 0.999);
          // Busca: towers under the pin bounce a little.
          if (t.kind === "other" && p < 0.3) {
            const dx = s.pin.position.x - t.group.position.x;
            const dz = s.pin.position.z - t.group.position.z;
            const near = Math.max(0, 1 - Math.hypot(dx, dz) / 1.6);
            t.group.scale.y *= 1 + near * 0.12;
          }
        }

        // Pin: hops between keyframes with an arc.
        const [pv, hop] = track(PIN_KEYS, p);
        const arc = Math.sin(Math.PI * hop) * 1.3;
        s.pin.position.set(pv[0], pv[1] + arc + Math.sin(time * 2.2) * 0.12, pv[2]);
        s.pin.scale.setScalar(Math.max(0.001, pv[3]));
        s.pin.rotation.y = time * 0.8;
        s.ring.position.set(pv[0], 0.03, pv[2]);
        s.ring.scale.setScalar(Math.max(0.001, pv[3] * (1 + Math.sin(time * 4) * 0.1)));
        s.ring.visible = pv[3] > 0.02;

        // Unit: slides out of B (separa), then flies down to the front and becomes a house (estrena).
        const slide = ph(p, 0.55, 0.66);
        const land = ph(p, 0.76, 0.88);
        const bScale = lerp(1, 1.2, shortlist);
        const outY = 2.85 * bScale;
        s.unit.visible = slide > 0.001;
        s.unit.position.set(B.x, lerp(outY, 0.63, land) + Math.sin(Math.PI * land) * 1.6, lerp(lerp(0, 1.45, slide), 3.9, land));
        s.unit.scale.setScalar(lerp(1, 1.8, land));
        s.unit.rotation.y = Math.sin(Math.PI * land) * 0.5;
        s.roofGroup.scale.setScalar(Math.max(0.001, ph(p, 0.84, 0.9)));
        s.doorPivot.rotation.y = -ph(p, 0.88, 0.94) * 1.9;

        const burst = ph(p, 0.88, 1) * 1.5;
        for (const c of s.confetti) {
          c.mesh.visible = burst > 0.001;
          c.mesh.position.set(
            B.x + c.v.x * burst,
            Math.max(0.08, 0.9 + c.v.y * burst - 4.9 * burst * burst),
            3.9 + 0.9 + c.v.z * burst,
          );
          c.mesh.rotation.set(c.spin * burst, c.spin * burst * 0.7, 0);
        }

        // Camera: orbit + zoom keyframes, eased, nudged by the pointer.
        const [cv] = track(CAM_KEYS, p);
        const angle = cv[0] + pointerShown * 0.12;
        camera.zoom = cv[1];
        camera.position.set(cv[2] + Math.sin(angle) * 24, cv[3] + 17, cv[4] + Math.cos(angle) * 24);
        camera.lookAt(cv[2], cv[3], cv[4]);
        camera.updateProjectionMatrix();
        renderer.render(s.scene, camera);

        // Step text and rail.
        // Hysteresis: a step only changes once the scroll is clearly past its boundary, so resting
        // near one doesn't make the title flash back and forth.
        let clamped = Math.max(0, lastStep);
        while (clamped < STEPS.length - 1 && p >= STEP_AT[clamped + 1] + 0.008) clamped++;
        while (clamped > 0 && p < STEP_AT[clamped] - 0.008) clamped--;
        if (clamped !== lastStep) setStep((lastStep = clamped));
        fillRefs.current.forEach((el, i) => {
          const value = `scaleX(${clamp01((p - STEP_AT[i]) / (STEP_AT[i + 1] - STEP_AT[i])).toFixed(3)})`;
          if (el && fills[i] !== value) el.style.transform = fills[i] = value;
        });
      }

      function loop(now: number) {
        render(now);
        frame = running ? requestAnimationFrame(loop) : 0;
      }

      const visibility = new IntersectionObserver(([entry]) => {
        running = entry.isIntersecting && !reduced && !touch;
        if (running && !frame) {
          last = performance.now();
          frame = requestAnimationFrame(loop);
        }
      });
      const onScroll = () => {
        readScroll();
        // Touch: one draw per scrolled frame, nothing in between.
        if (touch && !frame) {
          frame = requestAnimationFrame((now) => {
            frame = 0;
            render(now);
          });
        }
      };
      const onPointer = (e: PointerEvent) => {
        pointer = (e.clientX / window.innerWidth - 0.5) * 2;
      };
      const resizer = new ResizeObserver(() => {
        resize();
        render(performance.now());
      });

      resize();
      readScroll();
      if (reduced) {
        shown = target = 1;
        enter = enterTarget = 1;
      }
      render(performance.now());
      resizer.observe(stage);
      if (!reduced) {
        if (!touch) visibility.observe(section);
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("pointermove", onPointer, { passive: true });
      }

      cleanup = () => {
        running = false;
        cancelAnimationFrame(frame);
        visibility.disconnect();
        resizer.disconnect();
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("pointermove", onPointer);
        s.disposables.forEach((d) => d.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  const current = STEPS[step];

  return (
    <section
      ref={sectionRef}
      aria-labelledby="como-funciona"
      data-theme={current.theme}
      className="relative h-[300svh] bg-delfos-pastel lg:h-[460svh] text-ink motion-reduce:h-auto"
    >
      <div className="sticky top-0 h-svh overflow-hidden motion-reduce:relative">
        <div aria-hidden="true" className="brut-grid pointer-events-none absolute inset-0 text-ink" />
        <div ref={stageRef} aria-hidden="true" className="absolute inset-0" />

        <div className="pointer-events-none relative z-10 mx-auto flex h-full w-full max-w-[100rem] flex-col px-4 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-24 sm:px-6 md:pb-8 lg:justify-center lg:px-10 lg:pb-10 lg:pt-20">
          <h2
            id="como-funciona"
            className="inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.2em] text-ink/70"
          >
            <span aria-hidden="true" className="h-px w-6 bg-ink" />
            Cómo funciona
          </h2>

          {/* Re-keyed per step, so each step wipes in. */}
          <div key={current.n} className="story-in mt-3 lg:mt-6" aria-live="polite">
            <p className="font-mono text-sm font-bold">
              {current.n} <span className="text-ink/50">/ 04</span>
            </p>
            <p className="font-display text-6xl font-bold uppercase leading-[0.85] tracking-tighter sm:text-8xl lg:text-[8rem]">
              {current.title}
            </p>
            <p className="mt-4 inline-block max-w-xs border-[1.5px] border-ink bg-white px-3 py-2 text-sm font-medium shadow-brut sm:max-w-sm sm:text-base lg:mt-6">
              {current.body}
            </p>
          </div>

          {/* The four steps; each bar fills as the scroll moves through it. */}
          <ol className="mt-auto grid grid-cols-4 gap-1.5 sm:gap-2 lg:mt-12 lg:max-w-xl">
            {STEPS.map((s, i) => (
              <li
                key={s.n}
                aria-current={i === step ? "step" : undefined}
                className={`relative overflow-hidden border-[1.5px] border-ink px-2 pb-3 pt-1.5 transition-colors duration-300 ${
                  i === step ? "bg-ink text-paper" : "bg-white text-ink"
                }`}
              >
                <span className="block font-mono text-[10px] font-bold sm:text-xs">{s.n}</span>
                <span className="block truncate font-display text-xs font-bold uppercase sm:text-sm">{s.title}</span>
                <span
                  ref={(el) => {
                    fillRefs.current[i] = el;
                  }}
                  aria-hidden="true"
                  className={`absolute inset-x-0 bottom-0 h-1.5 origin-left ${i === step ? "bg-brut-yellow" : "bg-ink"}`}
                  style={{ transform: "scaleX(0)" }}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** `track` for colors: eased blend between color keyframes. */
function trackColor(keys: readonly (readonly [number, Three.Color])[], p: number): [Three.Color] {
  const out = keys[0][1].clone();
  if (p <= keys[0][0]) return [out];
  for (let k = 0; k < keys.length - 1; k++) {
    const [a, b] = [keys[k], keys[k + 1]];
    if (p <= b[0]) return [out.copy(a[1]).lerp(b[1], smooth((p - a[0]) / (b[0] - a[0])))];
  }
  return [out.copy(keys[keys.length - 1][1])];
}
