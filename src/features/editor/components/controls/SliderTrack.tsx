import { useRef, type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject } from "react";
import { UNIT_SUFFIX, arrowDirection, keyStep, stepValue, type ValueUnit } from "./precision";

/** Position of `value` along `[min, max]` as 0–100, clamped for display only. */
export function percentOf(value: number, min: number, max: number): number {
  if (!(max > min)) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

export function formatValue(value: number, unit: ValueUnit, dp: number): string {
  return unit === "deg" ? `${value.toFixed(dp)}°` : `${value.toFixed(dp)} ${UNIT_SUFFIX[unit]}`;
}

/**
 * The value label above a handle, kept inside the track at either end.
 * `centre` hangs right at 0% and left at 100%; a range's `low` badge hangs
 * left of its handle and `high` right of it, so the pair never overlap.
 */
export function ValueBadge({
  percent,
  children,
  testId,
  align = "centre",
}: {
  percent: number;
  children: ReactNode;
  testId?: string;
  align?: "centre" | "low" | "high";
}) {
  const shift = align === "low" ? Math.min(100, percent * 4) : align === "high" ? Math.max(0, 100 - (100 - percent) * 4) : percent;
  return (
    <span
      data-testid={testId}
      className="pointer-events-none absolute top-0 whitespace-nowrap px-0.5 text-[10px] leading-4 tabular-nums text-foreground"
      style={{ left: `${percent}%`, transform: `translateX(-${shift}%)` }}
    >
      {children}
    </span>
  );
}

/** The vertical marker line from the badge down through the track (addendum hybrid controls). */
export function ValueMarker({ percent }: { percent: number }) {
  return <span aria-hidden className="pointer-events-none absolute top-4 bottom-0 w-px bg-foreground/30" style={{ left: `${percent}%` }} />;
}

interface HandleProps {
  percent: number;
  value: number;
  min: number;
  max: number;
  unit: ValueUnit;
  label: string;
  testId?: string;
  onStep: (next: number) => void;
  onPointerDown: (event: PointerEvent<HTMLSpanElement>) => void;
}

export function Handle({ percent, value, min, max, unit, label, testId, onStep, onPointerDown }: HandleProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    const direction = arrowDirection(event.key);
    if (!direction) return;
    event.preventDefault();
    onStep(stepValue(value, direction * keyStep(unit, event)));
  };
  return (
    <span
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      data-testid={testId}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      className="absolute top-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none border border-foreground bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      style={{ left: `${percent}%` }}
    />
  );
}

/**
 * Pointer → value for a track element: drags carry on outside the track via
 * pointer capture, and snap to `step` (the numeric field stays exact).
 */
export function useTrackPointer(min: number, max: number, step: number) {
  const trackRef = useRef<HTMLDivElement>(null);
  const valueAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return min;
    const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const raw = min + t * (max - min);
    return Math.round(Math.round(raw / step) * step * 1e9) / 1e9;
  };
  return { trackRef, valueAt };
}

/** Badges and markers sit in `overlay` (the full height); handles and band sit on the track line. */
export function Track({
  trackRef,
  overlay,
  children,
  onPointerDown,
  testId,
}: {
  trackRef: RefObject<HTMLDivElement>;
  overlay: ReactNode;
  children: ReactNode;
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
  testId?: string;
}) {
  return (
    <div className="relative mx-[7px] h-9 min-w-0 select-none">
      {overlay}
      <div ref={trackRef} data-testid={testId} onPointerDown={onPointerDown} className="absolute inset-x-0 bottom-0 h-4 touch-none cursor-pointer">
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        {children}
      </div>
    </div>
  );
}
