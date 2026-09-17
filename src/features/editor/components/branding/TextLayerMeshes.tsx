import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";
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
  /** World position of the glyph centre — the face frame, since the model sits at the origin unrotated by any parent. */
  x: number;
  y: number;
  z: number;
  /** World-space z of the glyph's own +Z axis: 1 on a flat face, less where conform tilted it. */
  upZ: number;
  /** Whether the conform raycast found the surface under this glyph. */
  conformed: boolean;
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

const Z = new THREE.Vector3(0, 0, 1);

/** Accelerated raycasts on the part (E1 §6 R2); the BVH is built once per geometry. */
function prepareRaycast(model: THREE.Object3D): void {
  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geometry = mesh.geometry as THREE.BufferGeometry & { boundsTree?: MeshBVH };
    if (!geometry.boundsTree) geometry.boundsTree = new MeshBVH(geometry);
    mesh.raycast = acceleratedRaycast;
  });
}

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
  const lastCamera = useRef(new THREE.Matrix4());
  const layoutVersion = useRef(0);
  const projectedVersion = useRef(-1);

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
    const raycaster = new THREE.Raycaster();
    const normal = new THREE.Vector3();
    const tilt = new THREE.Quaternion();
    const spin = new THREE.Quaternion();
    const up = new THREE.Vector3();
    let raycastReady = false;

    for (const layer of layers) {
      const font = fonts[layer.content.font.key];
      if (!layer.visible || !font) continue;
      const metrics = font.data as unknown as TypefaceMetrics;
      for (const placed of layoutText(metrics, layer)) {
        const char = glyphChar(metrics, placed.char);
        if (!char.trim()) continue;
        const mesh = new THREE.Mesh(glyphGeometry(layer.content.font.key, font, char), material);
        spin.setFromAxisAngle(Z, placed.rotationZ);
        let z = faceZ;
        let conformed = false;
        if (layer.placement.conform) {
          // conform (E1 §6 R2): per glyph, cast along −normal of the face
          // from above the part, land on the surface and turn the glyph's
          // +Z to the hit normal. x and y stay the layout's exactly; the
          // orientation is a rotation only, so no mirroring can arise.
          if (!raycastReady) {
            model.updateWorldMatrix(true, true);
            prepareRaycast(model);
            raycastReady = true;
          }
          raycaster.set(new THREE.Vector3(placed.x, placed.y, faceZ + 1), new THREE.Vector3(0, 0, -1));
          // Hidden groups (the buyer view, 4j) are not surface: land on what is drawn.
          const hit = raycaster.intersectObject(model, true).find((h) => h.object.visible);
          if (hit?.face) {
            normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
            if (normal.z < 0) normal.negate();
            z = hit.point.z;
            conformed = true;
            tilt.setFromUnitVectors(Z, normal);
            spin.premultiply(tilt);
          }
        }
        mesh.position.set(placed.x, placed.y, z + GLYPH_LIFT_MM);
        mesh.quaternion.copy(spin);
        mesh.scale.set(layer.style.text_size_mm, layer.style.text_size_mm, 1);
        mesh.userData = { layerId: layer.id, index: placed.index, char, conformed };
        group.add(mesh);
      }
    }
    layoutVersion.current++;

    // Read back from the world matrices three.js will render with, not from the layout's own numbers.
    group.updateWorldMatrix(true, true);
    const position = new THREE.Vector3();
    for (const mesh of group.children) {
      position.setFromMatrixPosition(mesh.matrixWorld);
      up.set(0, 0, 1).transformDirection(mesh.matrixWorld);
      const { layerId, index, char, conformed } = mesh.userData;
      glyphs.push({ layerId, index, char, x: position.x, y: position.y, z: position.z, upZ: up.z, conformed });
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

  // Screen x of each glyph centre, in canvas CSS px, kept on the canvas
  // element whenever the camera or the layout changes — the e2e reading-
  // direction check (4g) needs the projection the buyer actually sees.
  useFrame(({ camera, size, gl }) => {
    if (camera.matrixWorld.equals(lastCamera.current) && projectedVersion.current === layoutVersion.current) return;
    lastCamera.current.copy(camera.matrixWorld);
    projectedVersion.current = layoutVersion.current;
    const p = new THREE.Vector3();
    const xs = group.children.map((child) => {
      child.getWorldPosition(p).project(camera);
      return ((p.x + 1) / 2) * size.width;
    });
    gl.domElement.dataset.glyphScreenX = JSON.stringify(xs);
  });

  return <primitive object={group} />;
}
