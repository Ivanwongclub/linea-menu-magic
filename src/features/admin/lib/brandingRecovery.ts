import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
// Relative with extension so e2e scripts can import this module under Node.
import { decoratedFaceRotation } from "../../editor/lib/prepareModel.ts";

/**
 * Branding reference recovery (E1 §3.2, C8, C9, C11; addendum §3, §14, §17).
 * Pure functions over an unrotated, unscaled OBJ root (as `OBJLoader.parse`
 * returns it): every value is in raw OBJ units and the raw OBJ frame, so a
 * later recalibration or orientation-heuristic change never invalidates it.
 * No React — Phase 11's upload path reuses this module.
 */

export type Vec3 = [number, number, number];
export type Confidence = "high" | "medium" | "low";
export type ReadingDirection = "cw" | "ccw";

export interface ModelGroupInfo {
  index: number;
  name: string;
  vertexCount: number;
}

export interface BrandingMark {
  index: number;
  name: string;
}

export interface BrandingReference {
  algorithm: "kasa-circle-v1";
  analysed_at: string;
  origin: "recovered-from-geometry";
  face_normal_raw: Vec3;
  angle_zero_raw: Vec3;
  centre_raw: Vec3;
  radius_raw: number;
  start_angle_deg: number;
  end_angle_deg: number;
  direction: ReadingDirection;
  text_height_raw: number | null;
  relief_raw: number | null;
  fit_rms_raw: number;
  confidence: Confidence;
}

/** Fewer marked groups than this can't establish a text arc from glyph positions. */
export const MIN_GLYPH_GROUPS = 3;
/** §3.2: RMS/radius below these bounds is high / medium confidence. */
export const CONFIDENCE_HIGH = 0.01;
export const CONFIDENCE_MEDIUM = 0.03;

/** The OBJ root's direct mesh children, in file order — `index` is stable per file (E1 §3.1). */
export function modelGroups(root: THREE.Object3D): THREE.Mesh[] {
  return root.children.filter((c): c is THREE.Mesh => (c as THREE.Mesh).isMesh);
}

export function listModelGroups(root: THREE.Object3D): ModelGroupInfo[] {
  return modelGroups(root).map((mesh, index) => ({
    index,
    name: mesh.name || `group_${index + 1}`,
    vertexCount: mesh.geometry.getAttribute("position")?.count ?? 0,
  }));
}

export function confidenceFor(rms: number, radius: number): Confidence {
  if (!(radius > 0) || !Number.isFinite(rms)) return "low";
  const ratio = rms / radius;
  if (ratio < CONFIDENCE_HIGH) return "high";
  if (ratio < CONFIDENCE_MEDIUM) return "medium";
  return "low";
}

/** Median of the values inside the 10th–90th percentile band (C11, addendum §14). */
export function bandMedian(values: number[], low = 0.1, high = 0.9): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const lo = Math.floor((sorted.length - 1) * low);
  const hi = Math.ceil((sorted.length - 1) * high);
  const band = sorted.slice(lo, hi + 1);
  const mid = (band.length - 1) / 2;
  return (band[Math.floor(mid)] + band[Math.ceil(mid)]) / 2;
}

export interface CircleFit {
  cx: number;
  cy: number;
  radius: number;
  rms: number;
}

/** Kåsa algebraic least-squares circle fit: minimises Σ(x² + y² + Dx + Ey + F)². */
export function kasaCircleFit(points: [number, number][]): CircleFit | null {
  const n = points.length;
  if (n < 3) return null;
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sxz = 0, syz = 0, sz = 0;
  for (const [x, y] of points) {
    const z = x * x + y * y;
    sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
    sxz += x * z; syz += y * z; sz += z;
  }
  // Normal equations for [D, E, F]: A·[D,E,F] = -[Σxz, Σyz, Σz]
  const a = [
    [sxx, sxy, sx],
    [sxy, syy, sy],
    [sx, sy, n],
  ];
  const b = [-sxz, -syz, -sz];
  const solved = solve3(a, b);
  if (!solved) return null;
  const [d, e, f] = solved;
  const cx = -d / 2;
  const cy = -e / 2;
  const r2 = cx * cx + cy * cy - f;
  if (!(r2 > 0)) return null;
  const radius = Math.sqrt(r2);
  let sq = 0;
  for (const [x, y] of points) sq += (Math.hypot(x - cx, y - cy) - radius) ** 2;
  return { cx, cy, radius, rms: Math.sqrt(sq / n) };
}

