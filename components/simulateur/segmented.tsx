"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SegmentedProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "sm" | "md";
  className?: string;
}

/** Segmented control en pills : la pastille orange glisse vers l'option active (transitions.dev « Tabs sliding »). */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "md",
  className,
}: SegmentedProps<T>) {
  const barRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);

  useLayoutEffect(() => {
    const bar = barRef.current;
    const pill = pillRef.current;
    if (!bar || !pill) return;

    const move = (animate: boolean) => {
      const tab = bar.querySelector<HTMLElement>('[aria-checked="true"]');
      if (!tab) return;
      if (!animate) pill.style.transition = "none";
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
      if (!animate) {
        void pill.offsetWidth; // applique la position avant de réactiver la transition
        pill.style.transition = "";
      }
    };

    // Premier placement et redimensionnements : sans animation
    move(placed.current);
    placed.current = true;
    const ro = new ResizeObserver(() => move(false));
    ro.observe(bar);
    return () => ro.disconnect();
  }, [value]);

  return (
    <div
      ref={barRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("relative inline-flex rounded-full border border-line-strong bg-surface p-1", className)}
    >
      <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
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
              "t-tab flex-1 rounded-full font-semibold whitespace-nowrap",
              size === "sm" ? "px-3 py-1 text-xs" : "px-1.5 py-2 text-[13px]",
              active ? "text-white" : "text-text-secondary hover:text-fg",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
