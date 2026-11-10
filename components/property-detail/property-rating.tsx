"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import { useOverlayState } from "@heroui/react";

import {
  getPropertyRatingAction,
  setPropertyRatingAction,
  type PropertyRatingState,
} from "@/app/actions/ratings";
import { AuthModal } from "@/components/marketing/auth-modal";
import { useToast } from "@/components/providers/toast-provider";

/** The project's brand colour when it has one (set by `BrandTheme`), else Delfos' accent. */
const STAR_COLOR = "var(--brand-primary, var(--color-accent))";

const FACES = [
  { value: 1, emoji: "😞", label: "Malo" },
  { value: 2, emoji: "😕", label: "Regular" },
  { value: 3, emoji: "🙂", label: "Bueno" },
  { value: 4, emoji: "😄", label: "Muy bueno" },
  { value: 5, emoji: "😍", label: "Excelente" },
] as const;

const decimal = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

type RatingContextValue = {
  state: PropertyRatingState | null;
  rate: (rating: number) => void;
};

const RatingContext = createContext<RatingContextValue | null>(null);

function useRating() {
  return useContext(RatingContext);
}

/**
 * Loads the property's rating (average, count and the visitor's own) from the client, so the page
 * stays static, and shares it between the summary under the title and the "Califica" section.
 * Sample listings have no uuid and get no rating at all.
 */
export function PropertyRatingProvider({ propertyUuid, children }: { propertyUuid?: string; children: ReactNode }) {
  const toast = useToast();
  const authModal = useOverlayState();
  const [state, setState] = useState<PropertyRatingState | null>(null);
  // A rating picked while signed out, applied once the visitor signs in.
  const pendingRating = useRef<number | null>(null);
  // Bumped by every load and write: an answer that arrives after a newer change is stale.
  const version = useRef(0);

  const save = useCallback(
    async (rating: number, previous: PropertyRatingState) => {
      if (!propertyUuid) return;
      const requested = ++version.current;
      setState({ ...previous, myRating: rating });
      const result = await setPropertyRatingAction({ propertyUuid, rating });
      if (requested !== version.current) return;
      if (result.success) {
        setState({ ...previous, average: result.average, total: result.total, myRating: result.myRating });
        toast.success("¡Gracias por calificar!", `Le diste ${rating} ${rating === 1 ? "estrella" : "estrellas"} a este proyecto.`);
      } else {
        setState(previous);
        toast.error("No se guardó tu calificación", result.error);
      }
    },
    [propertyUuid, toast],
  );

  // `save` changes whenever the toast context does; reading it through a ref keeps `reload` (and
  // the effect that calls it) stable instead of refetching after every toast.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const reload = useCallback(() => {
    if (!propertyUuid) return;
    const requested = ++version.current;
    getPropertyRatingAction(propertyUuid)
      .then((next) => {
        if (requested !== version.current || !next) return;
        setState(next);
        const pending = pendingRating.current;
        if (pending && next.access === "can-rate") {
          pendingRating.current = null;
          void saveRef.current(pending, next);
        }
      })
      .catch(() => {
        // Keep what's on screen; the next reload tries again.
      });
  }, [propertyUuid]);

  useEffect(() => {
    reload();
    // The visitor may have signed in or out in another tab.
    function onVisible() {
      if (document.visibilityState === "visible") reload();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  // Signing in from the modal: re-read who's rating once it closes.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !authModal.isOpen) reload();
    wasOpen.current = authModal.isOpen;
  }, [authModal.isOpen, reload]);

  function rate(rating: number) {
    if (!state) return;
    if (state.access === "signed-out") {
      pendingRating.current = rating;
      authModal.open();
      return;
    }
    if (state.access === "not-allowed") {
      toast.info("Solo para usuarios", "Las calificaciones son de las personas que buscan vivienda en Delfos.");
      return;
    }
    void save(rating, state);
  }

  if (!propertyUuid) return <>{children}</>;

  return (
    <RatingContext.Provider value={{ state, rate }}>
      {children}
      <AuthModal state={authModal} stayOnPage />
    </RatingContext.Provider>
  );
}

