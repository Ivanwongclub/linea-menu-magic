interface MeasurementLineProps {
  productName: string;
  sizePrimaryMm: number;
  sizeLigne: number | null;
}

/** e.g. "Button 15 mm (24L)" — axis-design §7. */
export function MeasurementLine({ productName, sizePrimaryMm, sizeLigne }: MeasurementLineProps) {
  const mm = Number(sizePrimaryMm.toFixed(2));
  const ligneText = sizeLigne != null ? ` (${Number(sizeLigne.toFixed(1))}L)` : "";
  return (
    <div className="px-6 py-2 border-t border-border text-xs text-muted-foreground tracking-wide">
      {productName} {mm} mm{ligneText}
    </div>
  );
}
