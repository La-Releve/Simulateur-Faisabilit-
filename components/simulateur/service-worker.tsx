"use client";

import { useEffect } from "react";

/** Enregistre le service worker (généré par `serwist build`) pour le fonctionnement hors ligne. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
  }, []);
  return null;
}
