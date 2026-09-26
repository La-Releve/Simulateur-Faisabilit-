import { describe, expect, it } from "vitest";
import { computeFaisabilite } from "./engine";
import { computeScenario, prixVenteAutoM2 } from "./scenarios";
import { formatEur, formatEurSigned, formatInputDraft, parseInput } from "./format";
import type { Inputs } from "./types";

const casA: Inputs = {
  prixAcquisition: 300_000,
  surface: 100,
  travaux: 100_000,
  duree: 12,
  modeAgence: "pct",
  valeurAgence: 0.05,
};

const casB: Inputs = {
  prixAcquisition: 200_000,
  surface: 80,
  travaux: 50_000,
  duree: 18,
  modeAgence: "eur",
  valeurAgence: 12_000,
};

function expectValues(actual: object, expected: Record<string, number>) {
  for (const [key, value] of Object.entries(expected)) {
    expect((actual as Record<string, number>)[key], key).toBeCloseTo(value, 6);
  }
}

describe("computeFaisabilite — parité Notion", () => {
  it("cas A", () => {
    expectValues(computeFaisabilite(casA), {
      fraisAgence: 15_000,
      R1: 325_000,
      E1_sousTotal: 400_000,
      fraisGarantie: 4_875,
      fraisNotaire: 7_500,
      fraisCourtage: 4_875,
      interetsBanque: 17_875,
      fraisDossierBanque: 1_625,
      commissionEngagement: 1_625,
      E2_sousTotal: 53_375,
      E1_total: 453_375,
      apportTotal: 128_375,
      R1_total: 453_375,
      detteObligataire: 102_700,
      fondsPropres: 25_675,
      fraisDetteObligataire: 10_270,
      fraisStructurationObligataire: 5_135,
      E3_sousTotal: 15_405,
      totalReelInclDetteObligataire: 468_780,
      loanToCost: 72,
      prixM2Acquisition: 3_000,
      prixRevientM2: 4_687.8,
    });
  });

  it("cas B", () => {
    expectValues(computeFaisabilite(casB), {
      R1: 200_000,
      interetsBanque: 16_500,
      E2_sousTotal: 41_500,
      E1_total: 291_500,
      apportTotal: 91_500,
      detteObligataire: 73_200,
      fondsPropres: 18_300,
      fraisDetteObligataire: 10_980,
      fraisStructurationObligataire: 3_660,
      totalReelInclDetteObligataire: 306_140,
      loanToCost: 69,
      prixM2Acquisition: 2_500,
      prixRevientM2: 3_826.75,
    });
  });
});

describe("computeFaisabilite — cas C (Excel d'origine)", () => {
  const casC: Inputs = {
    prixAcquisition: 450_000,
    surface: 220,
    travaux: 1_300_000,
    duree: 12,
    modeAgence: "pct",
    valeurAgence: 0.05,
  };
  const o = computeFaisabilite(casC);

  it("plan de financement", () => {
    expectValues(o, {
      R1: 1_637_500,
      fraisAgence: 22_500,
      fraisGarantie: 24_562.5,
      fraisNotaire: 11_250,
      fraisCourtage: 24_562.5,
      interetsBanque: 90_062.5,
      fraisDossierBanque: 8_187.5,
      commissionEngagement: 8_187.5,
      E2_sousTotal: 189_312.5,
      E1_total: 1_939_312.5,
      apportTotal: 301_812.5,
      detteObligataire: 241_450,
      fondsPropres: 60_362.5,
      fraisDetteObligataire: 24_145,
      fraisStructurationObligataire: 12_072.5,
      E3_sousTotal: 36_217.5,
      totalReelInclDetteObligataire: 1_975_530,
      loanToCost: 84,
    });
    expect(o.prixM2Acquisition).toBeCloseTo(2_045.45, 2);
    expect(o.prixRevientM2).toBeCloseTo(8_979.68, 2);
    expect((o.R1 / o.E1_total) * 100).toBeCloseTo(84.44, 2);
  });

  it.each([
    ["optimiste", 12_000, 2_640_000, 3_020.32, 664_470, 33.64],
    ["réaliste", 11_000, 2_420_000, 2_020.32, 444_470, 22.5],
    ["pessimiste", 10_000, 2_200_000, 1_020.32, 224_470, 11.36],
  ])("scénario %s", (_, prixM2, total, margeM2, marge, rentaPct) => {
    const s = computeScenario(o, casC, prixM2);
    expect(s.prixVenteTotal).toBeCloseTo(total, 6);
    expect(s.margeBruteM2).toBeCloseTo(margeM2, 2);
    expect(s.margeBrute).toBeCloseTo(marge, 6);
    expect(s.rentabiliteSurCout * 100).toBeCloseTo(rentaPct, 2);
  });
});

