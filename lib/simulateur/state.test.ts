import { describe, expect, it } from "vitest";
import { DEFAULT_STATE, sanitizeState, toInputs } from "./state";

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
});
