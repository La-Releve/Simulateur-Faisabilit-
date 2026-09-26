import { DUREE_DEFAUT, DUREES } from "./params";
import { parseInput } from "./format";
import type { Inputs, ModeAgence } from "./types";
import type { ScenarioKey } from "./scenarios";

/** État de saisie tel que tapé par l'utilisateur (chaînes), persisté localement. */
export interface SimState {
  v: 1;
  prixAcquisition: string;
  surface: string;
  travaux: string;
  duree: number;
  modeAgence: ModeAgence;
  agence: string;
  ventes: Record<ScenarioKey, string>;
}

export const STORAGE_KEY = "simulateur:v1";
export const SHARE_PREFIX = "#s=";

export const DEFAULT_STATE: SimState = {
  v: 1,
  prixAcquisition: "",
  surface: "",
  travaux: "",
  duree: DUREE_DEFAUT,
  modeAgence: "pct",
  agence: "5",
  ventes: { pessimiste: "", realiste: "", optimiste: "" },
};

const str = (x: unknown, fallback: string) => (typeof x === "string" ? x.slice(0, 32) : fallback);

/** Valide un objet inconnu (localStorage, lien partagé) et le ramène à un SimState sûr. */
export function sanitizeState(raw: unknown): SimState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1) return null;
  const ventes = (o.ventes && typeof o.ventes === "object" ? o.ventes : {}) as Record<string, unknown>;
  const duree = (DUREES as readonly number[]).includes(o.duree as number) ? (o.duree as number) : DUREE_DEFAUT;
  return {
    v: 1,
    prixAcquisition: str(o.prixAcquisition, ""),
    surface: str(o.surface, ""),
    travaux: str(o.travaux, ""),
    duree,
    modeAgence: o.modeAgence === "eur" ? "eur" : "pct",
    agence: str(o.agence, DEFAULT_STATE.agence),
    ventes: {
      pessimiste: str(ventes.pessimiste, ""),
      realiste: str(ventes.realiste, ""),
      optimiste: str(ventes.optimiste, ""),
    },
  };
}

export type Validation =
  | { ok: true; inputs: Inputs }
  | { ok: false; missing: ("prixAcquisition" | "surface" | "travaux")[]; surfaceZero: boolean };

/** Convertit la saisie en Inputs du moteur, ou liste les champs manquants. */
export function toInputs(s: SimState): Validation {
  const P = parseInput(s.prixAcquisition);
  const S = parseInput(s.surface);
  const T = parseInput(s.travaux);
  const missing: ("prixAcquisition" | "surface" | "travaux")[] = [];
  if (P === null || P < 0) missing.push("prixAcquisition");
  if (S === null || S < 0) missing.push("surface");
  if (T === null || T < 0) missing.push("travaux");
  const surfaceZero = S === 0;
  if (missing.length || surfaceZero || P === null || S === null || T === null) {
    return { ok: false, missing, surfaceZero };
  }
  const agence = Math.max(0, parseInput(s.agence) ?? 0);
  return {
    ok: true,
    inputs: {
      prixAcquisition: P,
      surface: S,
      travaux: T,
      duree: s.duree,
      modeAgence: s.modeAgence,
      // Saisi en % (5 pour 5 %), stocké en décimal
      valeurAgence: s.modeAgence === "pct" ? agence / 100 : agence,
    },
  };
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64: string): string {
  const bin = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** Encode l'état dans un fragment d'URL (jamais transmis au serveur). */
export function encodeShareHash(s: SimState): string {
  return SHARE_PREFIX + toBase64Url(JSON.stringify(s));
}

export function decodeShareHash(hash: string): SimState | null {
  if (!hash.startsWith(SHARE_PREFIX)) return null;
  try {
    return sanitizeState(JSON.parse(fromBase64Url(hash.slice(SHARE_PREFIX.length))));
  } catch {
    return null;
  }
}
