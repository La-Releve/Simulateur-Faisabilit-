"use client";

import NumberFlow, { type Format } from "@number-flow/react";
import {
  formatEur,
  formatEurM2,
  formatEurM2Signed,
  formatEurSigned,
  formatPct1,
  formatPctInt,
} from "@/lib/simulateur/format";

type Kind = "eur" | "eurSigned" | "eurM2" | "eurM2Signed" | "pctInt" | "pct1";

// Mêmes règles d'arrondi que format.ts : euro inférieur pour les positifs, vers zéro pour les négatifs.
const roundEur = (n: number) => (n < 0 ? Math.trunc(n) : Math.floor(n));

const INT: Format = { maximumFractionDigits: 0 };
const INT_SIGNED: Format = { maximumFractionDigits: 0, signDisplay: "exceptZero" };
const ONE_DECIMAL: Format = { minimumFractionDigits: 1, maximumFractionDigits: 1 };

interface KindConfig {
  format: Format;
  suffix: string;
  value: (n: number) => number;
  /** Texte équivalent, lu par les lecteurs d'écran. */
  text: (n: number) => string;
}

const CONFIG: Record<Kind, KindConfig> = {
  eur: { format: INT, suffix: " €", value: roundEur, text: formatEur },
  eurSigned: { format: INT_SIGNED, suffix: " €", value: roundEur, text: formatEurSigned },
  eurM2: { format: INT, suffix: " €/m²", value: roundEur, text: formatEurM2 },
  eurM2Signed: { format: INT_SIGNED, suffix: " €/m²", value: roundEur, text: formatEurM2Signed },
  pctInt: { format: INT, suffix: " %", value: Math.round, text: formatPctInt },
  pct1: { format: ONE_DECIMAL, suffix: " %", value: (r) => Math.round(r * 1000) / 10, text: formatPct1 },
};

// Durée courte (--duration-slow) : pendant la frappe, le compteur rattrape la valeur sans tourner longtemps.
const TRANSFORM = { duration: 400, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };
const OPACITY = { duration: 250, easing: "ease-out" };

/** Montant animé : les chiffres roulent vers la nouvelle valeur (NumberFlow, respecte prefers-reduced-motion). */
export function AnimatedNumber({ value, kind, className }: { value: number; kind: Kind; className?: string }) {
  const c = CONFIG[kind];
  return (
    <span className={className}>
      {/* Le compteur visuel serait lu chiffre par chiffre : on expose le texte formaté à la place. */}
      <span className="sr-only">{c.text(value)}</span>
      <NumberFlow
        aria-hidden="true"
        value={c.value(value)}
        locales="fr-FR"
        format={c.format}
        suffix={c.suffix}
        transformTiming={TRANSFORM}
        spinTiming={TRANSFORM}
        opacityTiming={OPACITY}
      />
    </span>
  );
}
