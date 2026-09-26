"use client";

import { useLayoutEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Texte sur une seule ligne par élément : la taille de police est réduite juste ce qu'il faut
 * (entre `min` et `max`, en px) pour que la ligne la plus longue tienne dans la largeur
 * disponible. La mesure porte sur le rendu réel (police chargée, appareil), recalculée au
 * redimensionnement. Sous `min`, le texte revient à la ligne plutôt que de devenir illisible.
 */
export function FitText({
  as: Tag = "div",
  max,
  min,
  className,
  children,
}: {
  as?: ElementType;
  max: number;
  min: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [size, setSize] = useState(max);
  const [wrap, setWrap] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const lines = el.children.length > 0 ? [...el.children] : [el];
      const measure = () => Math.max(...lines.map((l) => (l as HTMLElement).scrollWidth));
      el.style.whiteSpace = "nowrap";
      // Réduction itérative : la largeur rendue n'est pas strictement proportionnelle à la
      // taille de police (arrondis, crénage), on re-mesure jusqu'à ce que tout tienne.
      let next = max;
      for (let i = 0; i < 6; i++) {
        el.style.fontSize = `${next}px`;
        const natural = measure();
        const available = el.clientWidth;
        if (natural <= available) break;
        next = Math.max(min, (next * available) / natural - 0.25);
        if (next === min) {
          el.style.fontSize = `${next}px`;
          break;
        }
      }
      const overflows = measure() > el.clientWidth;
      el.style.whiteSpace = "";
      setSize(next);
      setWrap(overflows);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => ro.disconnect();
  }, [max, min, children]);

  return (
    <Tag ref={ref} className={cn(!wrap && "whitespace-nowrap [&>*]:whitespace-nowrap", className)} style={{ fontSize: size }}>
      {children}
    </Tag>
  );
}
