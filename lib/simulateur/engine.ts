import { PARAMS, type Params } from "./params";
import type { Inputs, Outputs } from "./types";

/** Calcule le plan de financement d'une opération. Fonction pure. */
export function computeFaisabilite(inputs: Inputs, params: Params = PARAMS): Outputs {
  const { prixAcquisition: P, surface: S, travaux: T, duree: d } = inputs;

  const fraisAgence = inputs.modeAgence === "eur" ? inputs.valeurAgence : inputs.valeurAgence * P;

  // Ressources bancaires (R1)
  const pretAcquisition = params.quotiteAcquisition * P;
  const pretTravaux = params.quotiteTravaux * T;
  const R1 = pretAcquisition + pretTravaux;

  // Emplois — foncier (E1)
  const E1_sousTotal = P + T;
  const prixM2Acquisition = P / S;

  // Emplois — frais financiers (E2)
  const fraisGarantie = params.tauxGarantie * R1;
  const fraisNotaire = params.tauxNotaire * P;
  const fraisCourtage = params.tauxCourtage * R1;
  const interetsBanque = (params.tauxInteretsBanqueAnnuel * R1 * d) / 12;
  const fraisDossierBanque = params.tauxFraisDossier * R1;
  const commissionEngagement = params.tauxCommissionEngagement * R1;

  const E2_sousTotal =
    fraisAgence +
    fraisGarantie +
    fraisNotaire +
    fraisCourtage +
    interetsBanque +
    fraisDossierBanque +
    commissionEngagement;

  const E1_total = E1_sousTotal + E2_sousTotal;

  // Apport et équilibre
  const apportTotal = E1_total - R1;
  const R1_total = apportTotal + R1;

  // Structure de l'apport
  const detteObligataire = params.partDetteObligataire * apportTotal;
  const fondsPropres = apportTotal - detteObligataire;

  // Coût de la dette obligataire (E3) — hors équilibre Emplois/Ressources, comme dans Notion
  const fraisDetteObligataire = (params.tauxObligataireAnnuel * detteObligataire * d) / 12;
  const fraisStructurationObligataire = params.tauxStructurationObligataire * detteObligataire;
  const E3_sousTotal = fraisDetteObligataire + fraisStructurationObligataire;

  const totalReelInclDetteObligataire = E1_total + E3_sousTotal;

  const loanToCost = Math.round((R1 / E1_total) * 100);
  const prixRevientM2 = totalReelInclDetteObligataire / S;

  return {
    fraisAgence,
    pretAcquisition,
    pretTravaux,
    R1,
    E1_sousTotal,
    prixM2Acquisition,
    fraisGarantie,
    fraisNotaire,
    fraisCourtage,
    interetsBanque,
    fraisDossierBanque,
    commissionEngagement,
    E2_sousTotal,
    E1_total,
    apportTotal,
    R1_total,
    detteObligataire,
    fondsPropres,
    fraisDetteObligataire,
    fraisStructurationObligataire,
    E3_sousTotal,
    totalReelInclDetteObligataire,
    loanToCost,
    prixRevientM2,
  };
}
