/** The button trade's ligne series. */
const TRADE_LIGNES = [14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 40, 44, 48, 54, 60];

/**
 * Display only (R7): `size_ligne` is computed as mm / 0.635 and stays that
 * way; buttons are specified in trade sizes, so 23.6L reads as "24L".
 */
export function tradeLigne(sizeLigne: number): number {
  return TRADE_LIGNES.reduce((best, l) => (Math.abs(l - sizeLigne) < Math.abs(best - sizeLigne) ? l : best), TRADE_LIGNES[0]);
}
