import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import type { Group } from "three";
import { tradeLigne } from "../lib/ligne";
import type { RulerMeasurements } from "./EditorModel";

interface RulerOverlayProps {
  measurements: RulerMeasurements;
  sizeLigne: number | null;
  /** A labelled variant is non-round hardware by definition — no ligne (R3, moved from `MeasurementLine`). */
  sizeLabel: string | null;
}

/** Render layer the ruler lives on exclusively (C5) — never layer 0. */
const RULER_LAYER = 1;
const TICK_MM = 0.6;
const MARGIN_MM = 1.2;

function diameterLabel(mm: number, sizeLigne: number | null, sizeLabel: string | null): string {
  const ligneText = !sizeLabel && sizeLigne != null ? ` (${tradeLigne(sizeLigne)}L)` : "";
  return `${mm.toFixed(2)} mm${ligneText}`;
}

/**
 * Diameter and thickness only (E1 §5 row 4e) — the spec's fuller scope/mode
 * settings (§19–21) are Phase 11. C5: helper lines as screen-space `Line2`
 * (drei's `Line`, `worldUnits` off by default) and DOM labels (`Html`, sized
 * in CSS px), all on render layer 1 so they're excluded from `ContactShadows`
 * (its internal shadow camera stays on layer 0), raycasts (the default
 * `Raycaster` also stays on layer 0) and any future exporter (which walks
 * `EditorModel`'s own object, never this sibling group). Never geometry —
 * nothing here is added to the model being measured.
 */
export function RulerOverlay({ measurements, sizeLigne, sizeLabel }: RulerOverlayProps) {
  const { camera } = useThree();
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

  const { minX, maxX, minY, maxY, minZ, maxZ, diameterMm, thicknessMm } = measurements;
  const thicknessX = minX - MARGIN_MM;
  const centerZ = (minZ + maxZ) / 2;
  const centerY = (minY + maxY) / 2;

  // The diameter line follows whichever in-face axis is actually the larger
  // one — `diameterMm` is `max(sizeX, sizeY)` (EditorModel), so the line's
  // span must match that axis or the label would describe a different line.
  const diameterAlongX = maxX - minX >= maxY - minY;
  const diameterY = minY - MARGIN_MM;
  const diameterX = minX - MARGIN_MM;
  const diameterLinePoints: [number, number, number][] = diameterAlongX
    ? [[minX, diameterY, 0], [maxX, diameterY, 0]]
    : [[diameterX, minY, 0], [diameterX, maxY, 0]];
  const diameterLabelPosition: [number, number, number] = diameterAlongX
    ? [(minX + maxX) / 2, diameterY - MARGIN_MM * 1.5, 0]
    : [diameterX - MARGIN_MM * 1.5, (minY + maxY) / 2, 0];
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

  return (
    <group ref={groupRef}>
      {/* Diameter: the larger model-local in-face axis (C4). */}
      <Line points={diameterLinePoints} color="#1a1a1a" lineWidth={1.5} />
      <Line points={diameterTick(diameterAlongX ? minX : minY)} color="#1a1a1a" lineWidth={1.5} />
      <Line points={diameterTick(diameterAlongX ? maxX : maxY)} color="#1a1a1a" lineWidth={1.5} />
      <Html center position={diameterLabelPosition} style={{ pointerEvents: "none" }}>
        <span className="text-[11px] whitespace-nowrap bg-background/90 px-1 py-0.5 border border-border text-foreground" data-testid="ruler-diameter-label">
          {diameterLabel(diameterMm, sizeLigne, sizeLabel)}
        </span>
      </Html>

      {/* Thickness: model-local Z extent (the decorated face's normal axis), shown to the side. */}
      <Line points={[[thicknessX, centerY, minZ], [thicknessX, centerY, maxZ]]} color="#1a1a1a" lineWidth={1.5} />
      <Line points={[[thicknessX - TICK_MM, centerY, minZ], [thicknessX + TICK_MM, centerY, minZ]]} color="#1a1a1a" lineWidth={1.5} />
      <Line points={[[thicknessX - TICK_MM, centerY, maxZ], [thicknessX + TICK_MM, centerY, maxZ]]} color="#1a1a1a" lineWidth={1.5} />
      <Html center position={[thicknessX - MARGIN_MM, centerY, centerZ]} style={{ pointerEvents: "none" }}>
        <span className="text-[11px] whitespace-nowrap bg-background/90 px-1 py-0.5 border border-border text-foreground" data-testid="ruler-thickness-label">
          {thicknessMm.toFixed(2)} mm
        </span>
      </Html>
    </group>
  );
}
