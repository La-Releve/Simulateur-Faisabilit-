import type { Inputs, Outputs, Scenario } from "./types";

export type ScenarioKey = "pessimiste" | "realiste" | "optimiste";

export const SCENARIOS: { key: ScenarioKey; label: string }[] = [
  { key: "pessimiste", label: "Pessimiste" },
  { key: "realiste", label: "Réaliste" },
  { key: "optimiste", label: "Optimiste" },
];

/** Synthèse d'un scénario de sortie à partir d'un prix de vente au m² (formules de l'Excel d'origine). */
export function computeScenario(outputs: Outputs, inputs: Pick<Inputs, "surface">, prixVenteM2: number): Scenario {
  const prixVenteTotal = prixVenteM2 * inputs.surface;
  const margeBruteM2 = prixVenteM2 - outputs.prixRevientM2;
  const margeBrute = prixVenteTotal - outputs.totalReelInclDetteObligataire;
  const rentabiliteSurCout = margeBrute / outputs.totalReelInclDetteObligataire;
  return { prixVenteM2, prixVenteTotal, margeBruteM2, margeBrute, rentabiliteSurCout };
}
