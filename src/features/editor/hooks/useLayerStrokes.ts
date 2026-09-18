import { useEffect, useMemo, useState } from "react";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { loadBundledFont } from "../lib/fonts";
import { glyphOutlines } from "../lib/glyphOutlines";
import { logoOutlines, parseLogoSvg, type LogoArtwork } from "../lib/logoGeometry";
import { isLogoLayer, isTextLayer, type Layer } from "../lib/recipe";
import { glyphChar, straightReachMm, type TypefaceMetrics } from "../lib/textLayout";
import { minStrokeWidth, type Outline } from "../lib/strokeWidth";
import type { LogoSource } from "./useLogoAssets";

/**
 * The narrowest stroke in each layer's own geometry, mm (Phase 5 R3) — what
 * the manufacturing strip checks against the process's `min_feature_mm`.
 *
 * Measured once per glyph and per artwork at unit size and cached, because
 * stroke width scales exactly with the layer's size: dragging the text size
 * or the logo width is a multiplication, not a re-measure.
 */
const glyphStrokes = new Map<string, number | null>();
const logoStrokes = new Map<string, number | null>();
const artworks = new Map<string, LogoArtwork | null>();

const asOutline = (o: { outer: { x: number; y: number }[]; holes: { x: number; y: number }[][] }): Outline => ({
  outer: o.outer.map((p) => [p.x, p.y] as [number, number]),
  holes: o.holes.map((h) => h.map((p) => [p.x, p.y] as [number, number])),
});

/** Cap height 1: the layer's own size multiplies it. */
function glyphStroke(font: Font, fontKey: string, char: string): number | null {
  const key = `${fontKey}|${char}`;
  if (!glyphStrokes.has(key)) glyphStrokes.set(key, minStrokeWidth(glyphOutlines(font, char, 1).map(asOutline)));
  return glyphStrokes.get(key) ?? null;
}

/** Width 1: the layer's own width multiplies it. */
function logoStroke(svg: string): number | null {
  if (!artworks.has(svg)) artworks.set(svg, parseLogoSvg(svg));
  const artwork = artworks.get(svg);
  if (!artwork) return null;
  if (!logoStrokes.has(svg)) logoStrokes.set(svg, minStrokeWidth(logoOutlines(artwork, 1).map(asOutline)));
  return logoStrokes.get(svg) ?? null;
}

export interface LayerMeasurement {
  /** Narrowest stroke, mm — null while the artwork or font is still loading. */
  strokeMm: number | null;
  /** How far the layer reaches from the face centre, mm (6b R5); null when the shape decides it. */
  reachMm: number | null;
}

export function useLayerStrokes(layers: Layer[], logoSources: Record<string, LogoSource>): Record<string, LayerMeasurement> {
  const [fonts, setFonts] = useState<Record<string, Font>>({});
  const fontKeys = useMemo(() => [...new Set(layers.filter(isTextLayer).map((l) => l.content.font.key))].sort().join("|"), [layers]);

  useEffect(() => {
    let cancelled = false;
    for (const key of fontKeys ? fontKeys.split("|") : []) {
      if (fonts[key]) continue;
      loadBundledFont(key).then(
        (font) => !cancelled && setFonts((prev) => ({ ...prev, [key]: font })),
        () => undefined,
      );
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontKeys]);

  return useMemo(() => {
    const out: Record<string, LayerMeasurement> = {};
    for (const layer of layers) {
      if (isLogoLayer(layer)) {
        const source = logoSources[layer.id];
        // A raster has no outline: its stroke cannot be measured, so the strip
        // says nothing about it rather than guessing (Phase 6a R4).
        const unit = source?.kind === "svg" ? logoStroke(source.svg) : null;
        out[layer.id] = { strokeMm: unit == null ? null : unit * layer.content.width_mm, reachMm: null };
        continue;
      }
      if (!isTextLayer(layer)) continue;
      const font = fonts[layer.content.font.key];
      if (!font) {
        out[layer.id] = { strokeMm: null, reachMm: null };
        continue;
      }
      const metrics = font.data as unknown as TypefaceMetrics;
      const reachMm = layer.placement.layout === "straight" ? straightReachMm(metrics, layer) : null;
      let narrowest: number | null = null;
      for (const raw of Array.from(layer.content.value)) {
        const char = glyphChar(metrics, raw);
        if (!char.trim()) continue;
        const unit = glyphStroke(font, layer.content.font.key, char);
        if (unit == null) continue;
        narrowest = narrowest == null ? unit : Math.min(narrowest, unit);
      }
      out[layer.id] = { strokeMm: narrowest == null ? null : narrowest * layer.style.text_size_mm, reachMm };
    }
    return out;
  }, [layers, logoSources, fonts]);
}
