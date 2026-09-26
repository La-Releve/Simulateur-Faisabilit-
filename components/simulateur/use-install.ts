"use client";

import { useCallback, useEffect, useState } from "react";

export const PWA_DISMISSED_KEY = "pwa-guide:dismissed";

export type Platform = "ios-safari" | "ios-inapp" | "android" | "android-inapp" | "desktop";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|Line\/|Snapchat|Twitter|TikTok|musical_ly|Bytedance|Pinterest|WhatsApp|GSA\//i;

export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const isIOS =
    /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const inApp = IN_APP.test(ua);
  if (isIOS) {
    // Les autres navigateurs iOS (Chrome, Firefox…) ne proposent pas l'ajout de la même façon : on renvoie vers Safari.
    const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    return inApp || otherBrowser ? "ios-inapp" : "ios-safari";
  }
  if (/Android/i.test(ua)) return inApp || /; wv\)/.test(ua) ? "android-inapp" : "android";
  return "desktop";
}

function readDismissed() {
  try {
    return localStorage.getItem(PWA_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** État d'installation PWA et règles d'ouverture automatique du guide. */
export function useInstall() {
  const [ready, setReady] = useState(false);
  const [standalone, setStandalone] = useState(true);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const sa = isStandalone();
    const p = detectPlatform();
    // Détection navigateur uniquement disponible côté client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStandalone(sa);
    setPlatform(p);
    setReady(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setStandalone(true);
      setOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!sa && (p === "ios-safari" || p === "ios-inapp" || p === "android-inapp") && !readDismissed()) {
      timer = setTimeout(() => setOpen(true), 1000);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(PWA_DISMISSED_KEY, "1");
    } catch {}
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    setDeferred(null);
  }, [deferred]);

  return {
    ready,
    standalone,
    platform,
    open,
    openGuide: () => setOpen(true),
    dismiss,
    canPromptInstall: deferred !== null,
    promptInstall,
  };
}
