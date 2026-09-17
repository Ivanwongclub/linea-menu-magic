import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { loadBundledFont } from "../../lib/fonts";
import { glyphChar, layoutText, type TypefaceMetrics } from "../../lib/textLayout";
import type { TextLayer } from "../../lib/recipe";

/** Glyph bases sit this far above the face so they never share a plane with it (E1 §6 R3). */
export const GLYPH_LIFT_MM = 0.02;
/** A thin slab until Phase 5 gives a layer real relief. */
export const GLYPH_PREVIEW_THICKNESS_MM = 0.05;

export interface GlyphReport {
  layerId: string;
  index: number;
  char: string;
  x: number;
  y: number;
  z: number;
}

export interface TextSceneReport {
  glyphMeshCount: number;
  /**
   * Smallest world-matrix determinant over the model and every glyph — never
   * ≤ 0 (no mirroring, rulings §5). drei's ContactShadows draws its shadow
   * quad with scale (1, −1, 1); that texture plane is not part geometry and
   * is left out.
   */
  minWorldDeterminant: number;
  glyphs: GlyphReport[];
}

interface TextLayerMeshesProps {
  layers: TextLayer[];
  model: THREE.Object3D;
  /** Top of the face in the model's frame, mm. */
  faceZ: number;
  material: THREE.Material;
  onReport?: (report: TextSceneReport) => void;
}

const geometries = new Map<string, THREE.BufferGeometry>();

/**
 * One glyph at cap height 1 with its origin at the advance midpoint and the
 * cap-height midline, so a mesh's position is the layout's glyph centre and
 * `scale (size, size, 1)` sizes it without touching thickness.
 */
function glyphGeometry(fontKey: string, font: Font, char: string): THREE.BufferGeometry {
  const key = `${fontKey}:${char}`;
  let geometry = geometries.get(key);
  if (!geometry) {
    const data = font.data as unknown as TypefaceMetrics;
    const cap = data.capHeight && data.capHeight > 0 ? data.capHeight : data.resolution * 0.7;
    geometry = new TextGeometry(char, {
      font,
      size: data.resolution / cap,
      height: GLYPH_PREVIEW_THICKNESS_MM,
      curveSegments: 6,
      bevelEnabled: false,
    });
    geometry.translate(-(data.glyphs[char]?.ha ?? 0) / cap / 2, -0.5, 0);
    geometries.set(key, geometry);
  }
  return geometry;
}

/** The recipe's text layers as per-glyph meshes in the face frame. Geometry only for display — never part of the measured model. */
export function TextLayerMeshes({ layers, model, faceZ, material, onReport }: TextLayerMeshesProps) {
  const [fonts, setFonts] = useState<Record<string, Font>>({});
  const group = useMemo(() => new THREE.Group(), []);

  const fontKeys = useMemo(() => [...new Set(layers.map((l) => l.content.font.key))].sort().join("|"), [layers]);

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

  useLayoutEffect(() => {
    group.clear();
    const glyphs: GlyphReport[] = [];
    for (const layer of layers) {
      const font = fonts[layer.content.font.key];
      if (!layer.visible || !font) continue;
      const metrics = font.data as unknown as TypefaceMetrics;
      for (const placed of layoutText(metrics, layer)) {
        const char = glyphChar(metrics, placed.char);
        if (!char.trim()) continue;
        const mesh = new THREE.Mesh(glyphGeometry(layer.content.font.key, font, char), material);
        mesh.position.set(placed.x, placed.y, faceZ + GLYPH_LIFT_MM);
        mesh.rotation.set(0, 0, placed.rotationZ);
        mesh.scale.set(layer.style.text_size_mm, layer.style.text_size_mm, 1);
        mesh.userData = { glyph: true, layerId: layer.id, index: placed.index };
        group.add(mesh);
        glyphs.push({ layerId: layer.id, index: placed.index, char, x: placed.x, y: placed.y, z: mesh.position.z });
      }
    }

    if (!onReport) return;
    let minWorldDeterminant = Infinity;
    for (const root of [model, group]) {
      root.updateWorldMatrix(true, true);
      root.traverse((o) => {
        minWorldDeterminant = Math.min(minWorldDeterminant, o.matrixWorld.determinant());
      });
    }
    onReport({ glyphMeshCount: group.children.length, minWorldDeterminant, glyphs });
  }, [group, layers, model, fonts, faceZ, material, onReport]);

  return <primitive object={group} />;
}
