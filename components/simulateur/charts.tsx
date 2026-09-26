"use client";

import { useMemo } from "react";
import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { Gauge } from "@/components/charts/gauge";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { SankeyChart, SankeyLink, SankeyNode, SankeyTooltip, type SankeyData } from "@/components/charts/sankey";
import { formatEur, formatEurSigned, formatPct1 } from "@/lib/simulateur/format";
import type { Outputs, Scenario } from "@/lib/simulateur/types";
import { useMedia, useReducedMotion } from "./use-media";

/* ---------- Sankey : plan de financement ---------- */

interface FlowItem {
  name: string;
  value: number;
  color: string;
}

function financementSources(o: Outputs): FlowItem[] {
  return [
    { name: "Prêt acquisition", value: o.pretAcquisition, color: "var(--chart-4)" },
    { name: "Prêt travaux", value: o.pretTravaux, color: "var(--chart-4)" },
    { name: "Dette obligataire", value: o.detteObligataire, color: "var(--chart-2)" },
    { name: "Fonds propres", value: o.fondsPropres, color: "var(--chart-1)" },
  ].filter((f) => f.value > 0);
}

export function FinancementSankey({ outputs, prixAcquisition, travaux }: { outputs: Outputs; prixAcquisition: number; travaux: number }) {
  const narrow = useMedia("(max-width: 767px)");
  const reduced = useReducedMotion();

  const { data, colors } = useMemo(() => {
    const sources = financementSources(outputs);
    const usages: FlowItem[] = [
      { name: "Acquisition", value: prixAcquisition, color: "#a1a1aa" },
      { name: "Travaux", value: travaux, color: "#71717a" },
      { name: "Frais", value: outputs.E2_sousTotal, color: "#52525b" },
    ].filter((f) => f.value > 0);
    const centre = sources.length;
    const nodes: SankeyData["nodes"] = [
      ...sources.map((s) => ({ name: s.name, category: "source" as const })),
      { name: "Coût de l'opération", category: "landing" as const },
      ...usages.map((u) => ({ name: u.name, category: "outcome" as const })),
    ];
    const links: SankeyData["links"] = [
      ...sources.map((s, i) => ({ source: i, target: centre, value: s.value })),
      ...usages.map((u, i) => ({ source: centre, target: centre + 1 + i, value: u.value })),
    ];
    const colors = [...sources.map((s) => s.color), "var(--flow-center)", ...usages.map((u) => u.color)];
    return { data: { nodes, links }, colors };
  }, [outputs, prixAcquisition, travaux]);

  const getColor = (_: unknown, i: number) => colors[i] ?? "var(--chart-5)";

  return (
    <SankeyChart
      data={data}
      aspectRatio={narrow ? "1 / 1.15" : "2 / 1"}
      margin={narrow ? { top: 12, bottom: 12, left: 40, right: 40 } : { top: 24, bottom: 24, left: 130, right: 130 }}
      nodePadding={narrow ? 14 : 22}
      nodeWidth={narrow ? 12 : 16}
      animationDuration={reduced ? 0 : 900}
    >
      <SankeyLink getNodeColor={getColor} strokeOpacity={0.35} />
      <SankeyNode getNodeColor={getColor} labelOrientation={narrow ? "vertical" : "horizontal"} showValueLabels={!narrow} formatValue={formatEur} />
      <SankeyTooltip
        formatValue={formatEur}
        nodeContent={({ node }) => (
          <div className="px-3 py-2.5">
            <div className="text-xs text-chart-tooltip-muted">{node.name}</div>
            <div className="tabular text-sm font-semibold text-chart-tooltip-foreground">{formatEur(node.value ?? 0)}</div>
          </div>
        )}
      />
    </SankeyChart>
  );
}

/* ---------- Mobile (< 640 px) : Ressources / Emplois en barres empilées ---------- */

const FLOW_SERIES = [
  { key: "pretAcquisition", label: "Prêt acquisition", color: "#71717a" },
  { key: "pretTravaux", label: "Prêt travaux", color: "#52525b" },
  { key: "detteObligataire", label: "Dette obligataire", color: "var(--chart-2)" },
  { key: "fondsPropres", label: "Fonds propres", color: "var(--chart-1)" },
  { key: "acquisition", label: "Acquisition", color: "var(--flow-strong)" },
  { key: "travaux", label: "Travaux", color: "#a1a1aa" },
  { key: "frais", label: "Frais", color: "var(--flow-weak)" },
] as const;

