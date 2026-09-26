"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** Accordéon (transitions.dev « Accordion expand ») : grid-rows, contenu en fondu flou, chevron qui bascule. */
export function Accordion({ title, total, children }: { title: string; total: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="t-acc rounded-2xl border border-line bg-surface" data-open={open}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left md:px-6"
      >
        <span className="flex-1 text-base font-semibold text-fg">{title}</span>
        <span className="tabular text-base font-extrabold text-orange">{total}</span>
        <ChevronDown className="t-acc-chevron size-5 shrink-0 text-text-muted" />
      </button>
      <div id={id} className="t-acc-panel">
        <div className="t-acc-panel-inner" inert={!open}>
          <div className="px-5 pb-4 md:px-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
