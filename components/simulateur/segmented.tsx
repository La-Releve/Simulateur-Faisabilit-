"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SegmentedProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "xs" | "md";
  className?: string;
}

/**
 * Segmented control (transitions.dev « Tabs sliding ») : la pastille glisse vers l'option active.
 * Au premier rendu et au redimensionnement, la pastille est placée sans transition ; seuls les
 * changements de sélection sont animés.
 */
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

  // Déplace la pastille sous l'onglet actif, animée ou non.
  const moveTo = (animate: boolean) => {
    const bar = barRef.current;
    const pill = pillRef.current;
    const tab = bar?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!bar || !pill || !tab) return;
    if (!animate) {
      const prev = pill.style.transition;
      pill.style.transition = "none";
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
      void pill.offsetWidth; // force le reflow avant de rétablir la transition
      pill.style.transition = prev;
    } else {
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
    }
  };

  // Changement de sélection : animé (sauf tout premier placement)
  useLayoutEffect(() => {
    moveTo(placed.current);
    placed.current = true;
  });

  // Redimensionnement (police chargée, rotation, largeur de colonne) : replacement sans animation
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let last = bar.offsetWidth;
    const ro = new ResizeObserver(() => {
      if (bar.offsetWidth === last) return; // ignore l'appel initial et les notifications sans effet
      last = bar.offsetWidth;
      moveTo(false);
    });
    ro.observe(bar);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={barRef} role="radiogroup" aria-label={ariaLabel} className={cn("t-tabs", className)}>
      <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "t-tab flex-1 font-semibold whitespace-nowrap",
            size === "xs" ? "h-7 min-w-8 px-2.5 text-xs" : "h-9 px-1.5 text-[13px]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
