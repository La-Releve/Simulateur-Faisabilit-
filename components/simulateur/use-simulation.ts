"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_STATE, STORAGE_KEY, decodeShareHash, sanitizeState, type SimState } from "@/lib/simulateur/state";

/**
 * État de la simulation, sauvegardé automatiquement dans localStorage (propre à l'appareil).
 * Un lien partagé (#s=…) est chargé puis retiré de l'URL.
 */
export function useSimulation() {
  const [state, setState] = useState<SimState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    let loaded: SimState | null = decodeShareHash(window.location.hash);
    if (loaded) {
      history.replaceState(null, "", window.location.pathname);
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        loaded = raw ? sanitizeState(JSON.parse(raw)) : null;
      } catch {
        loaded = null;
      }
    }
    // Restauration unique au montage depuis le stockage local (indisponible côté serveur).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (loaded) setState(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipSave.current) {
      skipSave.current = false;
      if (state === DEFAULT_STATE) return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // stockage indisponible (navigation privée) : la simulation reste en mémoire
    }
  }, [state, hydrated]);

  const update = useCallback(<K extends keyof SimState>(key: K, value: SimState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    skipSave.current = true;
    setState(DEFAULT_STATE);
  }, []);

  return { state, setState, update, reset, hydrated };
}
