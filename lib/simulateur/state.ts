import { DUREE_DEFAUT, DUREES } from "./params";
import { formatInputDraft, parseInput } from "./format";
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

/** Valide un objet inconnu (localStorage) et le ramène à un SimState sûr. */
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

/* ------------------------------------------------------------------ Lien de partage
 * Sans base de données, la simulation voyage dans l'URL elle-même, sous une forme compacte
 * qui ressemble à un identifiant : chaque nombre est multiplié par 100 (décimales conservées)
 * puis écrit en base 36. Elle est placée dans le fragment (#s=…), que le navigateur n'envoie
 * jamais au serveur : aucune donnée n'apparaît dans les logs d'hébergement.
 *
 * Format v1 : 1.<prix>.<surface>.<travaux>.<durée>.<p|e><agence>.<pessimiste>.<réaliste>.<optimiste>
 * Un prix de vente vide = prix proposé automatiquement ; les champs vides de fin sont omis.
 * Ex. 450 000 € / 220 m² / 1 300 000 € / 12 mois / 5 % → #s=1.qsi80.gz4.25ecn4.c.pdw
 */
const SHARE_VERSION = "1";

function encodeNumber(raw: string): string {
  const n = parseInput(raw);
  return n === null || n < 0 ? "" : Math.round(n * 100).toString(36);
}

function decodeNumber(code: string): string {
  if (code === "") return "";
  if (!/^[0-9a-z]{1,12}$/.test(code)) throw new Error("code invalide");
  const n = parseInt(code, 36) / 100;
  return formatInputDraft(String(n).replace(".", ","));
}

export function encodeShareCode(s: SimState): string {
  const parts = [
    SHARE_VERSION,
    encodeNumber(s.prixAcquisition),
    encodeNumber(s.surface),
    encodeNumber(s.travaux),
    s.duree.toString(36),
    (s.modeAgence === "pct" ? "p" : "e") + encodeNumber(s.agence),
    encodeNumber(s.ventes.pessimiste),
    encodeNumber(s.ventes.realiste),
    encodeNumber(s.ventes.optimiste),
  ];
  while (parts.length > 6 && parts[parts.length - 1] === "") parts.pop();
  return parts.join(".");
}

export function decodeShareCode(code: string): SimState | null {
  try {
    const [version, prix, surface, travaux, duree, agence = "p", pess = "", real = "", opt = ""] = code.split(".");
    if (version !== SHARE_VERSION) return null;
    return sanitizeState({
      v: 1,
      prixAcquisition: decodeNumber(prix ?? ""),
      surface: decodeNumber(surface ?? ""),
      travaux: decodeNumber(travaux ?? ""),
      duree: parseInt(duree ?? "", 36),
      modeAgence: agence[0] === "e" ? "eur" : "pct",
      agence: decodeNumber(agence.slice(1)),
      ventes: { pessimiste: decodeNumber(pess), realiste: decodeNumber(real), optimiste: decodeNumber(opt) },
    });
  } catch {
    return null;
  }
}

export function shareUrl(s: SimState, origin: string, pathname = "/"): string {
  return `${origin}${pathname}${SHARE_PREFIX}${encodeShareCode(s)}`;
}

/** Lit une simulation partagée depuis le fragment de l'URL (#s=…), ou null. */
export function readShareHash(hash: string): SimState | null {
  return hash.startsWith(SHARE_PREFIX) ? decodeShareCode(hash.slice(SHARE_PREFIX.length)) : null;
}
