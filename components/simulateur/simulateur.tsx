"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Download, RotateCcw, Share2 } from "lucide-react";
import { computeFaisabilite } from "@/lib/simulateur/engine";
import {
  formatEur,
  formatEurM2,
  formatEurM2Signed,
  formatEurSigned,
  formatPct1,
  formatPctInt,
  formatRate,
  parseInput,
} from "@/lib/simulateur/format";
import { DUREES, PARAMS } from "@/lib/simulateur/params";
import { computeScenario, SCENARIOS, type ScenarioKey } from "@/lib/simulateur/scenarios";
import { encodeShareHash, toInputs, type SimState } from "@/lib/simulateur/state";
import type { Inputs, Outputs, Scenario } from "@/lib/simulateur/types";
import { cn } from "@/lib/utils";
import { Accordion } from "./accordion";
import { FinancementBars, FinancementSankey, LtcGauge, MargeBarChart } from "./charts";
import { useMedia } from "./use-media";
import { InstallGuide } from "./install-guide";
import { NumberField } from "./number-field";
import { Segmented } from "./segmented";
import { Row, SectionTitle } from "./ui";
import { useInstall } from "./use-install";
import { useSimulation } from "./use-simulation";

const P = PARAMS;

export function Simulateur() {
  const { state, update, reset } = useSimulation();
  const install = useInstall();

  const validation = useMemo(() => toInputs(state), [state]);
  const result = useMemo(
    () => (validation.ok ? { inputs: validation.inputs, outputs: computeFaisabilite(validation.inputs) } : null),
    [validation],
  );

  return (
    <div className="min-h-dvh pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Header
        onReset={reset}
        state={state}
        showInstall={install.ready && !install.standalone}
        onInstall={() => (install.canPromptInstall && install.platform === "android" ? install.promptInstall() : install.openGuide())}
      />

      <main className="mx-auto w-full max-w-[1200px] px-4 pb-16 sm:px-6">
        <div className="pt-6 pb-8 md:pt-10 md:pb-12">
          <h1 className="text-[32px] leading-none font-extrabold tracking-[-0.025em] text-white md:text-5xl">
            Simulateur de <span className="text-orange">faisabilité</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-light text-text-secondary md:text-base">
            Combien coûte l&apos;opération, combien apporter, à quel prix revendre. Tes chiffres restent sur ton
            appareil : rien n&apos;est envoyé sur internet.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
          <aside className="lg:sticky lg:top-6">
            <InputsSection state={state} update={update} validation={validation} />
          </aside>

          <div className="flex min-w-0 flex-col gap-12">
            <KpiSection result={result} validation={validation} />
            <ScenariosSection state={state} update={update} result={result} />
            {result ? <FinancementSection inputs={result.inputs} outputs={result.outputs} /> : null}
            {result ? <DetailSection inputs={result.inputs} outputs={result.outputs} /> : null}
          </div>
        </div>
      </main>

      <InstallGuide
        open={install.open}
        platform={install.platform}
        canPromptInstall={install.canPromptInstall}
        onInstall={install.promptInstall}
        onClose={install.dismiss}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- Header */

function Header({
  onReset,
  state,
  showInstall,
  onInstall,
}: {
  onReset: () => void;
  state: SimState;
  showInstall: boolean;
  onInstall: () => void;
}) {
  const [shared, setShared] = useState(false);

  async function share() {
    // L'état est encodé dans le fragment (#…), jamais transmis au serveur.
    const url = `${window.location.origin}${window.location.pathname}${encodeShareHash(state)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Simulation — La Relève", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // partage annulé
    }
  }

  function confirmReset() {
    if (window.confirm("Effacer la simulation en cours ?")) onReset();
  }

  return (
    <header className="mx-auto flex w-full max-w-[1200px] items-center gap-3 px-4 pt-4 sm:px-6">
      <Image src="/logo-la-releve.png" alt="La Relève" width={915} height={280} priority unoptimized className="h-7 w-auto md:h-8" />
      <div className="flex-1" />
      {showInstall ? (
        <button
          type="button"
          onClick={onInstall}
          className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-semibold text-text-secondary hover:text-white"
        >
          <Download className="size-3.5" />
          Installer l&apos;app
        </button>
      ) : null}
      <IconButton label={shared ? "Lien copié" : "Partager cette simulation"} onClick={share}>
        <Share2 className="size-4" />
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
      className="flex size-9 items-center justify-center rounded-full border border-line-strong bg-surface text-white/80 transition-colors hover:bg-surface-hover hover:text-white"
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------- 01 — Le bien */

type Update = <K extends keyof SimState>(key: K, value: SimState[K]) => void;
type Validation = ReturnType<typeof toInputs>;

function InputsSection({ state, update, validation }: { state: SimState; update: Update; validation: Validation }) {
  const prix = parseInput(state.prixAcquisition);
  const surface = parseInput(state.surface);
  const prixM2 = prix !== null && surface ? prix / surface : null;
  const surfaceZero = !validation.ok && validation.surfaceZero;

  return (
    <section className="card" aria-labelledby="s01">
      <div className="mb-6 flex flex-col gap-2">
        <span className="eyebrow">01 — Le bien</span>
        <h2 id="s01" className="text-2xl font-extrabold text-white">
          L&apos;opération
        </h2>
      </div>
      <div className="flex flex-col gap-5">
        <NumberField
          id="prix"
          label="Prix d'acquisition (hors FAI)"
          value={state.prixAcquisition}
          onChange={(v) => update("prixAcquisition", v)}
          suffix="€"
          placeholder="300 000"
          help={prixM2 !== null ? `Soit ${formatEurM2(prixM2)} à l'achat` : undefined}
        />
        <NumberField
          id="surface"
          label="Surface habitable"
          value={state.surface}
          onChange={(v) => update("surface", v)}
          suffix="m²"
          placeholder="100"
          invalid={surfaceZero}
          help={surfaceZero ? <span className="text-negative">La surface doit être supérieure à 0.</span> : undefined}
        />
        <NumberField
          id="travaux"
          label="Travaux (TTC)"
          value={state.travaux}
          onChange={(v) => update("travaux", v)}
          suffix="€"
          placeholder="100 000"
        />
        <div className="flex flex-col gap-2">
          <span className="text-sm text-text-secondary" id="duree-label">
            Durée de l&apos;opération
          </span>
          <Segmented
            ariaLabel="Durée de l'opération"
            options={DUREES.map((d) => ({ value: d, label: `${d} mois` }))}
            value={state.duree}
            onChange={(v) => update("duree", v)}
            className="w-full"
          />
        </div>
        <NumberField
          id="agence"
          label="Frais d'agence"
          value={state.agence}
          onChange={(v) => update("agence", v)}
          suffix={state.modeAgence === "pct" ? "%" : "€"}
          placeholder="0"
          trailing={
            <Segmented
              ariaLabel="Unité des frais d'agence"
              size="sm"
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
                  update("agence", String(rounded).replace(".", ","));
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
    </section>
  );
}

/* ---------------------------------------------------------------- 02 — L'essentiel */

type Result = { inputs: Inputs; outputs: Outputs } | null;

const MISSING_LABELS = {
  prixAcquisition: "Prix d'acquisition",
  surface: "Surface m²",
  travaux: "Coût des travaux",
};

function KpiSection({ result, validation }: { result: Result; validation: Validation }) {
  const o = result?.outputs;
  return (
    <section aria-labelledby="s02">
      <SectionTitle index="02" eyebrow="L'essentiel" title="Ce que coûte l'opération" />
      {!o ? (
        <div className="mb-4 rounded-2xl border border-accent-soft-2 bg-accent-soft px-5 py-4 text-sm text-text-secondary">
          <p className="font-semibold text-white">Complète ces valeurs pour commencer :</p>
          <ol className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1">
            {(["prixAcquisition", "surface", "travaux"] as const).map((k, i) => (
              <li
                key={k}
                className={cn(!validation.ok && validation.missing.includes(k) ? "text-white" : "text-text-muted line-through")}
              >
                {i + 1}. {MISSING_LABELS[k]}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Kpi
          label="Coût total de l'opération"
          value={o ? formatEur(o.totalReelInclDetteObligataire) : "—"}
          sub={o ? `dont ${formatEur(o.E2_sousTotal + o.E3_sousTotal)} de frais` : undefined}
        />
        <Kpi
          label="Apport nécessaire"
          value={o ? formatEur(o.apportTotal) : "—"}
          sub={
            o ? (
              <>
                Fonds propres {formatEur(o.fondsPropres)} · Dette obligataire {formatEur(o.detteObligataire)}
              </>
            ) : undefined
          }
        />
        <Kpi
          label="Prix de revient au m²"
          value={o ? formatEurM2(o.prixRevientM2) : "—"}
          sub={o ? "Seuil de rentabilité à la revente" : undefined}
        />
        <Kpi
          label="Loan to Cost"
          value={o ? formatPctInt(o.loanToCost) : "—"}
          sub={o ? <LtcGauge value={o.loanToCost} /> : undefined}
        />
      </div>
    </section>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-2xl border border-line bg-surface p-4 md:p-5">
      <div className="tabular text-[22px] leading-tight font-extrabold text-orange sm:text-[28px] md:text-[30px]">{value}</div>
      <div className="label-key">{label}</div>
      {sub ? <div className="mt-1 text-xs font-light text-text-muted">{sub}</div> : null}
    </div>
  );
}

/* ---------------------------------------------------------------- 03 — La revente */

function ScenariosSection({ state, update, result }: { state: SimState; update: Update; result: Result }) {
  const scenarios = useMemo(() => {
    return SCENARIOS.map(({ key, label }) => {
      const prixM2 = parseInput(state.ventes[key]);
      const scenario =
        result && prixM2 !== null && prixM2 > 0 ? computeScenario(result.outputs, result.inputs, prixM2) : null;
      return { key, label, scenario };
    });
  }, [state.ventes, result]);

  const filled = scenarios.filter((s): s is { key: ScenarioKey; label: string; scenario: Scenario } => s.scenario !== null);

  return (
    <section aria-labelledby="s03">
      <SectionTitle
        index="03"
        eyebrow="La revente"
        title="À quel prix revendre ?"
        subtitle={
          result ? (
            <>
              Seuil de rentabilité :{" "}
              <span className="font-semibold text-orange">{formatEurM2(result.outputs.prixRevientM2)}</span>
            </>
          ) : (
            "Saisis un prix de vente au m² pour chaque scénario."
          )
        }
      />
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {SCENARIOS.map(({ key, label }) => (
          <NumberField
            key={key}
            id={`vente-${key}`}
            label={label}
            value={state.ventes[key]}
            onChange={(v) => update("ventes", { ...state.ventes, [key]: v })}
            suffix="€/m²"
            placeholder="—"
            compact
          />
        ))}
      </div>

      {filled.length > 0 ? (
        <div className="card mt-6 !p-4 md:!p-6">
          <div className="label-key mb-2">Marge brute avant impôts par scénario</div>
          <MargeBarChart items={filled.map((s) => ({ name: s.label, scenario: s.scenario }))} />
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {scenarios.map(({ key, label, scenario }) => (
          <ScenarioCard key={key} label={label} scenario={scenario} ready={result !== null} />
        ))}
      </div>
    </section>
  );
}

function ScenarioCard({ label, scenario, ready }: { label: string; scenario: Scenario | null; ready: boolean }) {
  const negative = scenario !== null && scenario.margeBrute < 0;
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="pill">{label}</span>
        {scenario ? <span className="tabular text-xs text-text-muted">{formatEurM2(scenario.prixVenteM2)}</span> : null}
      </div>
      {scenario ? (
        <>
          <div className={cn("tabular text-[28px] leading-tight font-extrabold", negative ? "text-negative" : "text-orange")}>
            {formatEurSigned(scenario.margeBrute)}
          </div>
          <div className="label-key mt-1">Marge brute avant impôts</div>
          <div className="mt-4">
            <Row label="Prix de vente total" value={formatEur(scenario.prixVenteTotal)} />
            <Row
              label="Marge brute au m²"
              value={formatEurM2Signed(scenario.margeBruteM2)}
              negative={negative}
            />
            <Row
              label="Rentabilité (marge / prix de revient)"
              value={formatPct1(scenario.rentabiliteSurCout)}
              negative={negative}
            />
          </div>
        </>
      ) : (
        <p className="py-4 text-sm font-light text-text-muted">
          {ready ? "Saisis un prix de vente au m² pour voir ce scénario." : "Complète d'abord le bien (section 01)."}
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- 04 — Le plan de financement */

function FinancementSection({ inputs, outputs: o }: { inputs: Inputs; outputs: Outputs }) {
  // Sous 640 px le Sankey devient illisible : barres empilées Ressources / Emplois.
  const phone = useMedia("(max-width: 639px)");
  return (
    <section aria-labelledby="s04">
      <SectionTitle
        index="04"
        eyebrow="Le plan de financement"
        title="D'où vient l'argent, où il va"
        subtitle="Les deux côtés s'équilibrent : c'est le tableau Ressources / Emplois que demandent les banques."
      />
      <div className="card !p-3 md:!p-6">
        {phone ? (
          <FinancementBars outputs={o} prixAcquisition={inputs.prixAcquisition} travaux={inputs.travaux} />
        ) : (
          <FinancementSankey outputs={o} prixAcquisition={inputs.prixAcquisition} travaux={inputs.travaux} />
        )}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card">
          <h3 className="text-2xl font-extrabold text-white">D&apos;où vient l&apos;argent</h3>
          <p className="label-key mt-1 mb-4">Ressources</p>
          <Row label="Prêt bancaire acquisition" value={formatEur(o.pretAcquisition)} />
          <Row label="Prêt bancaire travaux" value={formatEur(o.pretTravaux)} />
          <Row label="Dette obligataire" value={formatEur(o.detteObligataire)} />
          <Row label="Fonds propres" value={formatEur(o.fondsPropres)} />
          <Row kind="total" label="Total ressources" value={formatEur(o.R1_total)} />
        </div>
        <div className="card">
          <h3 className="text-2xl font-extrabold text-white">Où va l&apos;argent</h3>
          <p className="label-key mt-1 mb-4">Emplois</p>
          <Row label="Acquisition" value={formatEur(inputs.prixAcquisition)} />
          <Row label="Travaux" value={formatEur(inputs.travaux)} />
          <Row label="Frais d'acquisition et de financement" value={formatEur(o.E2_sousTotal)} />
          <Row kind="total" label="Total emplois" value={formatEur(o.E1_total)} />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- 05 — Détail du chiffrage */

function DetailSection({ inputs, outputs: o }: { inputs: Inputs; outputs: Outputs }) {
  const d = inputs.duree;
  const agenceHelp =
    inputs.modeAgence === "pct" ? `${formatRate(inputs.valeurAgence)} du prix d'acquisition` : "Montant saisi";
  return (
    <section aria-labelledby="s05">
      <SectionTitle index="05" eyebrow="Détail du chiffrage" title="Ligne par ligne" />
      <div className="flex flex-col gap-3">
        <Accordion title="Frais d'acquisition et de financement" total={formatEur(o.E2_sousTotal)}>
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

        <Accordion title="Coût de la dette obligataire" total={formatEur(o.E3_sousTotal)}>
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

        <Accordion title="Financement bancaire" total={formatEur(o.R1)}>
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
