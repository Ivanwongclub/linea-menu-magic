import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { loadBundledFont } from "../../lib/fonts";
import { glyphChar, layoutText, type TypefaceMetrics } from "../../lib/textLayout";
import { isLogoLayer, isTextLayer, logoHeightMm, type Layer, type LogoLayer } from "../../lib/recipe";
import { buildLogoGeometry, parseLogoSvg, type LogoArtwork } from "../../lib/logoGeometry";

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

export interface LogoReport {
  layerId: string;
  /** What the recipe asks for, mm. */
  widthMm: number;
  heightMm: number;
  /** What the built geometry actually measures, mm — the SVG as parsed. */
  measuredWidthMm: number;
  measuredHeightMm: number;
  /** Triangle area, mm² — less than width × height exactly when the artwork's holes were cut. */
  areaMm2: number;
  /** Which way the first triangle faces along the face normal: must be +1, or the logo is culled. */
  facing: number;
  x: number;
  y: number;
  z: number;
  conformed: boolean;
}

export interface TextSceneReport {
  glyphMeshCount: number;
  logoMeshCount: number;
  logos: LogoReport[];
  /**
   * Smallest world-matrix determinant over the model and every glyph — never
   * ≤ 0 (no mirroring, rulings §5). drei's ContactShadows draws its shadow
   * quad with scale (1, −1, 1); that texture plane is not part geometry and
   * is left out.
   */
  minWorldDeterminant: number;
  glyphs: GlyphReport[];
}

interface BrandingMeshesProps {
  layers: Layer[];
  /** The SVG behind each logo layer, by layer id (4k) — pending file or downloaded asset. */
  logoSources: Record<string, string>;
  model: THREE.Object3D;
  /** Top of the face in the model's frame, mm. */
  faceZ: number;
  material: THREE.Material;
  onReport?: (report: TextSceneReport) => void;
}

const geometries = new Map<string, THREE.BufferGeometry>();
/** Parsed artwork per SVG source, so a width change doesn't re-parse. */
const artworks = new Map<string, LogoArtwork | null>();

/** Summed triangle area of a flat geometry, for the holes read-back. */
function triangleArea(geometry: THREE.BufferGeometry): number {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  const count = index ? index.count : position.count;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let total = 0;
  for (let i = 0; i < count; i += 3) {
    const [ia, ib, ic] = index ? [index.getX(i), index.getX(i + 1), index.getX(i + 2)] : [i, i + 1, i + 2];
    a.fromBufferAttribute(position, ia);
    b.fromBufferAttribute(position, ib);
    c.fromBufferAttribute(position, ic);
    total += b.clone().sub(a).cross(c.clone().sub(a)).length() / 2;
  }
  return total;
}

/** Sign of the first triangle's normal along +Z — front faces must point out of the face. */
function frontFacing(geometry: THREE.BufferGeometry): number {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  const [ia, ib, ic] = index ? [index.getX(0), index.getX(1), index.getX(2)] : [0, 1, 2];
  const a = new THREE.Vector3().fromBufferAttribute(position, ia);
  const b = new THREE.Vector3().fromBufferAttribute(position, ib);
  const c = new THREE.Vector3().fromBufferAttribute(position, ic);
  return Math.sign(b.sub(a).cross(c.sub(a)).z);
}

function logoArtwork(svg: string): LogoArtwork | null {
  if (!artworks.has(svg)) artworks.set(svg, parseLogoSvg(svg));
  return artworks.get(svg) ?? null;
}

const Z = new THREE.Vector3(0, 0, 1);
const DEG = Math.PI / 180;

/** Samples across a logo's rectangle, in the face frame — dense enough to catch a raised ring crossing it. */
const FOOTPRINT_SAMPLES = 7;

function footprint(width: number, height: number, cx: number, cy: number, rotationDeg: number): [number, number][] {
  const theta = -rotationDeg * DEG;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const points: [number, number][] = [];
  const step = 1 / (FOOTPRINT_SAMPLES - 1);
  for (let i = 0; i < FOOTPRINT_SAMPLES; i++) {
    for (let j = 0; j < FOOTPRINT_SAMPLES; j++) {
      const lx = (-0.5 + i * step) * width;
      const ly = (-0.5 + j * step) * height;
      points.push([cx + lx * cos - ly * sin, cy + lx * sin + ly * cos]);
    }
  }
  return points;
}

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

/**
 * The recipe's layers in the face frame: text as one mesh per glyph, a logo
 * as one `ShapeGeometry` from its SVG (4k). Geometry only for display —
 * never part of the measured model.
 */