function solve3(a: number[][], b: number[]): [number, number, number] | null {
  const det = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const d = det(a);
  if (Math.abs(d) < 1e-12) return null;
  const col = (i: number) => a.map((row, r) => row.map((v, c) => (c === i ? b[r] : v)));
  return [det(col(0)) / d, det(col(1)) / d, det(col(2)) / d];
}

/** Clockwise angle in degrees, [0, 360), 0 = +up, viewed from the face (right = +x). */
function clockwiseAngle(x: number, y: number): number {
  const deg = THREE.MathUtils.radToDeg(Math.atan2(x, y));
  return (deg + 360) % 360;
}

const wrap180 = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;

/**
 * The smallest clockwise arc covering every angle: the complement of the
 * largest gap between sorted angles. Returns [start, span] with start the
 * arc's counter-clockwise-most end.
 */
export function coveringArc(angles: number[]): { start: number; span: number } {
  const sorted = [...angles].sort((a, b) => a - b);
  let gapAfter = sorted.length - 1;
  let largest = sorted[0] + 360 - sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1] - sorted[i];
    if (gap > largest) {
      largest = gap;
      gapAfter = i;
    }
  }
  const start = sorted[(gapAfter + 1) % sorted.length];
  return { start, span: 360 - largest };
}

export interface FaceFrame {
  normal: THREE.Vector3;
  up: THREE.Vector3;
  right: THREE.Vector3;
}

/**
 * The raw-frame face basis: `decoratedFaceRotation` computed on the *full*
 * model (collision 10 — before any group is hidden), inverted. +Z of the
 * oriented model is the decorated side's normal; +Y of it is 12 o'clock.
 */
export function rawFaceFrame(root: THREE.Object3D): FaceFrame {
  root.updateWorldMatrix(true, true);
  const inverse = decoratedFaceRotation(root).invert();
  const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(inverse).normalize();
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(inverse).normalize();
  const right = new THREE.Vector3().crossVectors(up, normal).normalize();
  return { normal, up, right };
}

function readPositions(mesh: THREE.Mesh): THREE.Vector3[] {
  const position = mesh.geometry.getAttribute("position");
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < position.count; i++) out.push(new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld));
  return out;
}

/**
 * Signed relief of the marked groups along the local normal (addendum §14):
 * from each top-facing marked vertex, cast both ways along its own normal
 * against the unmarked body, take the nearer hit; + raised, − recessed.
 * Aggregated as the 10th–90th percentile band median (C11).
 */
export function measureRelief(marked: THREE.Mesh[], body: THREE.Mesh[], faceNormal: THREE.Vector3): number | null {
  if (!marked.length || !body.length) return null;
  const bodyGeometry = mergedWorldGeometry(body);
  if (!bodyGeometry) return null;
  const bvh = new MeshBVH(bodyGeometry);

  const samples: number[] = [];
  const ray = new THREE.Ray();
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3();
  for (const mesh of marked) {
    const position = mesh.geometry.getAttribute("position");
    const normal = mesh.geometry.getAttribute("normal");
    normalMatrix.getNormalMatrix(mesh.matrixWorld);
    for (let i = 0; i < position.count; i++) {
      p.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
      if (normal) n.fromBufferAttribute(normal, i).applyMatrix3(normalMatrix).normalize();
      else n.copy(faceNormal);
      // Top-facing surfaces only; side walls would measure along the face plane.
      if (n.dot(faceNormal) < 0.7) continue;
      ray.origin.copy(p);
      ray.direction.copy(n).negate();
      const below = bvh.raycastFirst(ray, THREE.DoubleSide);
      ray.direction.copy(n);
      const above = bvh.raycastFirst(ray, THREE.DoubleSide);
      const down = below ? below.distance : Infinity;
      const up = above ? above.distance : Infinity;
      if (!Number.isFinite(down) && !Number.isFinite(up)) continue;
      samples.push(down <= up ? down : -up);
    }
  }
  bodyGeometry.dispose();
  return bandMedian(samples);
}

