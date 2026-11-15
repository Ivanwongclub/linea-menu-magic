import { useEffect, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Vector3, type Group } from "three";
import { tradeLigne } from "../lib/ligne";
import { layoutLabels, type DimensionLine, type LabelItem, type Point, type Rect } from "../lib/rulerLabelLayout";
import { layerDimensions, type LayerDimension } from "../lib/layerMeasurements";
import type { Layer } from "../lib/recipe";
import { useI18n } from "@/features/i18n/I18nProvider";
import type { PartBoundsMm, RulerMeasurements } from "./EditorModel";
import type { ReliefReport } from "./branding/BrandingMeshes";
import { layerRelief } from "../lib/recipe";

/** The DOM label elements (rendered by `RulerLabels` outside the canvas) this overlay positions each frame. */
export interface RulerLabelElements {
  diameter: HTMLElement | null;
  thickness: HTMLElement | null;
  axisX: HTMLElement | null;
  axisY: HTMLElement | null;
  axisZ: HTMLElement | null;
  /** The selected layer's dimensions (4j), by kind. */
  layer: Partial<Record<LayerDimension["kind"], HTMLElement | null>>;
  /** The relief callout (Phase 5 R4). */
  relief: HTMLElement | null;
}

export function newRulerLabelElements(): RulerLabelElements {
  return { diameter: null, thickness: null, axisX: null, axisY: null, axisZ: null, layer: {}, relief: null };
}

interface RulerOverlayProps {
  measurements: RulerMeasurements;
  labels: MutableRefObject<RulerLabelElements>;
  /** Screen rects the labels must keep clear of — the on-model handles (4i). */
  obstacles?: MutableRefObject<{ rects: Rect[] }>;
  /** The selected layer, whose dimensions join the product's (4j R5); none when nothing is selected. */
  layer: Layer | null;
  /** When a part is selected, its own box replaces the whole-model diameter / thickness. */
  partBounds?: PartBoundsMm | null;
  /** The face top, where the layer's dimension lines are drawn. */
  faceZ: number;
  /** What the selected layer's relief became on screen, and where it stands (Phase 5 R4). */
  relief: ReliefReport | null;
}

/** Render layer the ruler lives on exclusively (C5) — never layer 0. */
const RULER_LAYER = 1;
const TICK_MM = 0.6;
const MARGIN_MM = 1.2;

/**
 * The relief callout's two ends: the point the layer stands on, and that point
 * plus its own normal times the relief — up for a raised layer, into the part
 * for an engraved one (R4).
 */
export function reliefCallout(layer: Layer | null, relief: ReliefReport | null): [number, number, number][] | null {
  if (!layer || !relief?.anchor) return null;
  const { depth_mm, type } = layerRelief(layer);
  if (!(depth_mm > 0)) return null;
  const a = relief.anchor;
  const reach = type === "emboss" ? depth_mm : -depth_mm;
  return [
    [a.x, a.y, a.z],
    [a.x + a.nx * reach, a.y + a.ny * reach, a.z + a.nz * reach],
  ];
}

export function diameterLabel(mm: number, sizeLigne: number | null, sizeLabel: string | null): string {
  const ligneText = !sizeLabel && sizeLigne != null ? ` (${tradeLigne(sizeLigne)}L)` : "";
  return `${mm.toFixed(2)} mm${ligneText}`;
}

function axisLines(box: PartBoundsMm) {
  const { minX, maxX, minY, maxY, minZ, maxZ } = box;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const xY = minY - MARGIN_MM;
  const yX = minX - MARGIN_MM;
  const zX = maxX + MARGIN_MM;
  return {
    size: { x: maxX - minX, y: maxY - minY, z: maxZ - minZ },
    x: [[minX, xY, cz], [maxX, xY, cz]] as [number, number, number][],
    xTickA: [[minX, xY - TICK_MM, cz], [minX, xY + TICK_MM, cz]] as [number, number, number][],
    xTickB: [[maxX, xY - TICK_MM, cz], [maxX, xY + TICK_MM, cz]] as [number, number, number][],
    y: [[yX, minY, cz], [yX, maxY, cz]] as [number, number, number][],
    yTickA: [[yX - TICK_MM, minY, cz], [yX + TICK_MM, minY, cz]] as [number, number, number][],
    yTickB: [[yX - TICK_MM, maxY, cz], [yX + TICK_MM, maxY, cz]] as [number, number, number][],
    z: [[zX, cy, minZ], [zX, cy, maxZ]] as [number, number, number][],
    zTickA: [[zX - TICK_MM, cy, minZ], [zX + TICK_MM, cy, minZ]] as [number, number, number][],
    zTickB: [[zX - TICK_MM, cy, maxZ], [zX + TICK_MM, cy, maxZ]] as [number, number, number][],
    centre: [cx, cy, cz] as [number, number, number],
  };
}