export function BrandingMeshes({ layers, logoSources, model, faceZ, material, onReport }: BrandingMeshesProps) {
  const [fonts, setFonts] = useState<Record<string, Font>>({});
  const group = useMemo(() => new THREE.Group(), []);
  const lastCamera = useRef(new THREE.Matrix4());
  const layoutVersion = useRef(0);
  const projectedVersion = useRef(-1);

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

  useLayoutEffect(() => {
    group.clear();
    const glyphs: GlyphReport[] = [];
    const raycaster = new THREE.Raycaster();
    const normal = new THREE.Vector3();
    const tilt = new THREE.Quaternion();
    const spin = new THREE.Quaternion();
    const up = new THREE.Vector3();
    let raycastReady = false;

    const logos: LogoReport[] = [];
    const built: THREE.BufferGeometry[] = [];

    /** The highest surface under a set of face-frame points (a logo's footprint). */
    const surfaceUnder = (points: [number, number][]) => {
      if (!raycastReady) {
        model.updateWorldMatrix(true, true);
        prepareRaycast(model);
        raycastReady = true;
      }
      let top = -Infinity;
      for (const [px, py] of points) {
        raycaster.set(new THREE.Vector3(px, py, faceZ + 1), new THREE.Vector3(0, 0, -1));
        const hit = raycaster.intersectObject(model, true).find((h) => h.object.visible);
        if (hit) top = Math.max(top, hit.point.z);
      }
      return top > -Infinity ? { z: top, conformed: true } : { z: faceZ, conformed: false };
    };

    /** One raycast down the face normal: where the surface is under `x, y`, and its normal (E1 §6 R2). */
    const conformAt = (x: number, y: number, spin: THREE.Quaternion) => {
      if (!raycastReady) {
        model.updateWorldMatrix(true, true);
        prepareRaycast(model);
        raycastReady = true;
      }
      raycaster.set(new THREE.Vector3(x, y, faceZ + 1), new THREE.Vector3(0, 0, -1));
      // Hidden groups (the buyer view, 4j) are not surface: land on what is drawn.
      const hit = raycaster.intersectObject(model, true).find((h) => h.object.visible);
      if (!hit?.face) return { z: faceZ, conformed: false };
      normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
      if (normal.z < 0) normal.negate();
      tilt.setFromUnitVectors(Z, normal);
      spin.premultiply(tilt);
      return { z: hit.point.z, conformed: true };
    };

    for (const layer of layers) {
      if (!layer.visible) continue;
      if (isLogoLayer(layer)) {
        const source = logoSources[layer.id];
        const artwork = source ? logoArtwork(source) : null;
        if (!artwork) continue;
        const geometry = buildLogoGeometry(artwork, layer.content.width_mm);
        built.push(geometry);
        const mesh = new THREE.Mesh(geometry, material);
        spin.setFromAxisAngle(Z, -layer.placement.rotation_deg * DEG);
        const { x, y } = layer.placement.centre_mm;
        // A logo is one flat sheet, not a row of small glyphs: tilting it to
        // the normal under its centre buries its far side in a domed face.
        // It conforms by sitting on the highest surface under its whole
        // footprint instead, parallel to the face (4k R3; E1 §6 R2 tilts what
        // is small enough to tilt).
        const placed = layer.placement.conform
          ? surfaceUnder(footprint(layer.content.width_mm, logoHeightMm(layer), x, y, layer.placement.rotation_deg))
          : { z: faceZ, conformed: false };
        mesh.position.set(x, y, placed.z + GLYPH_LIFT_MM);
        mesh.quaternion.copy(spin);
        mesh.userData = { logo: layer.id, conformed: placed.conformed };
        group.add(mesh);
        geometry.computeBoundingBox();
        const box = geometry.boundingBox as THREE.Box3;
        const area = triangleArea(geometry);
        const facing = frontFacing(geometry);
        logos.push({
          layerId: layer.id,
          widthMm: layer.content.width_mm,
          heightMm: logoHeightMm(layer),
          measuredWidthMm: box.max.x - box.min.x,
          measuredHeightMm: box.max.y - box.min.y,
          areaMm2: area,
          facing,
          x,
          y,
          z: placed.z + GLYPH_LIFT_MM,
          conformed: placed.conformed,
        });
        continue;
      }
      if (!isTextLayer(layer)) continue;
      const font = fonts[layer.content.font.key];
      if (!font) continue;
      const metrics = font.data as unknown as TypefaceMetrics;
      for (const placed of layoutText(metrics, layer)) {
        const char = glyphChar(metrics, placed.char);
        if (!char.trim()) continue;
        const mesh = new THREE.Mesh(glyphGeometry(layer.content.font.key, font, char), material);
        spin.setFromAxisAngle(Z, placed.rotationZ);
        let z = faceZ;
        let conformed = false;
        if (layer.placement.conform) {
          // conform (E1 §6 R2): cast along −normal of the face from above the
          // part, land on the surface and turn the mesh's +Z to the hit
          // normal. x and y stay the layout's exactly; the orientation is a
          // rotation only, so no mirroring can arise.
          const landed = conformAt(placed.x, placed.y, spin);
          z = landed.z;
          conformed = landed.conformed;
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
      if (!layerId) continue;
      glyphs.push({ layerId, index, char, x: position.x, y: position.y, z: position.z, upZ: up.z, conformed });
    }

    let minWorldDeterminant = Infinity;
    for (const root of [model, group]) {
      root.updateWorldMatrix(true, true);
      root.traverse((o) => {
        minWorldDeterminant = Math.min(minWorldDeterminant, o.matrixWorld.determinant());
      });
    }
    onReport?.({ glyphMeshCount: group.children.length - logos.length, logoMeshCount: logos.length, logos, minWorldDeterminant, glyphs });

    // Glyph geometry is shared and cached; a logo's is built per width.
    return () => {
      for (const geometry of built) geometry.dispose();
    };
  }, [group, layers, logoSources, model, fonts, faceZ, material, onReport]);

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