function mergedWorldGeometry(meshes: THREE.Mesh[]): THREE.BufferGeometry | null {
  const chunks: Float32Array[] = [];
  let total = 0;
  const v = new THREE.Vector3();
  for (const mesh of meshes) {
    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry;
    const position = geometry.getAttribute("position");
    const out = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
      out[i * 3] = v.x;
      out[i * 3 + 1] = v.y;
      out[i * 3 + 2] = v.z;
    }
    chunks.push(out);
    total += out.length;
  }
  if (total < 9) return null;
  const merged = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(merged, 3));
  return geometry;
}

export interface BrandingAnalysis {
  /** Always computed, even when low confidence — for display. */
  result: BrandingReference;
  /** `result` when confidence isn't low, else null (C9: no forced circle). */
  reference: BrandingReference | null;
}

interface GlyphRadial {
  /** The glyph's radial centroid as a planar point on its mean bearing. */
  point: [number, number];
  radius: number;
  halfExtent: number;
}

function glyphRadials(glyphs: { planar: [number, number][] }[], cx: number, cy: number): GlyphRadial[] {
  return glyphs.map(({ planar }) => {
    let sx = 0, sy = 0, sum = 0, min = Infinity, max = -Infinity;
    for (const [u, v] of planar) {
      const du = u - cx;
      const dv = v - cy;
      const r = Math.hypot(du, dv) || 1e-12;
      sx += du / r;
      sy += dv / r;
      sum += r;
      min = Math.min(min, r);
      max = Math.max(max, r);
    }
    const len = Math.hypot(sx, sy) || 1;
    const radius = sum / planar.length;
    return { point: [cx + (sx / len) * radius, cy + (sy / len) * radius], radius, halfExtent: (max - min) / 2 };
  });
}

/**
 * Fits the text path: Kåsa on glyph bounding-box centres to seed a centre,
 * then refitted a few times on each glyph's radial centroid (its mean vertex
 * radius on its mean bearing). A vertex-level fit would score the glyphs'
 * own radial height as path error.
 *
 * `rms` is the RMS of how far the fitted path runs *outside* each glyph's
 * own radial span (0 for a glyph the path passes through): text whose glyphs
 * straddle one circle is a circle regardless of glyph shape, while glyphs
 * scattered off any common circle still score as error (C9).
 */
export function fitTextPath(glyphs: { planar: [number, number][] }[]): CircleFit | null {
  if (glyphs.length < MIN_GLYPH_GROUPS) return null;
  const bboxCentres = glyphs.map(({ planar }) => {
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    for (const [u, v] of planar) {
      minU = Math.min(minU, u); maxU = Math.max(maxU, u);
      minV = Math.min(minV, v); maxV = Math.max(maxV, v);
    }
    return [(minU + maxU) / 2, (minV + maxV) / 2] as [number, number];
  });
  let fit = kasaCircleFit(bboxCentres);
  if (!fit) return null;
  let radials = glyphRadials(glyphs, fit.cx, fit.cy);
  for (let i = 0; i < 6; i++) {
    const next = kasaCircleFit(radials.map((r) => r.point));
    if (!next) return null;
    fit = next;
    radials = glyphRadials(glyphs, fit.cx, fit.cy);
  }
  let sq = 0;
  for (const r of radials) sq += Math.max(0, Math.abs(r.radius - fit.radius) - r.halfExtent) ** 2;
  return { cx: fit.cx, cy: fit.cy, radius: fit.radius, rms: Math.sqrt(sq / radials.length) };
}

/**
 * Analyses the marked groups of an unrotated OBJ root (see `fitTextPath` for
 * the circle model). Returns null when nothing is marked.
 */
