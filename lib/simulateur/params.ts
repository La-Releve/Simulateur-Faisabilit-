/**
 * Paramètres fixes du simulateur (repris de l'outil Notion).
 * Seul endroit où les taux et pourcentages sont définis.
 * Tous les taux sont exprimés en décimal (0,015 = 1,5 %).
 */
export interface Params {
  /** Part du prix d'acquisition financée par la banque. */
  quotiteAcquisition: number;
  /** Part des travaux financée par la banque. */
  quotiteTravaux: number;
  /** Frais de garantie, × financement bancaire (R1). */
  tauxGarantie: number;
  /** Frais de notaire, × prix d'acquisition. */
  tauxNotaire: number;
  /** Frais de courtage, × financement bancaire (R1). */
  tauxCourtage: number;
  /** Intérêts bancaires annuels, × R1 × durée / 12. */
  tauxInteretsBanqueAnnuel: number;
  /** Frais de dossier bancaire, × R1. */
  tauxFraisDossier: number;
  /** Commission d'engagement (one-time), × R1. */
  tauxCommissionEngagement: number;
  /** Part de l'apport financée par dette obligataire. */
  partDetteObligataire: number;
  /** Intérêts obligataires annuels, × dette obligataire × durée / 12. */
  tauxObligataireAnnuel: number;
  /** Frais de structuration obligataire (one-time), × dette obligataire. */
  tauxStructurationObligataire: number;
}

export const PARAMS: Params = {
  quotiteAcquisition: 0.75,
  quotiteTravaux: 1,
  tauxGarantie: 0.015,
  tauxNotaire: 0.025,
  tauxCourtage: 0.015,
  tauxInteretsBanqueAnnuel: 0.055,
  tauxFraisDossier: 0.005,
  tauxCommissionEngagement: 0.005,
  partDetteObligataire: 0.8,
  tauxObligataireAnnuel: 0.1,
  tauxStructurationObligataire: 0.05,
};

/**
 * Prix de vente au m² proposé par défaut pour chaque scénario : prix de revient au m² majoré
 * de cette marge (décimal). L'utilisateur peut remplacer la valeur proposée.
 */
export const MARGES_SCENARIOS = {
  pessimiste: 0.1,
  realiste: 0.15,
  optimiste: 0.2,
} as const;

/** Durées d'opération proposées, en mois. */
export const DUREES = [6, 12, 18, 24] as const;
export const DUREE_DEFAUT = 12;
