import { useEffect, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Vector3, type Group } from "three";
import { tradeLigne } from "../lib/ligne";
import { layoutLabels, type DimensionLine, type LabelItem, type Point, type Rect } from "../lib/rulerLabelLayout";
import { layerDimensions, type LayerDimension } from "../lib/layerMeasurements";
import type { Layer } from "../lib/recipe";
import { useI18n } from "@/features/i18n/I18nProvider";
import type { RulerMeasurements } from "./EditorModel";

/** The DOM label elements (rendered by `RulerLabels` outside the canvas) this overlay positions each frame. */
export interface RulerLabelElements {
  diameter: HTMLElement | null;
  thickness: HTMLElement | null;
  /** The selected layer's dimensions (4j), by kind. */
  layer: Partial<Record<LayerDimension["kind"], HTMLElement | null>>;
}

export function newRulerLabelElements(): RulerLabelElements {
  return { diameter: null, thickness: null, layer: {} };
}

interface RulerOverlayProps {
  measurements: RulerMeasurements;
  labels: MutableRefObject<RulerLabelElements>;
  /** Screen rects the labels must keep clear of — the on-model handles (4i). */
  obstacles?: MutableRefObject<{ rects: Rect[] }>;
  /** The selected layer, whose dimensions join the product's (4j R5); none when nothing is selected. */
  layer: Layer | null;
  /** The face top, where the layer's dimension lines are drawn. */
  faceZ: number;
}

/** Render layer the ruler lives on exclusively (C5) — never layer 0. */
const RULER_LAYER = 1;
const TICK_MM = 0.6;
const MARGIN_MM = 1.2;

export function diameterLabel(mm: number, sizeLigne: number | null, sizeLabel: string | null): string {
  const ligneText = !sizeLabel && sizeLigne != null ? ` (${tradeLigne(sizeLigne)}L)` : "";
  return `${mm.toFixed(2)} mm${ligneText}`;
}

/**
 * The product's diameter and thickness (E1 §5 row 4e), plus — for the
 * selected layer only — its branding radius, letter height and edge margin
 * (4j R5), drawn on the face. C5:
 * helper lines as screen-space `Line2` (drei's `Line`, `worldUnits` off by
 * default) on render layer 1, so they're excluded from `ContactShadows` (its
 * shadow camera stays on layer 0), raycasts (the default `Raycaster` stays
 * on layer 0) and any future exporter (which walks `EditorModel`'s own
 * object, never this sibling group). Never geometry.
 *
 * R2 (4h): the labels are plain DOM over the canvas, placed per frame in
 * screen space by `layoutRulerLabels` — the diameter label centred below its
 * line, the thickness label beside its own line away from the model, and
 * pushed apart when they would overlap. Each label carries the projected line
 * it belongs to (`data-line`) for the e2e no-overlap check.
 */
