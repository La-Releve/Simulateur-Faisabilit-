"use client";

import { cn } from "@/lib/utils";

interface SegmentedProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "sm" | "md";
  className?: string;
}

/** Segmented control en pills, segment actif orange. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "md",
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("inline-flex rounded-full border border-line-strong bg-surface p-1", className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-full font-semibold whitespace-nowrap transition-colors",
              size === "sm" ? "px-3 py-1 text-xs" : "px-1.5 py-2 text-[13px]",
              active ? "bg-orange text-white" : "text-text-secondary hover:text-white",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
