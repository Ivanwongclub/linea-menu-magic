import { tradeLigne } from "../lib/ligne";

interface MeasurementLineProps {
  productName: string;
  sizePrimaryMm: number;
  sizeLigne: number | null;
  /** A labelled variant is non-round hardware by definition — no ligne (R3). */
  sizeLabel: string | null;
}

/** e.g. "Button 15 mm (24L)" — axis-design §7. Ligne only for buttons (R3). */
export function MeasurementLine({ productName, sizePrimaryMm, sizeLigne, sizeLabel }: MeasurementLineProps) {
  const mm = Number(sizePrimaryMm.toFixed(2));
  const ligneText = !sizeLabel && sizeLigne != null ? ` (${tradeLigne(sizeLigne)}L)` : "";
  return (
    <div className="px-6 py-2 border-t border-border text-xs text-muted-foreground tracking-wide">
      {productName} {mm} mm{ligneText}
    </div>
  );
}
