import { MARGES_SCENARIOS } from "./params";
import type { Inputs, Outputs, Scenario } from "./types";

export type ScenarioKey = "pessimiste" | "realiste" | "optimiste";

export const SCENARIOS: { key: ScenarioKey; label: string }[] = [
  { key: "pessimiste", label: "Worst Case" },
  { key: "realiste", label: "Middle Case" },
  { key: "optimiste", label: "Best Case" },
];

/** Synthèse d'un scénario de sortie à partir d'un prix de vente au m² (formules de l'Excel d'origine). */
export function computeScenario(outputs: Outputs, inputs: Pick<Inputs, "surface">, prixVenteM2: number): Scenario {
  const prixVenteTotal = prixVenteM2 * inputs.surface;
  const margeBruteM2 = prixVenteM2 - outputs.prixRevientM2;
  const margeBrute = prixVenteTotal - outputs.totalReelInclDetteObligataire;
  const rentabiliteSurCout = margeBrute / outputs.totalReelInclDetteObligataire;
  return { prixVenteM2, prixVenteTotal, margeBruteM2, margeBrute, rentabiliteSurCout };
}

/** Prix de vente au m² proposé par défaut : prix de revient au m² + marge du scénario, arrondi à l'euro. */
export function prixVenteAutoM2(outputs: Outputs, key: ScenarioKey, marges = MARGES_SCENARIOS): number {
  return Math.round(outputs.prixRevientM2 * (1 + marges[key]));
}
