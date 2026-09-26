const nf0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Arrondi d'affichage : euro inférieur pour les positifs (parité Notion), vers zéro pour les négatifs. */
function roundEur(n: number): number {
  return n < 0 ? Math.trunc(n) : Math.floor(n);
}

/** Espace fine insécable → espace insécable classique, plus lisible avec Open Sans. */
function clean(s: string): string {
  return s.replace(/ /g, " ");
}

/** Nombre entier formaté (séparateur de milliers). */
export function formatNumber(n: number): string {
  return clean(nf0.format(roundEur(n)));
}

/** Montant en euros, ex. « 468 780 € ». */
export function formatEur(n: number): string {
  const r = roundEur(n);
  return `${clean(nf0.format(r === 0 ? 0 : r))} €`;
}

/** Montant signé, ex. « +12 000 € » / « −3 200 € ». */
export function formatEurSigned(n: number): string {
  const r = roundEur(n);
  if (r === 0) return "0 €";
  return `${r > 0 ? "+" : "−"}${clean(nf0.format(Math.abs(r)))} €`;
}

export function formatEurM2(n: number): string {
  return `${clean(nf0.format(roundEur(n)))} €/m²`;
}

/** Pourcentage entier à partir d'une valeur déjà en % (ex. LTC 72 → « 72 % »). */
export function formatPctInt(n: number): string {
  return `${clean(nf0.format(Math.round(n)))} %`;
}

/** Pourcentage à une décimale à partir d'un décimal (0,125 → « 12,5 % »). */
export function formatPct1(ratio: number): string {
  return `${clean(nf1.format(ratio * 100))} %`;
}

/** Taux de paramètre (0,015 → « 1,5 % »), sans décimale inutile. */
export function formatRate(ratio: number): string {
  const v = Math.round(ratio * 10000) / 100;
  return `${clean(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(v))} %`;
}

/**
 * Parse une saisie utilisateur en nombre (accepte espaces, virgule décimale).
 * Retourne null si vide ou invalide.
 */
export function parseInput(raw: string): number | null {
  const s = raw.replace(/[\s  ]/g, "").replace(",", ".");
  if (s === "" || s === ".") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Formate la saisie en cours avec séparateur de milliers, en conservant
 * la partie décimale telle que tapée (virgule).
 */
export function formatInputDraft(raw: string): string {
  let s = raw.replace(/[^\d.,]/g, "").replace(".", ",");
  const firstComma = s.indexOf(",");
  if (firstComma !== -1) {
    s = s.slice(0, firstComma + 1) + s.slice(firstComma + 1).replace(/,/g, "");
  }
  const [intPart, decPart] = s.split(",");
  const intClean = intPart.replace(/^0+(?=\d)/, "");
  const grouped = intClean.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return decPart !== undefined ? `${grouped},${decPart}` : grouped;
}

/** Montant au m² signé, ex. « +3 020 €/m² ». */
export function formatEurM2Signed(n: number): string {
  return formatEurSigned(n).replace(/ €$/, " €/m²");
}
