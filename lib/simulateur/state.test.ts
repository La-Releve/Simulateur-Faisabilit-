import { describe, expect, it } from "vitest";
import { DEFAULT_STATE, encodeShareCode, readShareHash, sanitizeState, shareUrl, toInputs } from "./state";

describe("state", () => {
  it("défaut : agence 5 % et 12 mois", () => {
    expect(DEFAULT_STATE.modeAgence).toBe("pct");
    expect(DEFAULT_STATE.agence).toBe("5");
    expect(DEFAULT_STATE.duree).toBe(12);
  });

  it("toInputs convertit le % en décimal", () => {
    const r = toInputs({ ...DEFAULT_STATE, prixAcquisition: "300 000", surface: "100", travaux: "0" });
    expect(r.ok && r.inputs).toMatchObject({ prixAcquisition: 300_000, travaux: 0, valeurAgence: 0.05 });
  });

  it("toInputs bloque surface = 0 et champs vides", () => {
    const r = toInputs({ ...DEFAULT_STATE, prixAcquisition: "1", surface: "0", travaux: "" });
    expect(r).toEqual({ ok: false, missing: ["travaux"], surfaceZero: true });
  });

  it("sanitizeState rejette les objets invalides", () => {
    expect(sanitizeState(null)).toBeNull();
    expect(sanitizeState({ v: 2 })).toBeNull();
    expect(sanitizeState({ v: 1, duree: 7 })?.duree).toBe(12);
  });

  describe("lien de partage", () => {
    const casC = {
      ...DEFAULT_STATE,
      prixAcquisition: "450\u00a0000",
      surface: "220",
      travaux: "1\u00a0300\u00a0000",
    };

    it("code court (cas C)", () => {
      expect(encodeShareCode(casC)).toBe("1.qsi80.gz4.25ecn4.c.pdw");
      expect(shareUrl(casC, "https://simulateur.lareleve.io")).toBe("https://simulateur.lareleve.io/#s=1.qsi80.gz4.25ecn4.c.pdw");
    });

    it("aller-retour avec décimales, frais en €, durée et prix de vente saisis", () => {
      const s = {
        ...casC,
        surface: "85,5",
        duree: 18,
        modeAgence: "eur" as const,
        agence: "12\u00a0000",
        ventes: { pessimiste: "", realiste: "11\u00a0000", optimiste: "" },
      };
      expect(readShareHash("#s=" + encodeShareCode(s))).toEqual(s);
    });

    it("rejette les liens invalides", () => {
      expect(readShareHash("#s=2.abc")).toBeNull();
      expect(readShareHash("#s=1.<script>")).toBeNull();
      expect(readShareHash("#autre")).toBeNull();
    });
  });
});