/**
 * Selected part → that part's X / Y / Z. Selected branding layer → that
 * layer's face measures. Nothing selected → the whole model's X / Y / Z.
 */
export function RulerOverlay({ measurements, labels, obstacles, layer, partBounds, faceZ, relief }: RulerOverlayProps) {
  const { camera, size } = useThree();
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    camera.layers.enable(RULER_LAYER);
    const group = groupRef.current;
    if (group) {
      group.traverse((child) => {
        child.layers.set(RULER_LAYER);
        child.raycast = () => {};
      });
    }
  });

  const layerMode = !partBounds && !!layer;
  const box: PartBoundsMm | null = layerMode
    ? null
    : partBounds ?? {
        minX: measurements.minX,
        maxX: measurements.maxX,
        minY: measurements.minY,
        maxY: measurements.maxY,
        minZ: measurements.minZ,
        maxZ: measurements.maxZ,
      };
  const axes = box ? axisLines(box) : null;
  const faceRadius = measurements.diameterMm / 2;
  const dims = layerMode ? layerDimensions(layer!, faceRadius) : [];
  const lift = faceZ + 0.05;
  const dimPoints = (d: LayerDimension): [number, number, number][] => [
    [d.from.x, d.from.y, lift],
    [d.to.x, d.to.y, lift],
  ];
  const reliefLinePoints = layerMode ? reliefCallout(layer, relief) : null;

  const scratch = useRef(new Vector3());
  const last = useRef("");
  useFrame(() => {
    const project = ([x, y, z]: [number, number, number]): Point => {
      const v = scratch.current.set(x, y, z).project(camera);
      return { x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height };
    };
    const line = (points: [number, number, number][], el: HTMLElement): DimensionLine => ({
      a: project(points[0]),
      b: project(points[1]),
      width: el.offsetWidth,
      height: el.offsetHeight,
    });
    const entries: [HTMLElement, DimensionLine, LabelItem["place"]][] = [];
    if (axes) {
      const { axisX, axisY, axisZ } = labels.current;
      if (axisX) entries.push([axisX, line(axes.x, axisX), "below"]);
      if (axisY) entries.push([axisY, line(axes.y, axisY), "beside"]);
      if (axisZ) entries.push([axisZ, line(axes.z, axisZ), "beside"]);
    } else {
      for (const el of [labels.current.axisX, labels.current.axisY, labels.current.axisZ]) {
        if (el) el.style.visibility = "hidden";
      }
    }
    for (const dim of dims) {
      const el = labels.current.layer[dim.kind];
      if (el) entries.push([el, line(dimPoints(dim), el), "beside"]);
    }
    const reliefLabel = labels.current.relief;
    if (reliefLabel && reliefLinePoints) entries.push([reliefLabel, line(reliefLinePoints, reliefLabel), "beside"]);
    if (!entries.length) return;
    const centre = project(axes?.centre ?? [layer!.placement.centre_mm.x, layer!.placement.centre_mm.y, faceZ]);
    const placed = layoutLabels(
      entries.map(([, l, place]) => ({ line: l, place })),
      centre,
      obstacles?.current.rects ?? [],
    );
    const key = JSON.stringify(placed);
    if (key === last.current) return;
    last.current = key;
    entries.forEach(([el, own], i) => {
      const rect = placed[i];
      el.style.transform = `translate(${Math.round(rect.x)}px, ${Math.round(rect.y)}px)`;
      el.style.visibility = "visible";
      el.dataset.line = JSON.stringify({ a: own.a, b: own.b });
    });
  });

  return (
    <group ref={groupRef}>
      {axes && (
        <>
          <Line points={axes.x} color="#c62828" lineWidth={1.5} />
          <Line points={axes.xTickA} color="#c62828" lineWidth={1.5} />
          <Line points={axes.xTickB} color="#c62828" lineWidth={1.5} />
          <Line points={axes.y} color="#2e7d32" lineWidth={1.5} />
          <Line points={axes.yTickA} color="#2e7d32" lineWidth={1.5} />
          <Line points={axes.yTickB} color="#2e7d32" lineWidth={1.5} />
          <Line points={axes.z} color="#1565c0" lineWidth={1.5} />
          <Line points={axes.zTickA} color="#1565c0" lineWidth={1.5} />
          <Line points={axes.zTickB} color="#1565c0" lineWidth={1.5} />
        </>
      )}
      {reliefLinePoints && <Line points={reliefLinePoints} color="#1a1a1a" lineWidth={1.5} depthTest={false} />}
      {dims.map((dim) => (
        <Line key={dim.kind} points={dimPoints(dim)} color="#1a1a1a" lineWidth={1.25} dashed dashSize={0.2} gapSize={0.12} depthTest={false} />
      ))}
    </group>
  );
}

