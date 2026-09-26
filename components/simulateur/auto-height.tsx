"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Card resize (transitions.dev 01) appliqué à un bloc dont le contenu apparaît / disparaît :
 * la hauteur est mesurée et posée explicitement pour pouvoir être animée (height: auto ne
 * se transitionne pas). Le contenu sortant reste affiché le temps que le bloc se referme.
 */
export function AutoHeight({ children }: { children: ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [shown, setShown] = useState<ReactNode>(children);
  const empty = children === null || children === undefined || children === false;

  // Garde le dernier contenu visible pendant la fermeture
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronisation avant peinture
    if (!empty) setShown(children);
  }, [children, empty]);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => setHeight(empty ? 0 : el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [empty]);

  return (
    <div className="t-resize" style={{ height }} data-empty={empty} aria-hidden={empty || undefined}>
      <div ref={innerRef} className="t-resize-inner">
        {empty ? shown : children}
      </div>
    </div>
  );
}
