/**
 * Catalogue des actions suivies. Aucune donnée saisie (montant, surface…) n'est jamais
 * transmise : uniquement le type d'action.
 * - `type` : option de la colonne « Type » de la base Notion
 * - `phrase` : titre de la ligne, en français parlé
 */
export const TRACK_EVENTS = {
  visit: { type: "Visite", phrase: "A ouvert le simulateur" },
  app_open: { type: "Application ouverte", phrase: "A ouvert l'application installée" },
  app_installed: { type: "Application installée", phrase: "A installé l'application" },
  app_first_launch: {
    type: "Application installée",
    phrase: "A installé l'application (première ouverture depuis l'écran d'accueil)",
  },
  simulation_complete: { type: "Simulation réalisée", phrase: "A réalisé une simulation" },
  share_header: { type: "Simulation partagée", phrase: "A partagé une simulation (bouton en haut de page)" },
  share_bottom: { type: "Simulation partagée", phrase: "A partagé une simulation (bouton en bas de page)" },
  shared_link_open: { type: "Lien partagé ouvert", phrase: "A ouvert une simulation qu'on lui a partagée" },
  install_guide_auto: { type: "Guide d'installation ouvert", phrase: "A vu le guide d'installation (ouverture automatique)" },
  install_guide_manual: { type: "Guide d'installation ouvert", phrase: "A ouvert le guide d'installation" },
  new_simulation: { type: "Nouvelle simulation", phrase: "A lancé une nouvelle simulation" },
} as const;

export type TrackEventName = keyof typeof TRACK_EVENTS;

export function isTrackEvent(name: unknown): name is TrackEventName {
  return typeof name === "string" && Object.prototype.hasOwnProperty.call(TRACK_EVENTS, name);
}

/** Événement tel qu'envoyé par le navigateur (horodaté à l'action, même s'il part plus tard). */
export interface TrackPayload {
  e: TrackEventName;
  /** Date ISO de l'action côté client */
  at: string;
}

export type Device = "Mobile" | "Tablette" | "Desktop";

export function deviceFromUserAgent(ua: string): Device {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "Tablette";
  if (/Mobi|iPhone|iPod|Android|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return "Mobile";
  return "Desktop";
}

export function isBot(ua: string): boolean {
  return /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|headless|lighthouse/i.test(ua);
}
