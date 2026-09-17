import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { DISPLAY_DP, UNIT_SUFFIX, arrowDirection, clamp, keyStep, stepValue, type ValueUnit } from "./precision";

export interface PrecisionNumberInputProps {
  id?: string;
  value: number;
  unit: ValueUnit;
  onChange: (value: number) => void;
  /** Hard limits on what can be stored — not the slider's range. */
  min?: number;
  max?: number;
  /** `min` itself is not allowed (text size and radius must stay above 0). */
  exclusiveMin?: boolean;
  testId?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
}

/**
 * The authoritative numeric field (rulings §3, addendum §5/§7). C3: mm at
 * 2 dp, 3 dp while focused; degrees at 1 dp, 2 dp while focused. What is
 * typed is written unrounded. ArrowUp/Down step by 0.01 mm / 0.1°, Shift by
 * 0.1 mm / 1°, Alt by 0.001 mm / 0.01°.
 */
export function PrecisionNumberInput({
  id,
  value,
  unit,
  onChange,
  min,
  max,
  exclusiveMin = false,
  testId,
  ariaLabel,
  ariaLabelledBy,
  className,
}: PrecisionNumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectOnFocus = useRef(false);
  const dp = DISPLAY_DP[unit];

  // Focusing re-renders the value at the focused precision, which would
  // drop the caret at the end; select it all so typing replaces the value.
  useLayoutEffect(() => {
    if (!selectOnFocus.current) return;
    selectOnFocus.current = false;
    inputRef.current?.select();
  }, [draft]);

  const allowed = (next: number) =>
    Number.isFinite(next) && (min === undefined || (exclusiveMin ? next > min : next >= min)) && (max === undefined || next <= max);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const next = stepValue(value, arrowDirection(event.key) * keyStep(unit, event));
    const bounded = exclusiveMin && min !== undefined && next <= min ? value : clamp(next, min, max);
    if (bounded === value) return;
    onChange(bounded);
    if (draft !== null) setDraft(bounded.toFixed(dp.focused));
  };

  return (
    <div className={cn("flex items-baseline min-w-0 border-b border-border focus-within:border-foreground transition-colors", className)}>
      <input
        ref={inputRef}
        id={id}
        data-testid={testId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        inputMode="decimal"
        autoComplete="off"
        className="w-full min-w-0 bg-transparent py-1 text-sm tabular-nums text-foreground outline-none"
        value={draft ?? value.toFixed(dp.rest)}
        onFocus={() => {
          selectOnFocus.current = true;
          setDraft(value.toFixed(dp.focused));
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={onKeyDown}
        onChange={(e) => {
          setDraft(e.target.value);
          const next = Number(e.target.value.replace(",", "."));
          if (e.target.value.trim() !== "" && allowed(next)) onChange(next);
        }}
      />
      <span className="pl-1 text-xs text-muted-foreground">{UNIT_SUFFIX[unit]}</span>
    </div>
  );
}