describe("fichier Excel d'origine (Simiulateur_de_faisabilite (1).xlsx, valeurs calculées par Excel)", () => {
  // Feuil1 : D7 = 1 000 000, D2 = 100 m², D8 = 2 000 €/m² × 100, frais d'agence 5 %, 12 mois
  const excel: Inputs = {
    prixAcquisition: 1_000_000,
    surface: 100,
    travaux: 200_000,
    duree: 12,
    modeAgence: "pct",
    valeurAgence: 0.05,
  };
  const o = computeFaisabilite(excel);

  it("emplois, ressources, bonds (cellules D3 à F20)", () => {
    expectValues(o, {
      prixM2Acquisition: 10_000, // D3
      pretAcquisition: 750_000, // F7
      pretTravaux: 200_000, // F8
      R1: 950_000, // F9
      E1_sousTotal: 1_200_000, // D9
      fraisAgence: 50_000, // D10
      fraisGarantie: 14_250, // D11
      fraisNotaire: 25_000, // D12
      fraisCourtage: 14_250, // D13
      interetsBanque: 52_250, // D14
      fraisDossierBanque: 4_750, // D15
      commissionEngagement: 4_750, // D16
      E2_sousTotal: 165_250, // D17
      E1_total: 1_365_250, // D18
      apportTotal: 415_250, // F10
      R1_total: 1_365_250, // F18
      fondsPropres: 83_050, // F19
      detteObligataire: 332_200, // F20
      fraisDetteObligataire: 33_220, // D19
      fraisStructurationObligataire: 16_610, // D20
      E3_sousTotal: 49_830, // D21
      totalReelInclDetteObligataire: 1_415_080, // D22
      prixRevientM2: 14_150.8, // D27
    });
    expect((o.R1 / o.E1_total) * 100).toBeCloseTo(69.58432521516206, 9); // D24
  });

  it.each([
    ["Best case", 20_000, 5_849.2, 2_000_000, 584_920, 0.41334765525623995], // D28:D34
    ["Middle case", 17_500, 3_349.2, 1_750_000, 334_920, 0.23667919834920995], // D38:D44
    ["Worst case", 16_000, 1_849.2, 1_600_000, 184_920, 0.13067812420499195], // D48:D54
  ])("%s", (_, prixM2, margeM2, total, marge, tri) => {
    const s = computeScenario(o, excel, prixM2);
    expect(s.margeBruteM2).toBeCloseTo(margeM2, 6);
    expect(s.prixVenteTotal).toBeCloseTo(total, 6);
    expect(s.margeBrute).toBeCloseTo(marge, 6);
    expect(s.rentabiliteSurCout).toBeCloseTo(tri, 12);
  });
});

