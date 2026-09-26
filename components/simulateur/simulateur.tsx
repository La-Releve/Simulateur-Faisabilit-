"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowUp, Download, Moon, RotateCcw, Share, Sun } from "lucide-react";
import { computeFaisabilite } from "@/lib/simulateur/engine";
import {
  formatEur,
  formatEurM2,
  formatInputDraft,
  formatPctInt,
  formatRate,
  parseInput,
} from "@/lib/simulateur/format";
import { DUREES, MARGES_SCENARIOS, PARAMS } from "@/lib/simulateur/params";
import { computeScenario, prixVenteAutoM2, SCENARIOS, type ScenarioKey } from "@/lib/simulateur/scenarios";
import { DEFAULT_STATE, shareUrl, toInputs, type SimState } from "@/lib/simulateur/state";
import type { Inputs, Outputs, Scenario } from "@/lib/simulateur/types";
import { cn } from "@/lib/utils";
import { Accordion } from "./accordion";
import { AnimatedNumber } from "./animated-number";
import { FinancementSankey, LtcGauge } from "./charts";
import { InstallGuide } from "./install-guide";
import { NumberField } from "./number-field";
import { Segmented } from "./segmented";
import { Toast, useToast } from "./toast";
import { Row, SectionTitle } from "./ui";
import { useInstall } from "./use-install";
import { useSimulation } from "./use-simulation";
import { useTheme } from "./use-theme";

const P = PARAMS;

const SHARE_MESSAGE =
  "Hello,\nJe viens de faire cette simulation pour un bien, je te laisse regarder pour qu'on en discute";

// Simulation d'exemple affichée floutée tant que le formulaire n'est pas complet.
const DEMO_STATE: SimState = {
  ...DEFAULT_STATE,
  prixAcquisition: "300 000",
  surface: "100",
  travaux: "100 000",
};
const DEMO_VALIDATION = toInputs(DEMO_STATE);
const DEMO_RESULT = DEMO_VALIDATION.ok
  ? { inputs: DEMO_VALIDATION.inputs, outputs: computeFaisabilite(DEMO_VALIDATION.inputs) }
  : null;
const noop = () => {};

// Champs obligatoires dans l'ordre du formulaire
const REQUIRED_FIELDS = [
  ["prixAcquisition", "prix"],
  ["surface", "surface"],
  ["travaux", "travaux"],
] as const;

