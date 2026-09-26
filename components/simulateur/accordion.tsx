"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({ title, total, children }: { title: string; total: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left md:px-6"
      >
        <span className="flex-1 text-base font-semibold text-white">{title}</span>
        <span className="tabular text-base font-extrabold text-orange">{total}</span>
        <ChevronDown className={cn("size-5 shrink-0 text-text-muted transition-transform duration-200", open && "rotate-180")} />
      </button>
      <div
        id={id}
        className={cn("grid transition-[grid-template-rows] duration-200 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
      >
        <div className="overflow-hidden" inert={!open}>
          <div className="px-5 pb-4 md:px-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