export function FinancementBars({ outputs: o, prixAcquisition, travaux }: { outputs: Outputs; prixAcquisition: number; travaux: number }) {
  const reduced = useReducedMotion();
  const data = useMemo(
    () => [
      {
        name: "Ressources",
        pretAcquisition: o.pretAcquisition,
        pretTravaux: o.pretTravaux,
        detteObligataire: o.detteObligataire,
        fondsPropres: o.fondsPropres,
        acquisition: 0,
        travaux: 0,
        frais: 0,
      },
      {
        name: "Emplois",
        pretAcquisition: 0,
        pretTravaux: 0,
        detteObligataire: 0,
        fondsPropres: 0,
        acquisition: prixAcquisition,
        travaux,
        frais: o.E2_sousTotal,
      },
    ],
    [o, prixAcquisition, travaux],
  );

  return (
    <div>
      <BarChart
        data={data}
        xDataKey="name"
        orientation="horizontal"
        stacked
        stackGap={2}
        aspectRatio="2 / 1"
        barGap={0.3}
        margin={{ top: 4, right: 8, bottom: 4, left: 84 }}
        animationDuration={reduced ? 0 : 700}
      >
        {FLOW_SERIES.map((f) => (
          <Bar key={f.key} dataKey={f.key} fill={f.color} lineCap={3} />
        ))}
        <BarYAxis showAllLabels />
        <ChartTooltip
          showCrosshair={false}
          showDots={false}
          content={({ point }) => (
            <div className="min-w-44 px-3 py-2.5">
              <div className="mb-1.5 text-xs font-semibold text-chart-tooltip-foreground">{String(point.name)}</div>
              {FLOW_SERIES.filter((f) => (point[f.key] as number) > 0).map((f) => (
                <TooltipLine key={f.key} label={f.label} value={formatEur(point[f.key] as number)} />
              ))}
            </div>
          )}
        />
      </BarChart>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-text-secondary">
        {FLOW_SERIES.filter((f) => data[0][f.key] + data[1][f.key] > 0).map((f) => (
          <li key={f.key} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: f.color }} />
            {f.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Bar chart : marge par scénario ---------- */

export interface ScenarioBarDatum {
  name: string;
  scenario: Scenario;
}

export function MargeBarChart({ items }: { items: ScenarioBarDatum[] }) {
  const reduced = useReducedMotion();
  const wide = useMedia("(min-width: 768px)");
  const data = useMemo(
    () =>
      items.map((it) => ({
        name: it.name,
        marge: it.scenario.margeBrute,
        rentabilite: it.scenario.rentabiliteSurCout,
        prixVenteTotal: it.scenario.prixVenteTotal,
      })),
    [items],
  );
  const hasNegative = data.some((d) => d.marge < 0);

  return (
    <BarChart
      data={data}
      xDataKey="name"
      aspectRatio={wide ? "3 / 1" : "16 / 9"}
      barGap={wide ? 0.5 : 0.35}
      margin={{ top: 16, right: 8, bottom: 32, left: 8 }}
      animationDuration={reduced ? 0 : 700}
    >
      <Grid horizontal numTicksRows={4} highlightRowValues={hasNegative ? [0] : undefined} />
      <Bar
        dataKey="marge"
        lineCap={6}
        fill="var(--chart-1)"
        getFill={(d) => ((d.marge as number) < 0 ? "var(--negative)" : "var(--chart-1)")}
      />
      <BarXAxis showAllLabels />
      <ChartTooltip
        showCrosshair={false}
        showDots={false}
        content={({ point }) => {
          const marge = point.marge as number;
          return (
            <div className="min-w-44 px-3 py-2.5">
              <div className="mb-1.5 text-xs font-semibold text-chart-tooltip-foreground">{String(point.name)}</div>
              <TooltipLine label="Marge brute" value={formatEurSigned(marge)} negative={marge < 0} />
              <TooltipLine label="Rentabilité" value={formatPct1(point.rentabilite as number)} negative={marge < 0} />
              <TooltipLine label="Prix de vente" value={formatEur(point.prixVenteTotal as number)} />
            </div>
          );
        }}
      />
    </BarChart>
  );
}

function TooltipLine({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-xs">
      <span className="text-chart-tooltip-muted">{label}</span>
      <span className={negative ? "tabular font-semibold text-negative" : "tabular font-semibold text-chart-tooltip-foreground"}>{value}</span>
    </div>
  );
}

/* ---------- Jauge linéaire : Loan to Cost ---------- */

export function LtcGauge({ value }: { value: number }) {
  return (
    <Gauge
      orientation="linear"
      value={Math.max(0, Math.min(100, value))}
      totalNotches={20}
      notchCornerRadius={2}
      inactiveFillOpacity={0.4}
      activeFill="var(--chart-1)"
      inactiveFill="var(--gauge-track)"
      linearHeight={10}
      minWidth={0}
    />
  );
}