/** Five stars filled up to `value` (fractions too), in the brand colour. */
export function Stars({ value, className = "size-4" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${decimal.format(value)} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((index) => {
        const fill = Math.min(Math.max(value - (index - 1), 0), 1);
        return (
          <span key={index} className="relative inline-flex">
            <Star className={`${className} fill-current text-separator`} strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={`${className} fill-current`} strokeWidth={0} style={{ color: STAR_COLOR }} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** "★★★★☆ 4,3 · 12 calificaciones" under the title; only once the property has ratings. */
export function RatingSummary() {
  const rating = useRating();
  const state = rating?.state;
  if (!state || state.total === 0) return null;

  return (
    <a href="#calificacion" className="mt-2 inline-flex items-center gap-2 text-sm text-foreground hover:underline">
      <Stars value={state.average} />
      <span className="font-semibold">{decimal.format(state.average)}</span>
      <span className="text-muted">
        · {state.total} {state.total === 1 ? "calificación" : "calificaciones"}
      </span>
    </a>
  );
}

/** Little stars that fly out of a face when it's picked. */
function StarBurst() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        return (
          <motion.span
            key={index}
            className="absolute"
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
            animate={{ x: Math.cos(angle) * 42, y: Math.sin(angle) * 42, scale: 1, opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <Star className="size-3 fill-current" strokeWidth={0} style={{ color: STAR_COLOR }} />
          </motion.span>
        );
      })}
    </span>
  );
}

/** "¿Qué te parece este proyecto?": five emoji faces (1–5 stars) that bounce when picked. */
export function RatingSection() {
  const rating = useRating();
  const reduceMotion = useReducedMotion();
  // The face just tapped, keyed by time so tapping the same one replays the animation.
  const [burst, setBurst] = useState<{ value: number; key: number } | null>(null);
  if (!rating) return null;

  const { state, rate } = rating;
  const selected = state?.myRating ?? null;
  const shown = FACES.find((face) => face.value === selected);

  return (
    <section id="calificacion" className="scroll-mt-24">
      <h3 className="font-display text-2xl font-semibold text-foreground">¿Qué te parece este proyecto?</h3>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        {state && state.total > 0 ? (
          <>
            <Stars value={state.average} />
            <span>
              <span className="font-semibold text-foreground">{decimal.format(state.average)}</span> de 5 ·{" "}
              {state.total} {state.total === 1 ? "calificación" : "calificaciones"}
            </span>
          </>
        ) : (
          <span>Aún no tiene calificaciones. ¡Sé el primero en calificarlo!</span>
        )}
      </div>

      <div className="brand-rule mt-5 rounded-3xl border border-separator p-5">
        <div role="radiogroup" aria-label="Tu calificación" className="grid grid-cols-5 gap-2">
          {FACES.map((face) => {
            const isSelected = selected === face.value;
            const isBursting = burst?.value === face.value;
            return (
              <motion.button
                key={face.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`${face.label}: ${face.value} ${face.value === 1 ? "estrella" : "estrellas"}`}
                disabled={!state}
                onClick={() => {
                  setBurst({ value: face.value, key: Date.now() });
                  rate(face.value);
                }}
                whileHover={reduceMotion ? undefined : { y: -3 }}
                whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                className={`relative flex flex-col items-center gap-1.5 rounded-2xl px-1 py-3 transition-colors disabled:opacity-50 ${
                  isSelected ? "bg-surface-secondary" : "hover:bg-surface-secondary/60"
                }`}
                style={isSelected ? { boxShadow: `inset 0 0 0 2px ${STAR_COLOR}` } : undefined}
              >
                <motion.span
                  key={isBursting ? burst?.key : "idle"}
                  className={`relative text-3xl leading-none transition-[filter,opacity] sm:text-4xl ${
                    selected && !isSelected ? "opacity-50 grayscale" : ""
                  }`}
                  initial={false}
                  animate={
                    isBursting && !reduceMotion
                      ? { scale: [1, 1.6, 0.85, 1.2, 1], rotate: [0, -16, 12, -6, 0] }
                      : { scale: 1, rotate: 0 }
                  }
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  {face.emoji}
                  {isBursting && !reduceMotion ? <StarBurst key={burst?.key} /> : null}
                </motion.span>
                <span className={`text-[11px] font-medium sm:text-xs ${isSelected ? "text-foreground" : "text-muted"}`}>
                  {face.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-4 flex min-h-6 items-center justify-center gap-2 text-sm text-muted">
          {shown ? (
            <>
              <span>Tu calificación:</span>
              <Stars value={shown.value} />
            </>
          ) : state?.access === "signed-out" ? (
            <span>Inicia sesión para calificar este proyecto.</span>
          ) : state?.access === "not-allowed" ? (
            <span>Solo los usuarios pueden calificar proyectos.</span>
          ) : (
            <span>Toca una carita para calificar de 1 a 5 estrellas.</span>
          )}
        </div>
      </div>
    </section>
  );
}
