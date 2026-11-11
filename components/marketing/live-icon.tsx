"use client";

import { useEffect, useRef } from "react";
import {
  ArrowRightIcon,
  BadgePercentIcon,
  BlocksIcon,
  CalendarCheckIcon,
  CircleDollarSignIcon,
  ClipboardCheckIcon,
  HandCoinsIcon,
  HomeIcon,
  KeyIcon,
  LayersIcon,
  SlidersHorizontalIcon,
  type HomeIconHandle,
} from "lucide-animated";

/**
 * The landing's animated icons, by name, so server components can use them (a component can't be
 * passed from server to client; a string can).
 */
const ICONS = {
  home: HomeIcon,
  key: KeyIcon,
  percent: BadgePercentIcon,
  layers: LayersIcon,
  blocks: BlocksIcon,
  sliders: SlidersHorizontalIcon,
  coins: HandCoinsIcon,
  clipboard: ClipboardCheckIcon,
  dollar: CircleDollarSignIcon,
  calendar: CalendarCheckIcon,
  arrow: ArrowRightIcon,
} as const;

export type LiveIconName = keyof typeof ICONS;

/** Put this attribute on the card/button whose hover or focus should play the icons inside it. */
export const LIVE_ICON_TRIGGER = { "data-live-icon-trigger": "" } as const;

/**
 * A `lucide-animated` icon that plays when its *whole* card or button (the nearest ancestor with
 * `LIVE_ICON_TRIGGER`) is hovered or focused, not only the icon itself, and once when it first
 * scrolls into view, so it also moves on phones, which have no hover. Holding a ref switches off
 * the library's own icon-only hover. Reduced motion: it stays still.
 */
export function LiveIcon({ name, size = 24, className }: { name: LiveIconName; size?: number; className?: string }) {
  // Every icon's handle has the same shape ({ startAnimation, stopAnimation }), so one type fits all.
  const Icon = ICONS[name] as typeof HomeIcon;
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HomeIconHandle>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = () => iconRef.current?.startAnimation();
    const stop = () => iconRef.current?.stopAnimation();

    const host = wrapper.closest<HTMLElement>("[data-live-icon-trigger]");
    host?.addEventListener("pointerenter", start);
    host?.addEventListener("pointerleave", stop);
    host?.addEventListener("focusin", start);
    host?.addEventListener("focusout", stop);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        start();
        observer.disconnect();
      },
      { threshold: 0.8 },
    );
    observer.observe(wrapper);

    return () => {
      host?.removeEventListener("pointerenter", start);
      host?.removeEventListener("pointerleave", stop);
      host?.removeEventListener("focusin", start);
      host?.removeEventListener("focusout", stop);
      observer.disconnect();
    };
  }, []);

  return (
    <span ref={wrapperRef} aria-hidden="true" className={`inline-flex shrink-0 ${className ?? ""}`}>
      <Icon ref={iconRef} size={size} />
    </span>
  );
}