export function Simulateur() {
  const { state, update, reset, fromLink } = useSimulation();
  const install = useInstall();
  const toast = useToast();
  const { show: showToast } = toast;

  useEffect(() => {
    if (fromLink) showToast("Simulation partagée chargée");
  }, [fromLink, showToast]);

  const validation = useMemo(() => toInputs(state), [state]);
  const result = useMemo(
    () => (validation.ok ? { inputs: validation.inputs, outputs: computeFaisabilite(validation.inputs) } : null),
    [validation],
  );
  const preview = result === null;
  const shown = result ?? DEMO_RESULT!;
  const [highlight, setHighlight] = useState(false);

  // Aperçu flouté → ramène au formulaire et place le curseur dans le premier champ manquant.
  // Le focus est synchrone (geste utilisateur) pour que le clavier s'ouvre sur iOS.
  function goToForm() {
    const missing = validation.ok ? [] : validation.missing;
    const target = REQUIRED_FIELDS.find(([key]) => missing.includes(key))?.[1] ?? "prix";
    document.getElementById(target)?.focus({ preventScroll: true });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("formulaire")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    setHighlight(true);
  }

  return (
    <div className="min-h-dvh pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Header
        onReset={() => {
          reset();
          toast.show("Nouvelle simulation");
        }}
        showInstall={install.ready && !install.standalone && install.platform !== "desktop"}
        state={state}
        onCopied={() => toast.show("Lien copié")}
        onInstall={() => (install.canPromptInstall && install.platform === "android" ? install.promptInstall() : install.openGuide())}
      />

      <main className="mx-auto w-full max-w-[1200px] px-4 pb-16 sm:px-6">
        <div className="pt-6 pb-8 md:pt-10 md:pb-12">
          <h1 className="t-stagger-line text-[32px] leading-none font-extrabold tracking-[-0.025em] text-fg md:text-5xl">
            Simulateur de <span className="text-orange">faisabilité</span>
          </h1>
          <p className="t-stagger-line t-stagger-line--2 mt-4 max-w-2xl text-sm font-light text-text-secondary md:text-base">
            Combien coûte l&apos;opération, combien apporter, à quel prix revendre.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start">
          <aside className="lg:sticky lg:top-6">
            <InputsSection state={state} update={update} validation={validation} highlight={highlight} />
          </aside>

          <div className="flex min-w-0 flex-col gap-12">
            <div className="relative">
              <div
                className={cn("preview-blur flex flex-col gap-12", preview && "is-preview")}
                aria-hidden={preview || undefined}
                inert={preview}
              >
                <KpiSection outputs={shown.outputs} />
                <ScenariosSection
                  state={preview ? DEMO_STATE : state}
                  update={preview ? noop : update}
                  result={shown}
                />
              </div>
              {preview ? (
                <button
                  type="button"
                  onClick={goToForm}
                  className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center rounded-2xl"
                >
                  <span className="sticky top-[40dvh] mt-24 flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-2xl border border-line-strong bg-elevated py-3 pr-5 pl-3 text-left text-sm font-semibold text-fg shadow-lg">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange text-white">
                      <ArrowUp className="size-4 lg:-rotate-90" />
                    </span>
                    <span className="text-balance">Complète les valeurs pour obtenir la simulation</span>
                  </span>
                </button>
              ) : null}
            </div>
            {result ? <DetailSection inputs={result.inputs} outputs={result.outputs} /> : null}
            {result ? <FinancementSection inputs={result.inputs} outputs={result.outputs} /> : null}
          </div>
        </div>
      </main>

      <Toast message={toast.message} open={toast.open} />
      {install.ready && install.platform !== "desktop" ? (
        <InstallGuide
          open={install.open}
          platform={install.platform}
          canPromptInstall={install.canPromptInstall}
          onInstall={install.promptInstall}
          onClose={install.dismiss}
        />
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- Header */

function Header({
  onReset,
  showInstall,
  onInstall,
  state,
  onCopied,
}: {
  onReset: () => void;
  showInstall: boolean;
  onInstall: () => void;
  state: SimState;
  onCopied: () => void;
}) {
  const { theme, toggle } = useTheme();

  // Feuille de partage native (iOS / Android / navigateurs compatibles) avec un message
  // pré-rédigé ; sinon copie du message et du lien.
  async function share() {
    const url = shareUrl(state, window.location.origin, window.location.pathname);
    // Le lien est intégré au texte (plutôt que passé en `url`) : certaines apps le colleraient
    // sur la même ligne ; les messageries le détectent et affichent quand même l'aperçu.
    const text = `${SHARE_MESSAGE}\n\n${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Simulation de faisabilité — La Relève", text });
      } catch {
        // partage annulé
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      onCopied();
    } catch {
      window.prompt("Copie ce lien :", url);
    }
  }

  function confirmReset() {
    if (window.confirm("Effacer la simulation en cours ?")) onReset();
  }

  return (
    <header className="mx-auto flex w-full max-w-[1200px] items-center gap-3 px-4 pt-4 sm:px-6">
      <Image
        src="/logo-la-releve.png"
        alt="La Relève"
        width={915}
        height={280}
        priority
        unoptimized
        className="logo-adaptive h-7 w-auto md:h-8"
      />
      <div className="flex-1" />
      {showInstall ? (
        <button
          type="button"
          onClick={onInstall}
          className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-semibold text-text-secondary hover:text-fg"
        >
          <Download className="size-3.5" />
          Installer l&apos;app
        </button>
      ) : null}
      <IconButton label="Partager cette simulation" onClick={share}>
        <Share className="size-4" />
      </IconButton>
      <IconButton label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"} onClick={toggle}>
        <span className="t-icon-swap" data-state={theme === "dark" ? "b" : "a"}>
          <Moon className="t-icon size-4" data-icon="a" />
          <Sun className="t-icon size-4" data-icon="b" />
        </span>
      </IconButton>
      <IconButton label="Nouvelle simulation" onClick={confirmReset}>
        <RotateCcw className="size-4" />
      </IconButton>
    </header>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-full border border-line-strong bg-surface text-fg/80 transition-colors hover:bg-surface-hover hover:text-fg"
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------- 01 — Le bien */

type Update = <K extends keyof SimState>(key: K, value: SimState[K]) => void;
type Validation = ReturnType<typeof toInputs>;

function InputsSection({
  state,
  update,
  validation,
  highlight,
}: {
  state: SimState;
  update: Update;
  validation: Validation;
  /** Met en évidence les champs obligatoires manquants (après clic sur l'aperçu flouté). */
  highlight: boolean;
}) {
  const missing = validation.ok ? [] : validation.missing;
  const prix = parseInput(state.prixAcquisition);
  const surface = parseInput(state.surface);
  const prixM2 = prix !== null && surface ? prix / surface : null;
  const surfaceZero = !validation.ok && validation.surfaceZero;

  return (
    <section id="formulaire" className="card scroll-mt-4" aria-labelledby="s01">
      <div className="mb-6 flex flex-col gap-2">
        <span className="eyebrow">01 — Le bien</span>
        <h2 id="s01" className="text-2xl font-extrabold text-fg">
          L&apos;opération
        </h2>
      </div>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 items-start gap-3 min-[360px]:grid-cols-2">
          <NumberField
            id="prix"
            label="Prix hors FAI"
            value={state.prixAcquisition}
            onChange={(v) => update("prixAcquisition", v)}
            suffix="€"
            placeholder="300 000"
            attention={missing.includes("prixAcquisition") && highlight}
            help={prixM2 !== null ? `Soit ${formatEurM2(prixM2)}` : undefined}
          />
          <NumberField
            id="surface"
            label="Surface"
            value={state.surface}
            onChange={(v) => update("surface", v)}
            suffix="m²"
            placeholder="100"
            invalid={surfaceZero}
            attention={missing.includes("surface") && highlight}
            help={surfaceZero ? <span className="text-negative">Doit être supérieure à 0</span> : undefined}
          />
        </div>
        {/* Frais d'agence un peu plus larges : la case contient aussi la bascule % / € */}
        <div className="grid grid-cols-1 items-start gap-3 min-[360px]:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <NumberField
            id="travaux"
            label="Travaux TTC"
            value={state.travaux}
            onChange={(v) => update("travaux", v)}
            suffix="€"
            placeholder="100 000"
            attention={missing.includes("travaux") && highlight}
          />
          <NumberField
            id="agence"
            label="Frais d'agence"
            value={state.agence}
            onChange={(v) => update("agence", v)}
            placeholder="0"
            adornment={
              <Segmented
                ariaLabel="Unité des frais d'agence"
                size="xs"
                options={[
                  { value: "pct" as const, label: "%" },
                  { value: "eur" as const, label: "€" },
                ]}
                value={state.modeAgence}
                onChange={(v) => {
                  if (v === state.modeAgence) return;
                  // Conversion de la valeur saisie pour garder le même montant
                  const val = parseInput(state.agence);
                  if (val !== null && prix) {
                    const converted = v === "eur" ? (val / 100) * prix : (val / prix) * 100;
                    const rounded = v === "eur" ? Math.round(converted) : Math.round(converted * 100) / 100;
                    update("agence", formatInputDraft(String(rounded).replace(".", ",")));
                  }
                  update("modeAgence", v);
                }}
              />
            }
            help={
              state.modeAgence === "pct" && prix
                ? `Soit ${formatEur(((parseInput(state.agence) ?? 0) / 100) * prix)}`
                : undefined
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-text-secondary" id="duree-label">
            Durée de l&apos;opération
          </span>
          <Segmented
            ariaLabel="Durée de l'opération"
            options={DUREES.map((d) => ({ value: d, label: `${d} mois` }))}
            value={state.duree}
            onChange={(v) => update("duree", v)}
            className="w-full border border-line-strong"
          />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- 02 — L'essentiel */

type Result = { inputs: Inputs; outputs: Outputs } | null;


function KpiSection({ outputs: o }: { outputs: Outputs }) {
  return (
    <section aria-labelledby="s02">
      <SectionTitle index="02" eyebrow="L'essentiel" title="Ce que coûte l'opération" />
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Kpi
          label="Coût total de l'opération"
          value={<AnimatedNumber kind="eur" value={o.totalReelInclDetteObligataire} />}
          sub={`dont ${formatEur(o.E2_sousTotal + o.E3_sousTotal)} de frais`}
        />
        <Kpi
          label="Apport nécessaire"
          value={<AnimatedNumber kind="eur" value={o.apportTotal} />}
          sub={`Fonds propres ${formatEur(o.fondsPropres)} · Dette obligataire ${formatEur(o.detteObligataire)}`}
        />
        <Kpi
          label="Prix de revient au m²"
          value={<AnimatedNumber kind="eurM2" value={o.prixRevientM2} />}
          sub="Seuil de rentabilité à la revente"
        />
        <Kpi
          label="Loan to Cost"
          value={<AnimatedNumber kind="pctInt" value={o.loanToCost} />}
          sub={<LtcGauge value={o.loanToCost} />}
        />
      </div>
    </section>
  );
}

function Kpi({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-2xl border border-line bg-surface p-4 md:p-5">
      <div className="tabular text-[22px] leading-tight font-extrabold text-orange sm:text-[28px] md:text-[30px]">{value}</div>
      <div className="label-key">{label}</div>
      {sub ? <div className="mt-1 text-xs font-light text-text-muted">{sub}</div> : null}
    </div>
  );
}

/* ---------------------------------------------------------------- 03 — La revente */

function ScenariosSection({ state, update, result }: { state: SimState; update: Update; result: NonNullable<Result> }) {
  // Champ en cours d'édition : s'il est vidé, on le laisse vide tant qu'il a le focus
  // (au lieu de réafficher aussitôt la valeur proposée), puis il revient à la proposition.
  const [editing, setEditing] = useState<{ key: ScenarioKey; cleared: boolean } | null>(null);

  const scenarios = useMemo(() => {
    return SCENARIOS.map(({ key, label }) => {
      const manual = state.ventes[key];
      const auto = prixVenteAutoM2(result.outputs, key);
      const isAuto = manual === "";
      const cleared = editing?.key === key && editing.cleared;
      const prixM2 = isAuto ? (cleared ? null : auto) : parseInput(manual);
      const display = isAuto ? (cleared ? "" : formatInputDraft(String(auto))) : manual;
      const scenario = prixM2 !== null && prixM2 > 0 ? computeScenario(result.outputs, result.inputs, prixM2) : null;
      return { key, label, scenario, isAuto, display };
    });
  }, [state.ventes, result, editing]);

  return (
    <section aria-labelledby="s03">
      <SectionTitle
        index="03"
        eyebrow="La revente"
        title="À quel prix revendre ?"
        subtitle={
          <>
            Seuil de rentabilité :{" "}
            <AnimatedNumber kind="eurM2" value={result.outputs.prixRevientM2} className="font-semibold text-orange" />
          </>
        }
      />
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {scenarios.map(({ key, label, isAuto, display }) => {
          const marge = formatRate(MARGES_SCENARIOS[key]);
          return (
            <NumberField
              key={key}
              id={`vente-${key}`}
              label={
                <span className="inline-flex items-center gap-1.5" data-case={key}>
                  <span className="case-dot" aria-hidden="true" />
                  {label}
                </span>
              }
              value={display}
              onChange={(v) => {
                setEditing({ key, cleared: v === "" });
                update("ventes", { ...state.ventes, [key]: v });
              }}
              onFocus={() => setEditing({ key, cleared: false })}
              onBlur={() => setEditing(null)}
              suffix="€/m²"
              placeholder="—"
              compact
              trailing={
                isAuto ? null : (
                  <button
                    type="button"
                    onClick={() => update("ventes", { ...state.ventes, [key]: "" })}
                    aria-label={`Revenir au prix proposé (+${marge} du prix de revient)`}
                    title={`Revenir au prix proposé (+${marge})`}
                    className="flex size-5 shrink-0 items-center justify-center rounded-full text-orange hover:bg-accent-soft"
                  >
                    <RotateCcw className="size-3" />
                  </button>
                )
              }
            />
          );
        })}
      </div>


      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {scenarios.map(({ key, label, scenario }) => (
          <ScenarioCard key={key} caseKey={key} label={label} scenario={scenario} />
        ))}
      </div>
    </section>
  );
}

function ScenarioCard({ caseKey, label, scenario }: { caseKey: ScenarioKey; label: string; scenario: Scenario | null }) {
  const negative = scenario !== null && scenario.margeBrute < 0;
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="pill" data-case={caseKey}>
          {label}
        </span>
        {scenario ? <span className="tabular text-xs text-text-muted">{formatEurM2(scenario.prixVenteM2)}</span> : null}
      </div>
      {scenario ? (
        <>
          <div className={cn("tabular text-[28px] leading-tight font-extrabold", negative ? "text-negative" : "text-orange")}>
            <AnimatedNumber kind="eurSigned" value={scenario.margeBrute} />
          </div>
          <div className="label-key mt-1">Marge brute avant impôts</div>
          <div className="mt-4">
            <Row label="Prix de vente total" value={<AnimatedNumber kind="eur" value={scenario.prixVenteTotal} />} />
            <Row
              label="Marge brute au m²"
              value={<AnimatedNumber kind="eurM2Signed" value={scenario.margeBruteM2} />}
              negative={negative}
            />
            <Row
              label="Rentabilité (marge / prix de revient)"
              value={<AnimatedNumber kind="pct1" value={scenario.rentabiliteSurCout} />}
              negative={negative}
            />
          </div>
        </>
      ) : (
        <p className="py-4 text-sm font-light text-text-muted">
          Saisis un prix de vente au m² pour voir ce scénario.
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- 05 — Le plan de financement */

function FinancementSection({ inputs, outputs: o }: { inputs: Inputs; outputs: Outputs }) {
  return (
    <section aria-labelledby="s05">
      <SectionTitle
        index="05"
        eyebrow="Le plan de financement"
        title="D'où vient l'argent, où il va"
        subtitle="Les deux côtés s'équilibrent : c'est le tableau Ressources / Emplois que demandent les banques."
      />
      <div className="card !p-3 md:!p-6">
        <FinancementSankey outputs={o} prixAcquisition={inputs.prixAcquisition} travaux={inputs.travaux} />
      </div>
      {/* Deux colonnes dès 360 px : sur mobile, libellé au-dessus de la valeur pour tenir en largeur */}
      <div className="mt-4 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:gap-4">
        <div className="card max-md:!p-4">
          <h3 className="text-lg leading-tight font-extrabold text-fg md:text-2xl">D&apos;où vient l&apos;argent</h3>
          <p className="label-key mt-1 mb-3 md:mb-4">Ressources</p>
          <div>
            <Row stackOnMobile label="Prêt bancaire acquisition" value={formatEur(o.pretAcquisition)} />
            <Row stackOnMobile label="Prêt bancaire travaux" value={formatEur(o.pretTravaux)} />
            <Row stackOnMobile label="Dette obligataire" value={formatEur(o.detteObligataire)} />
            <Row stackOnMobile label="Fonds propres" value={formatEur(o.fondsPropres)} />
            <Row
              stackOnMobile
              kind="total"
              label="Total ressources"
              value={<AnimatedNumber kind="eur" value={o.R1_total} />}
            />
          </div>
        </div>
        <div className="card max-md:!p-4">
          <h3 className="text-lg leading-tight font-extrabold text-fg md:text-2xl">Où va l&apos;argent</h3>
          <p className="label-key mt-1 mb-3 md:mb-4">Emplois</p>
          <div>
            <Row stackOnMobile label="Acquisition" value={formatEur(inputs.prixAcquisition)} />
            <Row stackOnMobile label="Travaux" value={formatEur(inputs.travaux)} />
            <Row stackOnMobile label="Frais d'acquisition et de financement" value={formatEur(o.E2_sousTotal)} />
            <Row
              stackOnMobile
              kind="total"
              label="Total emplois"
              value={<AnimatedNumber kind="eur" value={o.E1_total} />}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- 04 — Détail du chiffrage */

function DetailSection({ inputs, outputs: o }: { inputs: Inputs; outputs: Outputs }) {
  const d = inputs.duree;
  const agenceHelp =
    inputs.modeAgence === "pct" ? `${formatRate(inputs.valeurAgence)} du prix d'acquisition` : "Montant saisi";
  return (
    <section aria-labelledby="s04">
      <SectionTitle index="04" eyebrow="Détail du chiffrage" title="Ligne par ligne" />
      <div className="flex flex-col gap-3">
        <Accordion title="Frais d'acquisition et de financement" total={<AnimatedNumber kind="eur" value={o.E2_sousTotal} />}>
          <Row label="Frais d'agence" help={agenceHelp} value={formatEur(o.fraisAgence)} />
          <Row
            label={`Frais de notaire (${formatRate(P.tauxNotaire)})`}
            help={`${formatRate(P.tauxNotaire)} du prix d'acquisition`}
            value={formatEur(o.fraisNotaire)}
          />
          <Row
            label={`Frais de garantie (${formatRate(P.tauxGarantie)})`}
            help={`${formatRate(P.tauxGarantie)} du financement bancaire`}
            value={formatEur(o.fraisGarantie)}
          />
          <Row
            label={`Frais de courtage (${formatRate(P.tauxCourtage)})`}
            help={`${formatRate(P.tauxCourtage)} du financement bancaire`}
            value={formatEur(o.fraisCourtage)}
          />
          <Row
            label={`Intérêts bancaires (${d} mois · ${formatRate(P.tauxInteretsBanqueAnnuel)}/an)`}
            help={`${formatRate(P.tauxInteretsBanqueAnnuel)} par an du financement bancaire, sur ${d} mois`}
            value={formatEur(o.interetsBanque)}
          />
          <Row
            label={`Frais de dossier (${formatRate(P.tauxFraisDossier)})`}
            help={`${formatRate(P.tauxFraisDossier)} du financement bancaire`}
            value={formatEur(o.fraisDossierBanque)}
          />
          <Row
            label={`Commission d'engagement (${formatRate(P.tauxCommissionEngagement)})`}
            help={`${formatRate(P.tauxCommissionEngagement)} du financement bancaire, payée une fois`}
            value={formatEur(o.commissionEngagement)}
          />
          <Row kind="subtotal" label="Total" value={formatEur(o.E2_sousTotal)} />
        </Accordion>

        <Accordion title="Coût de la dette obligataire" total={<AnimatedNumber kind="eur" value={o.E3_sousTotal} />}>
          <Row
            label={`Intérêts obligataires (${d} mois · ${formatRate(P.tauxObligataireAnnuel)}/an)`}
            help={`${formatRate(P.tauxObligataireAnnuel)} par an de la dette obligataire (${formatRate(P.partDetteObligataire)} de l'apport), sur ${d} mois`}
            value={formatEur(o.fraisDetteObligataire)}
          />
          <Row
            label={`Frais de structuration (${formatRate(P.tauxStructurationObligataire)})`}
            help={`${formatRate(P.tauxStructurationObligataire)} de la dette obligataire, payés une fois`}
            value={formatEur(o.fraisStructurationObligataire)}
          />
          <Row kind="subtotal" label="Total" value={formatEur(o.E3_sousTotal)} />
        </Accordion>

        <Accordion title="Financement bancaire" total={<AnimatedNumber kind="eur" value={o.R1} />}>
          <Row
            label={`Prêt acquisition (${formatRate(P.quotiteAcquisition)} du prix)`}
            help={`${formatRate(P.quotiteAcquisition)} du prix d'acquisition`}
            value={formatEur(o.pretAcquisition)}
          />
          <Row
            label={`Prêt travaux (${formatRate(P.quotiteTravaux)} des travaux)`}
            help={`${formatRate(P.quotiteTravaux)} du montant des travaux`}
            value={formatEur(o.pretTravaux)}
          />
          <Row
            label="Loan to Cost"
            help="Financement bancaire / total des emplois"
            value={formatPctInt(o.loanToCost)}
          />
          <Row kind="subtotal" label="Total" value={formatEur(o.R1)} />
        </Accordion>
      </div>
    </section>
  );
}