export function RulerOverlay({ measurements, labels, obstacles, layer, faceZ }: RulerOverlayProps) {
  const { camera, size } = useThree();
  const groupRef = useRef<Group>(null);

  // Every render: the layer's lines mount and unmount with the selection,
  // and each must land on the ruler layer.
  useEffect(() => {
    camera.layers.enable(RULER_LAYER);
    const group = groupRef.current;
    if (group) {
      group.traverse((child) => {
        child.layers.set(RULER_LAYER);
        // Dimension lines are UI, never a raycast/selection target.
        child.raycast = () => {};
      });
    }
  });

  const faceRadius = measurements.diameterMm / 2;
  const dims = layer ? layerDimensions(layer, faceRadius) : [];
  const lift = faceZ + 0.05;
  const dimPoints = (d: LayerDimension): [number, number, number][] => [
    [d.from.x, d.from.y, lift],
    [d.to.x, d.to.y, lift],
  ];

  const { minX, maxX, minY, maxY, minZ, maxZ } = measurements;
  // Opposite sides: the diameter line (below, or left when it runs along Y)
  // and the thickness line (right) never share a corner.
  const thicknessX = maxX + MARGIN_MM;
  const centerZ = (minZ + maxZ) / 2;
  const centerY = (minY + maxY) / 2;

  // The diameter line follows whichever in-face axis is actually the larger
  // one — `diameterMm` is `max(sizeX, sizeY)` (EditorModel) — preferring X
  // for a round part, whose two extents differ only by tessellation.
  const diameterAlongX = maxX - minX >= (maxY - minY) * 0.99;
  const diameterY = minY - MARGIN_MM;
  const diameterX = minX - MARGIN_MM;
  const diameterLinePoints: [number, number, number][] = diameterAlongX
    ? [[minX, diameterY, 0], [maxX, diameterY, 0]]
    : [[diameterX, minY, 0], [diameterX, maxY, 0]];
  const diameterTick = (mainAxisValue: number): [number, number, number][] =>
    diameterAlongX
      ? [
          [mainAxisValue, diameterY - TICK_MM, 0],
          [mainAxisValue, diameterY + TICK_MM, 0],
        ]
      : [
          [diameterX - TICK_MM, mainAxisValue, 0],
          [diameterX + TICK_MM, mainAxisValue, 0],
        ];
  const thicknessPoints: [number, number, number][] = [
    [thicknessX, centerY, minZ],
    [thicknessX, centerY, maxZ],
  ];

  const scratch = useRef(new Vector3());
  const last = useRef("");
  useFrame(() => {
    const { diameter, thickness } = labels.current;
    if (!diameter || !thickness) return;
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
    const d = line(diameterLinePoints, diameter);
    const t = line(thicknessPoints, thickness);
    const centre = project([(minX + maxX) / 2, centerY, centerZ]);
    const entries: [HTMLElement, DimensionLine, LabelItem["place"]][] = [
      [diameter, d, "below"],
      [thickness, t, "beside"],
    ];
    for (const dim of dims) {
      const el = labels.current.layer[dim.kind];
      if (el) entries.push([el, line(dimPoints(dim), el), "beside"]);
    }
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
      {/* Diameter: the larger model-local in-face axis (C4). */}
      <Line points={diameterLinePoints} color="#1a1a1a" lineWidth={1.5} />
      <Line points={diameterTick(diameterAlongX ? minX : minY)} color="#1a1a1a" lineWidth={1.5} />
      <Line points={diameterTick(diameterAlongX ? maxX : maxY)} color="#1a1a1a" lineWidth={1.5} />

      {/* Thickness: model-local Z extent (the decorated face's normal axis), shown to the side. */}
      <Line points={thicknessPoints} color="#1a1a1a" lineWidth={1.5} />
      <Line points={[[thicknessX - TICK_MM, centerY, minZ], [thicknessX + TICK_MM, centerY, minZ]]} color="#1a1a1a" lineWidth={1.5} />
      <Line points={[[thicknessX - TICK_MM, centerY, maxZ], [thicknessX + TICK_MM, centerY, maxZ]]} color="#1a1a1a" lineWidth={1.5} />

      {/* The selected layer's dimensions, on the face (4j R5). */}
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
export function RulerLabels({ measurements, sizeLigne, sizeLabel, labels, layer }: RulerLabelsProps) {
  const { t } = useI18n();
  const dims = layer ? layerDimensions(layer, measurements.diameterMm / 2) : [];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" data-testid="ruler-labels">
      <span
        ref={(el) => (labels.current.diameter = el)}
        className={LABEL_CLASS}
        style={{ visibility: "hidden" }}
        data-testid="ruler-diameter-label"
      >
        {diameterLabel(measurements.diameterMm, sizeLigne, sizeLabel)}
      </span>
      <span
        ref={(el) => (labels.current.thickness = el)}
        className={LABEL_CLASS}
        style={{ visibility: "hidden" }}
        data-testid="ruler-thickness-label"
      >
        {measurements.thicknessMm.toFixed(2)} mm
      </span>
      {dims.map((dim) => (
        <span
          key={`${layer?.id}-${dim.kind}`}
          ref={(el) => (labels.current.layer[dim.kind] = el)}
          className={LABEL_CLASS}
          style={{ visibility: "hidden" }}
          data-testid={LAYER_LABEL_TESTID[dim.kind]}
          data-value-mm={dim.valueMm}
        >
          {t(LAYER_LABEL_KEY[dim.kind], { value: `${dim.valueMm.toFixed(2)} mm` })}
        </span>
      ))}
    </div>
  );
}
