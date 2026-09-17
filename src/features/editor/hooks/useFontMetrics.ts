import { useEffect, useState } from "react";
import { loadBundledFont } from "../lib/fonts";
import type { TypefaceMetrics } from "../lib/textLayout";

/** The bundled font's advances for panel maths (C7's preserve-radius spacing); null until loaded. */
export function useFontMetrics(key: string): TypefaceMetrics | null {
  const [metrics, setMetrics] = useState<{ key: string; data: TypefaceMetrics } | null>(null);
  useEffect(() => {
    let live = true;
    loadBundledFont(key).then(
      (font) => live && setMetrics({ key, data: font.data as unknown as TypefaceMetrics }),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [key]);
  return metrics?.key === key ? metrics.data : null;
}
