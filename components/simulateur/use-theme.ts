"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";
export const THEME_KEY = "theme";

const THEME_COLORS: Record<Theme, string> = { light: "#f7f7f8", dark: "#09090b" };

const systemTheme = (): Theme => (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

function readStored(): Theme | null {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  // Aligne la barre d'état / l'UI du navigateur sur le thème effectif (y compris si forcé)
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", THEME_COLORS[theme]));
}

/**
 * Thème clair / sombre. Suit l'apparence système par défaut ; un choix manuel n'est
 * enregistré que s'il diffère du système (revenir au thème système = suivre à nouveau le système).
 */
export function useTheme() {
  // Valeur initiale identique au rendu serveur ; synchronisée au montage avec data-theme (posé par le script de layout).
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as Theme) || systemTheme();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture du DOM au montage
    setTheme(current);
    apply(current);

    const mql = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if (readStored()) return; // choix manuel prioritaire
      const next = systemTheme();
      apply(next);
      setTheme(next);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    try {
      if (next === systemTheme()) localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {}
    apply(next);
    setTheme(next);
  }, [theme]);

  return { theme, toggle };
}
