"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

/** Toast (transitions.dev « Toast open / close ») : monte du bas, se ferme seul. */
export function useToast(holdMs = 2200) {
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback(
    (msg: string) => {
      clearTimeout(timer.current);
      setMessage(msg);
      // laisse le DOM se peindre fermé avant d'ouvrir, pour que la transition joue
      requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
      timer.current = setTimeout(() => setOpen(false), holdMs);
    },
    [holdMs],
  );

  useEffect(() => () => clearTimeout(timer.current), []);
  return { message, open, show };
}

export function Toast({ message, open }: { message: string | null; open: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(20px,env(safe-area-inset-bottom))]"
    >
      {message ? (
        <div
          className={`t-toast flex items-center gap-2 rounded-full border border-line-strong bg-elevated/95 px-4 py-2.5 text-sm font-semibold text-fg shadow-lg backdrop-blur ${open ? "is-open" : ""}`}
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-orange">
            <Check className="size-3 text-white" strokeWidth={3} />
          </span>
          {message}
        </div>
      ) : null}
    </div>
  );
}