interface RulerLabelsProps {
  measurements: RulerMeasurements;
  sizeLigne: number | null;
  /** A labelled variant is non-round hardware by definition — no ligne (R3, moved from `MeasurementLine`). */
  sizeLabel: string | null;
  labels: MutableRefObject<RulerLabelElements>;
  layer: Layer | null;
  partBounds?: PartBoundsMm | null;
  relief: ReliefReport | null;
}

const LAYER_LABEL_KEY: Record<LayerDimension["kind"], string> = {
  brandingRadius: "editor.ruler.brandingRadius",
  letterHeight: "editor.ruler.letterHeight",
  edgeMargin: "editor.ruler.edgeMargin",
  logoWidth: "editor.ruler.logoWidth",
  logoHeight: "editor.ruler.logoHeight",
};

const LAYER_LABEL_TESTID: Record<LayerDimension["kind"], string> = {
  brandingRadius: "ruler-branding-radius-label",
  letterHeight: "ruler-letter-height-label",
  edgeMargin: "ruler-edge-margin-label",
  logoWidth: "ruler-logo-width-label",
  logoHeight: "ruler-logo-height-label",
};

const LABEL_CLASS =
  "absolute left-0 top-0 text-[11px] whitespace-nowrap bg-background/90 px-1 py-0.5 border border-border text-foreground will-change-transform";

/** The ruler's DOM labels, over the canvas; `RulerOverlay` positions them. Hidden until first placed. */
export function RulerLabels({ measurements, sizeLigne, sizeLabel, labels, layer, partBounds, relief }: RulerLabelsProps) {
  const { t } = useI18n();
  const layerMode = !partBounds && !!layer;
  const dims = layerMode ? layerDimensions(layer!, measurements.diameterMm / 2) : [];
  const reliefDepth = layerMode && relief?.anchor ? layerRelief(layer!) : null;
  const axes = layerMode
    ? null
    : axisLines(partBounds ?? {
        minX: measurements.minX,
        maxX: measurements.maxX,
        minY: measurements.minY,
        maxY: measurements.maxY,
        minZ: measurements.minZ,
        maxZ: measurements.maxZ,
      });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" data-testid="ruler-labels" data-mode={partBounds ? "part-axes" : layerMode ? "layer" : "product-axes"}>
      {axes && (
        <>
          <span ref={(el) => (labels.current.axisX = el)} className={LABEL_CLASS} style={{ visibility: "hidden" }} data-testid="ruler-axis-x" data-value-mm={axes.size.x}>{t("editor.ruler.axisX", { value: `${axes.size.x.toFixed(2)} mm` })}</span>
          <span ref={(el) => (labels.current.axisY = el)} className={LABEL_CLASS} style={{ visibility: "hidden" }} data-testid="ruler-axis-y" data-value-mm={axes.size.y}>{t("editor.ruler.axisY", { value: `${axes.size.y.toFixed(2)} mm` })}</span>
          <span ref={(el) => (labels.current.axisZ = el)} className={LABEL_CLASS} style={{ visibility: "hidden" }} data-testid="ruler-axis-z" data-value-mm={axes.size.z}>{t("editor.ruler.axisZ", { value: `${axes.size.z.toFixed(2)} mm` })}</span>
        </>
      )}
      {reliefDepth && (
        <span ref={(el) => (labels.current.relief = el)} className={LABEL_CLASS} style={{ visibility: "hidden" }} data-testid="ruler-relief-label" data-relief={reliefDepth.type} data-value-mm={reliefDepth.depth_mm}>
          {t(reliefDepth.type === "emboss" ? "editor.ruler.embossHeight" : "editor.ruler.engraveDepth", { value: `${reliefDepth.depth_mm.toFixed(2)} mm` })}
        </span>
      )}
      {dims.map((dim) => (
        <span key={`${layer?.id}-${dim.kind}`} ref={(el) => (labels.current.layer[dim.kind] = el)} className={LABEL_CLASS} style={{ visibility: "hidden" }} data-testid={LAYER_LABEL_TESTID[dim.kind]} data-value-mm={dim.valueMm}>
          {t(LAYER_LABEL_KEY[dim.kind], { value: `${dim.valueMm.toFixed(2)} mm` })}
        </span>
      ))}
      <span ref={(el) => (labels.current.diameter = el)} className="hidden" data-testid="ruler-diameter-label" aria-hidden="true">{diameterLabel(measurements.diameterMm, sizeLigne, sizeLabel)}</span>
      <span ref={(el) => (labels.current.thickness = el)} className="hidden" data-testid="ruler-thickness-label" aria-hidden="true">{measurements.thicknessMm.toFixed(2)} mm</span>
    </div>
  );
}
