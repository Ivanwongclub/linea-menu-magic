import type { PointerEvent } from "react";
import { PrecisionNumberInput } from "./PrecisionNumberInput";
import { DISPLAY_DP, type ValueUnit } from "./precision";
import { Handle, Track, ValueBadge, ValueMarker, formatValue, percentOf, useTrackPointer } from "./SliderTrack";

export interface RangeValueSliderProps {
  id: string;
  label: string;
  low: number;
  high: number;
  min: number;
  max: number;
  unit: ValueUnit;
  /** Always `low <= high`. */
  onChange: (low: number, high: number) => void;
  /** Field labels in reading order; `swapInputs` puts `high` first (e.g. start/end of counter-clockwise text). */
  lowLabel: string;
  highLabel: string;
  swapInputs?: boolean;
  step?: number;
  testId: string;
}

const FIELD_LABEL = "text-[11px] uppercase tracking-[0.12em] text-muted-foreground";

/**
 * Two-handle hybrid control (rulings §3). Dragging a handle moves that end;
 * dragging the band between them moves both, keeping the width. The two
 * numeric fields are authoritative, as in `ValueSlider`.
 */
export function RangeValueSlider({ id, label, low, high, min, max, unit, onChange, lowLabel, highLabel, swapInputs = false, step, testId }: RangeValueSliderProps) {
  const snap = step ?? (unit === "mm" ? 0.01 : 0.1);
  const { trackRef, valueAt } = useTrackPointer(min, max, snap);
  const lowPct = percentOf(low, min, max);
  const highPct = percentOf(high, min, max);

  const drag = (event: PointerEvent<HTMLElement>, apply: (value: number, startValue: number) => void) => {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    const startValue = valueAt(event.clientX);
    const move = (e: globalThis.PointerEvent) => apply(valueAt(e.clientX), startValue);
    const end = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", end);
      target.removeEventListener("pointercancel", end);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", end);
    target.addEventListener("pointercancel", end);
    return startValue;
  };

  const setLow = (value: number) => onChange(Math.min(value, high), high);
  const setHigh = (value: number) => onChange(low, Math.max(value, low));

  const onTrackDown = (event: PointerEvent<HTMLDivElement>) => {
    const at = valueAt(event.clientX);
    const nearLow = Math.abs(at - low) <= Math.abs(at - high);
    if (nearLow) {
      setLow(at);
      drag(event, (v) => setLow(v));
    } else {
      setHigh(at);
      drag(event, (v) => setHigh(v));
    }
  };

  const onBandDown = (event: PointerEvent<HTMLSpanElement>) => {
    const [low0, high0] = [low, high];
    drag(event, (v, start) => {
      const delta = Math.round((v - start) * 1e9) / 1e9;
      onChange(low0 + delta, high0 + delta);
    });
  };

  const lowInput = (
    <div className="space-y-0.5 min-w-0" key="low">
      <label htmlFor={`${id}-low`} className={FIELD_LABEL}>
        {lowLabel}
      </label>
      <PrecisionNumberInput id={`${id}-low`} testId={`${testId}-low-input`} value={low} unit={unit} onChange={(v) => onChange(Math.min(v, high), high)} />
    </div>
  );
  const highInput = (
    <div className="space-y-0.5 min-w-0" key="high">
      <label htmlFor={`${id}-high`} className={FIELD_LABEL}>
        {highLabel}
      </label>
      <PrecisionNumberInput id={`${id}-high`} testId={`${testId}-high-input`} value={high} unit={unit} onChange={(v) => onChange(low, Math.max(v, low))} />
    </div>
  );

  return (
    <div className="space-y-1 min-w-0" data-testid={testId} role="group" aria-label={label}>
      <span className={FIELD_LABEL}>{label}</span>
      <div className="grid grid-cols-2 gap-3">{swapInputs ? [highInput, lowInput] : [lowInput, highInput]}</div>
      <Track
        trackRef={trackRef}
        testId={`${testId}-track`}
        onPointerDown={onTrackDown}
        overlay={
          <>
            <ValueBadge align="low" percent={lowPct} testId={`${testId}-low-badge`}>
              {formatValue(low, unit, DISPLAY_DP[unit].rest)}
            </ValueBadge>
            <ValueBadge align="high" percent={highPct} testId={`${testId}-high-badge`}>
              {formatValue(high, unit, DISPLAY_DP[unit].rest)}
            </ValueBadge>
            <ValueMarker percent={lowPct} />
            <ValueMarker percent={highPct} />
          </>
        }
      >
        <span
          data-testid={`${testId}-band`}
          onPointerDown={onBandDown}
          className="absolute top-1/2 h-1.5 -translate-y-1/2 cursor-grab touch-none bg-foreground active:cursor-grabbing"
          style={{ left: `${lowPct}%`, width: `${Math.max(0, highPct - lowPct)}%` }}
        />
        <Handle percent={lowPct} value={low} min={min} max={max} unit={unit} label={lowLabel} testId={`${testId}-low-handle`} onStep={setLow} onPointerDown={(e) => drag(e, (v) => setLow(v))} />
        <Handle percent={highPct} value={high} min={min} max={max} unit={unit} label={highLabel} testId={`${testId}-high-handle`} onStep={setHigh} onPointerDown={(e) => drag(e, (v) => setHigh(v))} />
      </Track>
    </div>
  );
}
