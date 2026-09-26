import type { DUREES } from "./params";

export type Duree = (typeof DUREES)[number];
export type ModeAgence = "eur" | "pct";

export interface Inputs {
  /** Prix d'acquisition hors frais d'agence (€). */
  prixAcquisition: number;
  /** Surface habitable (m²), > 0. */
  surface: number;
  /** Travaux TTC (€), 0 autorisé. */
  travaux: number;
  /** Durée de l'opération (mois). */
  duree: number;
  /** Mode de saisie des frais d'agence. */
  modeAgence: ModeAgence;
  /** Frais d'agence : montant en € si mode "eur", décimal (0,05) si mode "pct". */
  valeurAgence: number;
}

export interface Outputs {
  fraisAgence: number;

  pretAcquisition: number;
  pretTravaux: number;
  /** Financement bancaire (« Sous-total Ressources foncier »). */
  R1: number;

  /** Acquisition + travaux. */
  E1_sousTotal: number;
  prixM2Acquisition: number;

  fraisGarantie: number;
  fraisNotaire: number;
  fraisCourtage: number;
  interetsBanque: number;
  fraisDossierBanque: number;
  commissionEngagement: number;
  /** Frais d'acquisition et de financement. */
  E2_sousTotal: number;
  /** Total Emplois. */
  E1_total: number;

  apportTotal: number;
  /** Total Ressources (= E1_total par construction). */
  R1_total: number;

  detteObligataire: number;
  fondsPropres: number;

  fraisDetteObligataire: number;
  fraisStructurationObligataire: number;
  /** Coût de la dette obligataire. */
  E3_sousTotal: number;
  totalReelInclDetteObligataire: number;

  /** Loan to Cost en %, entier. */
  loanToCost: number;
  /** Prix de revient au m² : seuil de rentabilité à la revente. */
  prixRevientM2: number;
}

export interface Scenario {
  prixVenteM2: number;
  prixVenteTotal: number;
  /** Marge brute avant impôts, au m². */
  margeBruteM2: number;
  /** Marge brute avant impôts, totale. */
  margeBrute: number;
  /** Rentabilité = marge brute / prix de revient total (décimal). Appelé « TRI » dans l'Excel, mais sans dimension temporelle. */
  rentabiliteSurCout: number;
}
