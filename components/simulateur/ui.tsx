import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionTitle({ index, eyebrow, title, subtitle }: { index: string; eyebrow: string; title: string; subtitle?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-2">
      <span className="eyebrow">
        {index} — {eyebrow}
      </span>
      <h2 className="text-2xl leading-tight font-extrabold text-white md:text-[30px]">{title}</h2>
      {subtitle ? <p className="text-sm font-light text-text-secondary md:text-base">{subtitle}</p> : null}
    </div>
  );
}

type RowKind = "line" | "subtotal" | "total";

export function Row({
  label,
  value,
  help,
  kind = "line",
  negative,
}: {
  label: ReactNode;
  value: ReactNode;
  help?: ReactNode;
  kind?: RowKind;
  negative?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 py-2",
        kind === "line" && "border-b border-line last:border-b-0",
        kind !== "line" && "mt-1 border-t border-line-strong pt-3",
      )}
    >
      <div className="min-w-0">
        <div className={cn("text-sm", kind === "line" ? "text-text-secondary" : "font-semibold text-white")}>{label}</div>
        {help ? <div className="mt-0.5 text-xs font-light text-text-muted">{help}</div> : null}
      </div>
      <div
        className={cn(
          "tabular shrink-0 text-right",
          kind === "total" ? "text-2xl font-extrabold text-orange" : "text-sm font-semibold text-white",
          negative && "text-negative",
        )}
      >
        {value}
      </div>
    </div>
  );
}
