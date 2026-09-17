/**
 * The manufacturing strip's checks (v3-review §5, Phase 5 R3): WIN-CYC's own
 * tolerances per process — never the buyer's — against the layers on the face.
 *
 * Pure: thresholds and measured values in, translation keys out. The strip
 * component measures the geometry (stroke widths) and formats; the node tests
 * drive this directly.
 */
import { isLogoLayer, layerRelief, type Layer } from "./recipe.ts";
import { edgeMarginMm } from "./layerMeasurements.ts";

/** `finish_processes`' three tolerance columns (Phase 1 R3); any of them may be null. */
export interface ProcessThresholds {
  /** Localised, for the message. */
  name: string;
  min_feature_mm: number | null;
  min_deboss_depth_mm: number | null;
  max_deboss_depth_mm: number | null;
}

/** The process axis as the finish query returns it. */
export interface ProcessRow {
  name: string;
  name_zh_hant: string | null;
  name_zh_hans: string | null;
  min_feature_mm: number | null;
  min_deboss_depth_mm: number | null;
  max_deboss_depth_mm: number | null;
}

/** The selected finish's process, named in the interface language (no i18n dictionary — the name is data). */
export function processThresholds(process: ProcessRow | null | undefined, language: "en" | "zh-Hant" | "zh-Hans"): ProcessThresholds | null {
  if (!process) return null;
  const name = (language === "zh-Hant" ? process.name_zh_hant : language === "zh-Hans" ? process.name_zh_hans : process.name) || process.name;
  return {
    name,
    min_feature_mm: process.min_feature_mm,
    min_deboss_depth_mm: process.min_deboss_depth_mm,
    max_deboss_depth_mm: process.max_deboss_depth_mm,
  };
}

/** Bare face the branding must leave around itself. Not a process tolerance — geometry (R3). */
export const MIN_EDGE_MARGIN_MM = 0.5;

export interface ManufacturingWarning {
  layerId: string;
  kind: "stroke" | "depthMin" | "depthMax" | "edgeMargin";
  /** Translation key, with `{value}`, `{limit}` and `{process}` already measured. */
  key: string;
  valueMm: number;
  limitMm: number;
}

export interface LayerMeasure {
  layer: Layer;
  /** Narrowest stroke of the layer's own geometry, mm — null while the font or artwork is still loading. */
  strokeMm: number | null;
}

export function hasThresholds(process: ProcessThresholds | null): boolean {
  return !!process && (process.min_feature_mm != null || process.min_deboss_depth_mm != null || process.max_deboss_depth_mm != null);
}

/**
 * Every warning the strip would show, in layer order. A null threshold is not
 * a pass — that check simply cannot be made, and the strip says so to staff.
 */
export function manufacturingWarnings(
  measures: LayerMeasure[],
  process: ProcessThresholds | null,
  faceRadiusMm: number | null,
): ManufacturingWarning[] {
  const out: ManufacturingWarning[] = [];
  for (const { layer, strokeMm } of measures) {
    if (!layer.visible) continue;
    const relief = layerRelief(layer);
    const deboss = relief.type === "deboss";

    if (process?.min_feature_mm != null && strokeMm != null && strokeMm < process.min_feature_mm) {
      out.push({
        layerId: layer.id,
        kind: "stroke",
        key: isLogoLayer(layer) ? "editor.manufacturing.logoStroke" : "editor.manufacturing.letterStroke",
        valueMm: strokeMm,
        limitMm: process.min_feature_mm,
      });
    }
    if (process?.min_deboss_depth_mm != null && relief.depth_mm < process.min_deboss_depth_mm) {
      out.push({
        layerId: layer.id,
        kind: "depthMin",
        key: deboss ? "editor.manufacturing.engraveDepthMin" : "editor.manufacturing.embossHeightMin",
        valueMm: relief.depth_mm,
        limitMm: process.min_deboss_depth_mm,
      });
    }
    // 5b R3 (Phase 5 Q1): the maximum is how deep a recess may be cut — it
    // says nothing about how proud a raised layer may stand, so it is checked
    // on engraved layers only.
    if (deboss && process?.max_deboss_depth_mm != null && relief.depth_mm > process.max_deboss_depth_mm) {
      out.push({
        layerId: layer.id,
        kind: "depthMax",
        key: "editor.manufacturing.engraveDepthMax",
        valueMm: relief.depth_mm,
        limitMm: process.max_deboss_depth_mm,
      });
    }
    if (faceRadiusMm != null && faceRadiusMm > 0) {
      const margin = edgeMarginMm(layer, faceRadiusMm);
      if (margin < MIN_EDGE_MARGIN_MM) {
        out.push({ layerId: layer.id, kind: "edgeMargin", key: "editor.manufacturing.edgeMargin", valueMm: margin, limitMm: MIN_EDGE_MARGIN_MM });
      }
    }
  }
  return out;
}

/** mm at 2 dp, as the strip and the ruler both write it. */
export const formatMm = (mm: number): string => `${mm.toFixed(2)} mm`;
