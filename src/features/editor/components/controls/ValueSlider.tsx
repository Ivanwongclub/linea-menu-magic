import type { PointerEvent } from "react";
import { PrecisionNumberInput } from "./PrecisionNumberInput";
import { DISPLAY_DP, clamp, type ValueUnit } from "./precision";
import { Handle, Track, ValueBadge, ValueMarker, formatValue, percentOf, useTrackPointer } from "./SliderTrack";

export interface ValueSliderProps {
  id: string;
  label: string;
  value: number;
  /** The slider's range — a convenience; the numeric field may go beyond it within `hardMin`/`hardMax`. */
  min: number;
  max: number;
  unit: ValueUnit;
  onChange: (value: number) => void;
  hardMin?: number;
  hardMax?: number;
  exclusiveMin?: boolean;
  /** Pointer snapping; defaults to the unit's base key step. */
  step?: number;
  testId: string;
}

const FIELD_LABEL = "text-[11px] uppercase tracking-[0.12em] text-muted-foreground";

/**
 * Hybrid control (rulings §3, addendum §34): the numeric field is
 * authoritative, the slider is a convenience. The value label rides above
 * the handle with a vertical marker line through the track. One value, one
 * `onChange` — no local copy to drift.
 */
export function ValueSlider({ id, label, value, min, max, unit, onChange, hardMin, hardMax, exclusiveMin, step, testId }: ValueSliderProps) {
  const snap = step ?? (unit === "mm" ? 0.01 : 0.1);
  const { trackRef, valueAt } = useTrackPointer(min, max, snap);
  const percent = percentOf(value, min, max);

  const commit = (next: number) => {
    const bounded = clamp(next, hardMin, hardMax);
    if (exclusiveMin && hardMin !== undefined && bounded <= hardMin) return;
    if (bounded !== value) onChange(bounded);
  };

  const startDrag = (event: PointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    commit(valueAt(event.clientX));
    const move = (e: globalThis.PointerEvent) => commit(valueAt(e.clientX));
    const end = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", end);
      target.removeEventListener("pointercancel", end);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", end);
    target.addEventListener("pointercancel", end);
  };

  return (
    <div className="space-y-0.5 min-w-0" data-testid={testId}>
      <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] items-end gap-3">
        <label htmlFor={id} className={FIELD_LABEL}>
          {label}
        </label>
        <PrecisionNumberInput
          id={id}
          testId={`${testId}-input`}
          value={value}
          unit={unit}
          min={hardMin}
          max={hardMax}
          exclusiveMin={exclusiveMin}
          onChange={onChange}
        />
      </div>
      <Track
        trackRef={trackRef}
        testId={`${testId}-track`}
        onPointerDown={startDrag}
        overlay={
          <>
            <ValueBadge percent={percent} testId={`${testId}-badge`}>
              {formatValue(value, unit, DISPLAY_DP[unit].rest)}
            </ValueBadge>
            <ValueMarker percent={percent} />
          </>
        }
      >
        <Handle
          percent={percent}
          value={value}
          min={min}
          max={max}
          unit={unit}
          label={label}
          testId={`${testId}-handle`}
          onStep={commit}
          onPointerDown={startDrag}
        />
      </Track>
    </div>
  );
}
