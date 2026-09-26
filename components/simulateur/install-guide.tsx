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

/** Glyphe Partager d'iOS (assets/ios-icons/square.and.arrow.up.svg). */
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 433.35 670.654" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M433.35 296.387L433.35 484.375C433.35 550.049 396.729 586.426 331.055 586.426L102.051 586.426C36.377 586.426 0 550.049 0 484.375L0 296.387C0 230.957 36.377 194.336 102.051 194.336L151.367 194.336L151.367 233.643L102.051 233.643C62.0117 233.643 39.3066 256.348 39.3066 296.387L39.3066 484.375C39.3066 524.658 62.0117 547.119 102.051 547.119L331.055 547.119C371.338 547.119 394.043 524.658 394.043 484.375L394.043 296.387C394.043 256.348 371.338 233.643 331.055 233.643L281.738 233.643L281.738 194.336L331.055 194.336C396.729 194.336 433.35 230.957 433.35 296.387Z" />
      <path d="M133.789 152.1C138.428 152.1 143.799 150.146 147.217 146.24L185.059 105.957L216.553 72.5098L248.291 105.957L285.889 146.24C289.307 150.146 294.434 152.1 299.072 152.1C309.326 152.1 316.895 145.02 316.895 135.01C316.895 129.639 314.941 125.732 311.279 122.07L230.713 44.4336C225.83 39.5508 221.68 38.0859 216.553 38.0859C211.67 38.0859 207.52 39.5508 202.393 44.4336L122.07 122.07C118.408 125.732 116.211 129.639 116.211 135.01C116.211 145.02 123.535 152.1 133.789 152.1ZM216.553 395.264C227.051 395.264 236.084 386.719 236.084 376.465L236.084 128.174L233.154 62.2559C232.666 53.4668 225.586 45.8984 216.553 45.8984C207.764 45.8984 200.684 53.4668 200.195 62.2559L197.266 128.174L197.266 376.465C197.266 386.719 206.055 395.264 216.553 395.264Z" />
    </svg>
  );
}

/** Glyphe « plus.app » d'iOS (assets/ios-icons/plus.app.svg). */
function PlusAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 450.195 449.951" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M132.812 449.951L317.139 449.951C360.107 449.951 393.555 437.5 415.527 415.527C438.232 393.066 450.195 359.619 450.195 316.895L450.195 133.057C450.195 90.332 438.232 56.8848 415.527 34.4238C393.311 12.207 360.107 0 317.139 0L132.812 0C90.0879 0 56.3965 12.4512 34.4238 34.4238C11.9629 56.8848 0 90.332 0 133.057L0 316.895C0 359.619 11.7188 393.066 34.4238 415.527C56.6406 437.744 90.0879 449.951 132.812 449.951ZM132.812 410.645C102.539 410.645 78.8574 402.1 63.4766 386.719C47.6074 371.094 39.3066 347.656 39.3066 316.895L39.3066 133.057C39.3066 102.295 47.6074 78.8574 63.4766 63.2324C78.6133 48.0957 102.539 39.3066 132.812 39.3066L317.139 39.3066C347.656 39.3066 371.094 47.8516 386.719 63.2324C402.588 78.8574 410.889 102.295 410.889 133.057L410.889 316.895C410.889 347.656 402.588 371.094 386.719 386.719C371.338 401.855 347.656 410.645 317.139 410.645Z" />
      <path d="M245.605 316.895L245.605 132.324C245.605 119.873 237.061 111.328 224.854 111.328C212.891 111.328 204.834 119.873 204.834 132.324L204.834 316.895C204.834 329.102 212.891 337.646 224.854 337.646C237.061 337.646 245.605 329.346 245.605 316.895ZM133.057 244.873L317.627 244.873C329.834 244.873 338.379 236.816 338.379 224.854C338.379 212.646 329.834 204.102 317.627 204.102L133.057 204.102C120.361 204.102 112.061 212.646 112.061 224.854C112.061 236.816 120.605 244.873 133.057 244.873Z" />
    </svg>
  );
}

const STEPS = [
  { text: "Clique sur Partager", icon: <ShareIcon className="h-[18px] w-auto" /> },
  { text: "Clique sur « Sur l'écran d'accueil »", icon: <PlusAppIcon className="size-[17px]" /> },
  { text: "« Ajouter »", icon: null },
];

/** Modale (bottom sheet sur mobile) expliquant l'installation de la PWA. */
export function InstallGuide({ open, platform, canPromptInstall, onInstall, onClose }: InstallGuideProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const ios = platform === "ios-safari";

  // L'animation est préchargée en pause dès le montage (iframe dans le <dialog> fermé) :
  // à l'ouverture elle est déjà prête, on la relance simplement depuis le début.
  const post = (type: "pwa-anim:play" | "pwa-anim:pause") => {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--surface-elevated").trim();
    win.postMessage({ type, bg }, window.location.origin);
  };

  const [state, setState] = useState<"closed" | "open" | "closing">("closed");

  // transitions.dev « Modal open / close » : ouverture sur l'horloge lente, fermeture plus courte,
  // le <dialog> n'est retiré qu'une fois l'animation de sortie jouée.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open) {
      if (!d.open) {
        d.showModal();
        // Focus sur l'action principale plutôt que sur la croix (premier élément focusable)
        primaryRef.current?.focus({ preventScroll: true });
      }
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

  // Après showModal (effet précédent) : l'iframe est visible, l'animation peut se mesurer et démarrer.
  useEffect(() => {
    if (ios && frameLoaded) post(open ? "pwa-anim:play" : "pwa-anim:pause");
  }, [open, frameLoaded, ios]);

  const inApp = platform === "ios-inapp" || platform === "android-inapp";

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
      className="t-modal-backdrop fixed m-0 mt-auto w-full max-w-none bg-transparent p-0 text-fg md:m-auto md:max-w-[440px]"
    >
      <div className="t-modal relative rounded-t-3xl border border-line bg-elevated p-5 pb-[max(20px,env(safe-area-inset-bottom))] md:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-fg/10 text-fg/80 hover:text-fg"
        >
          <X className="size-4" />
        </button>

        {ios ? (
          // Encastré : l'iframe (fond transparent) occupe le haut de la feuille, bord à bord ;
          // le téléphone « sort » du bord supérieur, sans encadré.
          <div className="-mx-5 -mt-5 mb-4 overflow-hidden rounded-t-3xl">
            <iframe
              ref={frameRef}
              src="/pwa-install-animation.html#paused"
              title="Animation : ajouter le simulateur à l'écran d'accueil depuis Safari"
              onLoad={() => setFrameLoaded(true)}
              className={`block h-[420px] w-full border-0 transition-opacity duration-(--duration-fast) ${frameLoaded ? "opacity-100" : "opacity-0"}`}
              style={{ maxHeight: "52dvh" }}
              loading="eager"
            />
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
            {STEPS.map((step, i) => (
              <li key={step.text} className="flex items-center gap-3 text-sm text-text-secondary">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-orange">
                  {i + 1}
                </span>
                <span>{step.text}</span>
                {step.icon ? <span className="flex shrink-0 items-center text-fg">{step.icon}</span> : null}
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
            ref={primaryRef}
            className={
              canPromptInstall && !ios && !inApp
                ? "h-12 rounded-xl border border-line-strong px-6 text-base font-semibold text-fg"
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
