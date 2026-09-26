"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Platform } from "./use-install";

interface InstallGuideProps {
  open: boolean;
  platform: Platform;
  canPromptInstall: boolean;
  onInstall: () => void;
  onClose: () => void;
}

const STEPS = ["Touche Partager", "« Sur l'écran d'accueil »", "« Ajouter »"];

/** Modale (bottom sheet sur mobile) expliquant l'installation de la PWA. */
export function InstallGuide({ open, platform, canPromptInstall, onInstall, onClose }: InstallGuideProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<"closed" | "open" | "closing">("closed");

  // transitions.dev « Modal open / close » : ouverture sur l'horloge lente, fermeture plus courte,
  // le <dialog> n'est retiré qu'une fois l'animation de sortie jouée.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open) {
      if (!d.open) d.showModal();
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setState("open")));
      return () => cancelAnimationFrame(raf);
    }
    if (!d.open) return;
    setState("closing");
    const ms = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : window.matchMedia("(max-width: 767px)").matches
        ? 350
        : 150;
    const t = setTimeout(() => {
      d.close();
      setState("closed");
    }, ms);
    return () => clearTimeout(t);
  }, [open]);

  const inApp = platform === "ios-inapp" || platform === "android-inapp";
  const ios = platform === "ios-safari";

  return (
    <dialog
      ref={dialogRef}
      data-state={state}
      aria-labelledby="install-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="t-modal-backdrop fixed m-0 mt-auto w-full max-w-none bg-transparent p-0 text-white md:m-auto md:max-w-[440px]"
    >
      <div className="t-modal relative rounded-t-3xl border border-line bg-dark-gray p-5 pb-[max(20px,env(safe-area-inset-bottom))] md:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-black/40 text-white/80 hover:text-white"
        >
          <X className="size-4" />
        </button>

        {ios ? (
          <div className="mb-5 overflow-hidden rounded-2xl bg-[#f4f4f5]">
            {open || state !== "closed" ? (
              <iframe
                src="/pwa-install-animation.html"
                title="Animation : ajouter le simulateur à l'écran d'accueil depuis Safari"
                className="block h-[420px] w-full border-0"
                style={{ maxHeight: "52dvh" }}
                loading="eager"
              />
            ) : null}
          </div>
        ) : null}

        <h2 id="install-title" className="pr-10 text-2xl leading-tight font-extrabold">
          {inApp
            ? "Ouvre ce lien dans Safari pour installer l'app"
            : ios
              ? "Installe le simulateur sur ton iPhone"
              : "Installe le simulateur"}
        </h2>

        {inApp ? (
          <p className="mt-3 text-sm font-light text-text-secondary">
            Ce navigateur intégré ne permet pas l&apos;ajout à l&apos;écran d&apos;accueil. Touche le menu (••• ou ⋯) puis
            « Ouvrir dans le navigateur »{platform === "ios-inapp" ? " / « Ouvrir dans Safari »" : ""}.
          </p>
        ) : ios ? (
          <ol className="mt-4 flex flex-col gap-2">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm text-text-secondary">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-orange">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm font-light text-text-secondary">
            {canPromptInstall
              ? "Ajoute le simulateur à ton écran d'accueil : il s'ouvre comme une app et fonctionne hors ligne."
              : "Utilise le menu de ton navigateur puis « Installer l'application » ou « Ajouter à l'écran d'accueil »."}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {canPromptInstall && !ios && !inApp ? (
            <button
              type="button"
              onClick={onInstall}
              className="h-12 rounded-xl bg-orange px-6 text-base font-semibold text-white"
            >
              Installer l&apos;app
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className={
              canPromptInstall && !ios && !inApp
                ? "h-12 rounded-xl border border-line-strong px-6 text-base font-semibold text-white"
                : "h-12 rounded-xl bg-orange px-6 text-base font-semibold text-white"
            }
          >
            J&apos;ai compris
          </button>
        </div>
      </div>
    </dialog>
  );
}
