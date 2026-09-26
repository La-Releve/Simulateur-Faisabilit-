"use client";

import { useMemo } from "react";
import { Gauge } from "@/components/charts/gauge";
import { SankeyChart, SankeyLink, SankeyNode, SankeyTooltip, type SankeyData } from "@/components/charts/sankey";
import { formatEur } from "@/lib/simulateur/format";
import type { Outputs } from "@/lib/simulateur/types";
import { useMedia, useReducedMotion } from "./use-media";

/* ---------- Sankey : plan de financement ---------- */

interface FlowItem {
  name: string;
  /** Libellé court pour la version mobile */
  short: string;
  value: number;
  color: string;
}

function financementSources(o: Outputs): FlowItem[] {
  return [
    { name: "Prêt acquisition", short: "Prêt achat", value: o.pretAcquisition, color: "var(--chart-4)" },
    { name: "Prêt travaux", short: "Prêt travaux", value: o.pretTravaux, color: "var(--chart-4)" },
    { name: "Dette obligataire", short: "Obligataire", value: o.detteObligataire, color: "var(--chart-2)" },
    { name: "Fonds propres", short: "Fonds propres", value: o.fondsPropres, color: "var(--chart-1)" },
  ].filter((f) => f.value > 0);
}

/**
 * Même graphique en desktop et sur mobile ; sur mobile, libellés courts et plus petits,
 * marges resserrées et proportions plus hautes pour garder des flux lisibles.
 */
export function FinancementSankey({ outputs, prixAcquisition, travaux }: { outputs: Outputs; prixAcquisition: number; travaux: number }) {
  const narrow = useMedia("(max-width: 767px)");
  const reduced = useReducedMotion();

  const { data, colors } = useMemo(() => {
    const sources = financementSources(outputs);
    const usages: FlowItem[] = [
      { name: "Acquisition", short: "Achat", value: prixAcquisition, color: "#a1a1aa" },
      { name: "Travaux", short: "Travaux", value: travaux, color: "#71717a" },
      { name: "Frais", short: "Frais", value: outputs.E2_sousTotal, color: "#52525b" },
    ].filter((f) => f.value > 0);
    const centre = sources.length;
    const label = (f: FlowItem) => (narrow ? f.short : f.name);
    const nodes: SankeyData["nodes"] = [
      ...sources.map((s) => ({ name: label(s), category: "source" as const })),
      { name: narrow ? "Coût total" : "Coût de l'opération", category: "landing" as const },
      ...usages.map((u) => ({ name: label(u), category: "outcome" as const })),
    ];
    const links: SankeyData["links"] = [
      ...sources.map((s, i) => ({ source: i, target: centre, value: s.value })),
      ...usages.map((u, i) => ({ source: centre, target: centre + 1 + i, value: u.value })),
    ];
    const colors = [...sources.map((s) => s.color), "var(--flow-center)", ...usages.map((u) => u.color)];
    return { data: { nodes, links }, colors };
  }, [outputs, prixAcquisition, travaux, narrow]);

  const getColor = (_: unknown, i: number) => colors[i] ?? "var(--chart-5)";

  return (
    <div
      style={
        narrow
          ? ({ "--sankey-name-size": "11px", "--sankey-value-size": "10px" } as React.CSSProperties)
          : undefined
      }
    >
      <SankeyChart
        key={narrow ? "mobile" : "desktop"}
        data={data}
        aspectRatio={narrow ? "1 / 1" : "2 / 1"}
        margin={narrow ? { top: 16, bottom: 16, left: 92, right: 60 } : { top: 24, bottom: 24, left: 130, right: 130 }}
        nodePadding={22}
        nodeWidth={narrow ? 10 : 16}
        animationDuration={reduced ? 0 : 900}
      >
        <SankeyLink getNodeColor={getColor} strokeOpacity={0.35} />
        <SankeyNode getNodeColor={getColor} labelOrientation="horizontal" formatValue={narrow ? formatEurShort : formatEur} />
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
    </div>
  );
}

/** Montant abrégé pour les libellés étroits : 1,94 M€ / 337 k€ / 950 €. */
function formatEurShort(n: number): string {
  const nf = (v: number, d: number) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d }).format(v).replace(/\u202f/g, "\u00a0");
  if (n >= 1_000_000) return `${nf(n / 1_000_000, 2)}\u00a0M€`;
  if (n >= 10_000) return `${nf(Math.floor(n / 1000), 0)}\u00a0k€`;
  return formatEur(n);
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