describe("invariants", () => {
  it.each([casA, casB, { ...casA, duree: 6 }, { ...casB, travaux: 0, valeurAgence: 0 }])(
    "R1_total === E1_total",
    (inputs) => {
      const o = computeFaisabilite(inputs);
      expect(o.R1_total).toBeCloseTo(o.E1_total, 9);
      expect(o.detteObligataire + o.fondsPropres).toBeCloseTo(o.apportTotal, 9);
    },
  );

  it("durée 6 mois : intérêts divisés par 2 par rapport à 12 mois", () => {
    const o = computeFaisabilite({ ...casA, duree: 6 });
    expect(o.interetsBanque).toBeCloseTo(17_875 / 2, 6);
    expect(o.fraisDetteObligataire).toBeCloseTo(0.1 * o.detteObligataire * 0.5, 6);
  });

  it("durée 24 mois : intérêts doublés par rapport à 12 mois", () => {
    const o = computeFaisabilite({ ...casA, duree: 24 });
    expect(o.interetsBanque).toBeCloseTo(17_875 * 2, 6);
    expect(o.fraisDetteObligataire).toBeCloseTo(0.1 * o.detteObligataire * 2, 6);
  });

  it("agence = 0 (€ et %)", () => {
    const eur = computeFaisabilite({ ...casA, modeAgence: "eur", valeurAgence: 0 });
    const pct = computeFaisabilite({ ...casA, modeAgence: "pct", valeurAgence: 0 });
    expect(eur.fraisAgence).toBe(0);
    expect(eur.E2_sousTotal).toBeCloseTo(53_375 - 15_000, 6);
    expect(pct).toEqual(eur);
  });

  it("travaux = 0 est valide", () => {
    const o = computeFaisabilite({ ...casA, travaux: 0 });
    expect(o.pretTravaux).toBe(0);
    expect(o.R1).toBe(225_000);
    expect(Number.isFinite(o.totalReelInclDetteObligataire)).toBe(true);
  });
});

describe("computeScenario", () => {
  it("cas A, vente à 5 500 €/m²", () => {
    const o = computeFaisabilite(casA);
    const s = computeScenario(o, casA, 5_500);
    expect(s.prixVenteTotal).toBe(550_000);
    expect(s.margeBrute).toBeCloseTo(81_220, 6);
    expect(s.margeBruteM2).toBeCloseTo(812.2, 6);
    expect(s.rentabiliteSurCout).toBeCloseTo(81_220 / 468_780, 9);
  });

  it("vente au prix de revient → marge nulle", () => {
    const o = computeFaisabilite(casA);
    expect(computeScenario(o, casA, o.prixRevientM2).margeBrute).toBeCloseTo(0, 6);
  });
});

describe("prix de vente proposés", () => {
  it("prix de revient +10 / +20 / +30 % (cas A : 4 687,80 €/m²)", () => {
    const o = computeFaisabilite(casA);
    expect(prixVenteAutoM2(o, "pessimiste")).toBe(5_157); // 5 156,58
    expect(prixVenteAutoM2(o, "realiste")).toBe(5_625); // 5 625,36
    expect(prixVenteAutoM2(o, "optimiste")).toBe(6_094); // 6 094,14
  });

  it("la rentabilité obtenue correspond à la marge visée, à l'arrondi près", () => {
    const o = computeFaisabilite(casA);
    for (const [key, marge] of [["pessimiste", 0.1], ["realiste", 0.2], ["optimiste", 0.3]] as const) {
      const s = computeScenario(o, casA, prixVenteAutoM2(o, key));
      expect(s.rentabiliteSurCout).toBeCloseTo(marge, 3);
    }
  });
});

describe("format", () => {
  it("arrondit à l'euro inférieur et sépare les milliers", () => {
    expect(formatEur(468_780.99)).toBe("468 780 €");
    expect(formatEurSigned(-3_200.7)).toBe("−3 200 €");
    expect(formatEurSigned(12_000.4)).toBe("+12 000 €");
  });

  it("parse les saisies", () => {
    expect(parseInput("300 000")).toBe(300_000);
    expect(parseInput("5,5")).toBe(5.5);
    expect(parseInput("")).toBeNull();
    expect(formatInputDraft("300000")).toBe("300 000");
    expect(formatInputDraft("1234,5")).toBe("1 234,5");
  });
});
