import { useEffect, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Vector3, type Group } from "three";
import { tradeLigne } from "../lib/ligne";
import { layoutRulerLabels, type DimensionLine, type Point } from "../lib/rulerLabelLayout";
import type { RulerMeasurements } from "./EditorModel";

/** The DOM label elements (rendered by `RulerLabels` outside the canvas) this overlay positions each frame. */
export interface RulerLabelElements {
  diameter: HTMLElement | null;
  thickness: HTMLElement | null;
}

interface RulerOverlayProps {
  measurements: RulerMeasurements;
  labels: MutableRefObject<RulerLabelElements>;
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
 * Diameter and thickness only (E1 §5 row 4e) — the product's own dimensions;
 * a selected layer's measurements join here once layers have any (4j). C5:
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
export function RulerOverlay({ measurements, labels }: RulerOverlayProps) {
  const { camera, size } = useThree();
  const groupRef = useRef<Group>(null);

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
  }, [camera]);

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
    const placed = layoutRulerLabels(d, t, centre);
    const key = JSON.stringify(placed);
    if (key === last.current) return;
    last.current = key;
    for (const [el, rect, own] of [
      [diameter, placed.diameter, d],
      [thickness, placed.thickness, t],
    ] as const) {
      el.style.transform = `translate(${Math.round(rect.x)}px, ${Math.round(rect.y)}px)`;
      el.style.visibility = "visible";
      el.dataset.line = JSON.stringify({ a: own.a, b: own.b });
    }
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
    </group>
  );
}

interface RulerLabelsProps {
  measurements: RulerMeasurements;
  sizeLigne: number | null;
  /** A labelled variant is non-round hardware by definition — no ligne (R3, moved from `MeasurementLine`). */
  sizeLabel: string | null;
  labels: MutableRefObject<RulerLabelElements>;
}

const LABEL_CLASS =
  "absolute left-0 top-0 text-[11px] whitespace-nowrap bg-background/90 px-1 py-0.5 border border-border text-foreground will-change-transform";

/** The ruler's DOM labels, over the canvas; `RulerOverlay` positions them. Hidden until first placed. */
export function RulerLabels({ measurements, sizeLigne, sizeLabel, labels }: RulerLabelsProps) {
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
    </div>
  );
}
