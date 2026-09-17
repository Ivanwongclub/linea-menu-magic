/**
 * C3 precision: what the panel displays and how far one key press moves a
 * value (addendum §7). The recipe stores unrounded floats; only the display
 * rounds.
 */
export type ValueUnit = "mm" | "deg";

export const UNIT_SUFFIX: Record<ValueUnit, string> = { mm: "mm", deg: "°" };

/** Decimal places at rest and while the field is focused. */
export const DISPLAY_DP: Record<ValueUnit, { rest: number; focused: number }> = {
  mm: { rest: 2, focused: 3 },
  deg: { rest: 1, focused: 2 },
};

/** Arrow / Shift+Arrow / Alt+Arrow. */
export const KEY_STEPS: Record<ValueUnit, { base: number; shift: number; alt: number }> = {
  mm: { base: 0.01, shift: 0.1, alt: 0.001 },
  deg: { base: 0.1, shift: 1, alt: 0.01 },
};

export function keyStep(unit: ValueUnit, event: { shiftKey: boolean; altKey: boolean }): number {
  const steps = KEY_STEPS[unit];
  return event.altKey ? steps.alt : event.shiftKey ? steps.shift : steps.base;
}

/** Adds a key step without leaving binary noise behind (3.63 + 0.01 stores 3.64, not 3.6399999999999997). */
export function stepValue(value: number, delta: number): number {
  return Math.round((value + delta) * 1e9) / 1e9;
}

export function clamp(value: number, min: number | undefined, max: number | undefined): number {
  let v = value;
  if (min !== undefined && v < min) v = min;
  if (max !== undefined && v > max) v = max;
  return v;
}

/** The arrow keys a numeric control answers to, as a signed direction. */
export function arrowDirection(key: string): 1 | -1 | 0 {
  if (key === "ArrowUp" || key === "ArrowRight") return 1;
  if (key === "ArrowDown" || key === "ArrowLeft") return -1;
  return 0;
}
