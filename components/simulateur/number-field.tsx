"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { formatInputDraft } from "@/lib/simulateur/format";
import { cn } from "@/lib/utils";

interface NumberFieldProps {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  help?: ReactNode;
  placeholder?: string;
  invalid?: boolean;
  /** Attire l'œil sur un champ à compléter (bordure orange), sans signaler d'erreur. */
  attention?: boolean;
  className?: string;
  compact?: boolean;
  trailing?: ReactNode;
  /** Élément intégré à droite dans la case (remplace le suffixe), ex. bascule d'unité. */
  adornment?: ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
}

/** Nombre de caractères significatifs (chiffres, virgule) avant la position donnée. */
function significantBefore(s: string, pos: number) {
  return s.slice(0, pos).replace(/[^\d,]/g, "").length;
}

function positionAfter(s: string, count: number) {
  if (count === 0) return 0;
  let seen = 0;
  for (let i = 0; i < s.length; i++) {
    if (/[\d,]/.test(s[i])) seen++;
    if (seen === count) return i + 1;
  }
  return s.length;
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  suffix,
  help,
  placeholder = "0",
  invalid,
  attention,
  className,
  compact,
  trailing,
  adornment,
  onFocus,
  onBlur,
}: NumberFieldProps) {
  const ref = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && caret.current !== null && document.activeElement === el) {
      const pos = positionAfter(el.value, caret.current);
      el.setSelectionRange(pos, pos);
      caret.current = null;
    }
  }, [value]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="truncate text-sm text-text-secondary">
          {label}
        </label>
        {trailing}
      </div>
      <div
        className={cn(
          "flex items-center rounded-xl border bg-field transition-colors focus-within:border-orange",
          invalid ? "border-negative/70" : attention ? "border-orange/80" : "border-line-strong",
          compact ? "h-11 px-3" : "h-12 px-3.5",
          adornment && "pr-1.5",
        )}
      >
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="next"
          placeholder={placeholder}
          value={value}
          aria-invalid={invalid || undefined}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(e) => {
            const raw = e.target.value;
            caret.current = significantBefore(raw, e.target.selectionStart ?? raw.length);
            onChange(formatInputDraft(raw));
          }}
          className="tabular min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg/25"
        />
        {adornment ? (
          <div className="ml-2 shrink-0">{adornment}</div>
        ) : suffix ? (
          <span className="ml-2 shrink-0 text-sm text-text-muted">{suffix}</span>
        ) : null}
      </div>
      {help ? <div className="text-[13px] font-light text-text-secondary">{help}</div> : null}
    </div>
  );
}
