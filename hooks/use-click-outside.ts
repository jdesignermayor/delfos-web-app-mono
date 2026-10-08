"use client";

import { useEffect, useRef, type RefObject } from "react";

/** Calls `onOutside` on any pointer press that lands outside `ref`'s element. */
export function useClickOutside<T extends HTMLElement>(ref: RefObject<T | null>, onOutside: () => void) {
  // Always call the latest handler without re-subscribing on every render.
  const handlerRef = useRef(onOutside);
  useEffect(() => {
    handlerRef.current = onOutside;
  });

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) handlerRef.current();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [ref]);
}
