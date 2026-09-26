"use client";

import { useSyncExternalStore } from "react";

/** Media query réactive ; `fallback` est utilisé côté serveur. */
export function useMedia(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}

export function useReducedMotion() {
  return useMedia("(prefers-reduced-motion: reduce)");
}