export function analyseBranding(root: THREE.Object3D, markedIndices: number[], analysedAt = new Date().toISOString()): BrandingAnalysis | null {
  const groups = modelGroups(root);
  const markedSet = new Set(markedIndices.filter((i) => i >= 0 && i < groups.length));
  if (!markedSet.size) return null;
  const frame = rawFaceFrame(root);

  const marked = [...markedSet].sort((a, b) => a - b).map((i) => groups[i]);
  const body = groups.filter((_, i) => !markedSet.has(i));

  const glyphs = marked.map((mesh) => {
    const planar: [number, number][] = [];
    const heights: number[] = [];
    for (const p of readPositions(mesh)) {
      planar.push([p.dot(frame.right), p.dot(frame.up)]);
      heights.push(p.dot(frame.normal));
    }
    return { planar, heights };
  });

  const fit = fitTextPath(glyphs);
  const allPlanar = glyphs.flatMap((g) => g.planar);
  const fallbackCentre = allPlanar.reduce((acc, [u, v]) => [acc[0] + u / allPlanar.length, acc[1] + v / allPlanar.length], [0, 0]);
  const cx = fit?.cx ?? fallbackCentre[0];
  const cy = fit?.cy ?? fallbackCentre[1];
  const radius = fit?.radius ?? 0;
  const rms = fit?.rms ?? Infinity;

  // A near-straight run fits a huge circle through almost-collinear glyphs;
  // a path wider than the part itself isn't a recoverable text circle.
  const modelSize = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  const faceRadius = Math.max(Math.abs(modelSize.dot(frame.right)), Math.abs(modelSize.dot(frame.up))) / 2;
  const plausible = radius > 0 && radius <= faceRadius * 1.05;

  // Angular extent over every marked vertex (covers glyph edges, not just centres).
  const vertexAngles = allPlanar.map(([u, v]) => clockwiseAngle(u - cx, v - cy));
  const arc = coveringArc(vertexAngles);

  // Reading direction from glyph (file) order: sum of signed clockwise steps.
  const glyphAngles = glyphRadials(glyphs, cx, cy).map((g) => clockwiseAngle(g.point[0] - cx, g.point[1] - cy));
  let signed = 0;
  for (let i = 1; i < glyphAngles.length; i++) signed += wrap180(glyphAngles[i] - glyphAngles[i - 1]);
  const direction: ReadingDirection = signed >= 0 ? "cw" : "ccw";
  const arcEnd = (arc.start + arc.span) % 360;
  const [startAngle, endAngle] = direction === "cw" ? [arc.start, arcEnd] : [arcEnd, arc.start];

  // Text height: each glyph's radial extent, median across glyphs.
  const glyphHeights = glyphs.map((g) => {
    let min = Infinity, max = -Infinity;
    for (const [u, v] of g.planar) {
      const r = Math.hypot(u - cx, v - cy);
      min = Math.min(min, r);
      max = Math.max(max, r);
    }
    return max - min;
  });
  const textHeight = fit ? bandMedian(glyphHeights, 0, 1) : null;

  const faceHeight = bandMedian(glyphs.flatMap((g) => g.heights)) ?? 0;
  const centre = new THREE.Vector3()
    .addScaledVector(frame.right, cx)
    .addScaledVector(frame.up, cy)
    .addScaledVector(frame.normal, faceHeight);

  const relief = measureRelief(marked, body, frame.normal);
  const confidence = fit && plausible ? confidenceFor(rms, radius) : "low";

  const toVec = (v: THREE.Vector3): Vec3 => [v.x, v.y, v.z];
  const result: BrandingReference = {
    algorithm: "kasa-circle-v1",
    analysed_at: analysedAt,
    origin: "recovered-from-geometry",
    face_normal_raw: toVec(frame.normal),
    angle_zero_raw: toVec(frame.up),
    centre_raw: toVec(centre),
    radius_raw: radius,
    start_angle_deg: startAngle,
    end_angle_deg: endAngle,
    direction,
    text_height_raw: textHeight,
    relief_raw: relief,
    fit_rms_raw: Number.isFinite(rms) ? rms : 0,
    confidence,
  };
  return { result, reference: confidence === "low" ? null : result };
}
