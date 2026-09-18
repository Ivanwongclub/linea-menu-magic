import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { loadBundledFont } from "../../lib/fonts";
import { glyphChar, layoutText, type TypefaceMetrics } from "../../lib/textLayout";
import { isLogoLayer, isTextLayer, layerAppearance, layerRelief, logoHeightMm, type Layer, type LayerAppearance, type LayerRelief } from "../../lib/recipe";
import { logoOutlines, parseLogoSvg, type LogoArtwork } from "../../lib/logoGeometry";
import type { LogoSource } from "../../hooks/useLogoAssets";
import { glyphOutlines } from "../../lib/glyphOutlines";
import { clonePatched } from "../../lib/shaderPatch";
import {
  OPENING_LIFT_MM,
  openingGeometry,
  raisedGeometry,
  recessFloorGeometry,
  recessWallGeometry,
  type ReliefOutline,
} from "../../lib/reliefGeometry";

/** Draw order: the part, then each recess's stencil mask, its depth punch, and its interior. */
const ORDER = { mask: 1, punch: 2, interior: 3 } as const;

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
  /** Which way the artwork faces along the face normal: must be +1, or the logo is culled. */
  facing: number;
  x: number;
  y: number;
  z: number;
  conformed: boolean;
}

/** What each layer's relief actually became on screen (Phase 5 R7 reads this back). */
export interface ReliefReport {
  layerId: string;
  type: LayerRelief["type"];
  depthMm: number;
  bevelMm: number;
  /** Glyphs (or the logo) carrying relief. */
  pieces: number;
  /** Raised: how far the extrusion's top stands above the surface, along the layer's own normal. */
  heightMm: [number, number] | null;
  /** Engraved: how far the recess floor lies below the surface. */
  floorMm: [number, number] | null;
  /** Engraved: wall meshes drawn, and the span of normal they cover. */
  wallMeshes: number;
  wallSpanMm: [number, number] | null;
  /** Engraved: opening masks (one stencil mask + one depth punch per piece). */
  openingMeshes: number;
  /** Where the ruler's relief callout starts, and the normal it runs along (R4). */
  anchor: { x: number; y: number; z: number; nx: number; ny: number; nz: number } | null;
  /** Phase 6a: what the layer is made of, and the colour it actually rendered in. */
  appearance: LayerAppearance;
  colourHex: string | null;
}

export interface TextSceneReport {
  glyphMeshCount: number;
  logoMeshCount: number;
  logos: LogoReport[];
  reliefs: ReliefReport[];
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
  /** The artwork behind each logo layer, by layer id (4k, 6a) — pending file or downloaded asset. */
  logoSources: Record<string, LogoSource>;
  model: THREE.Object3D;
  /** Top of the face in the model's frame, mm. */
  faceZ: number;
  material: THREE.MeshPhysicalMaterial;
  /** Phase 6a R2: the material a layer carries its own appearance in; absent means the part's own. */
  layerMaterials?: Record<string, THREE.MeshPhysicalMaterial>;
  onReport?: (report: TextSceneReport) => void;
}

/** Parsed artwork per SVG source, so a width change doesn't re-parse. */
const artworks = new Map<string, LogoArtwork | null>();

/**
 * Built relief geometry, keyed by everything it depends on. Dragging position
 * never rebuilds; changing size, depth or bevel does. The whole cache is
 * dropped once it grows past a slider's worth of intermediate values.
 */
const geometries = new Map<string, THREE.BufferGeometry>();
const GEOMETRY_CACHE_LIMIT = 300;
/** Keys the layout being built has already taken — never evicted under it. */
const inUse = new Set<string>();

function cached(key: string, build: () => THREE.BufferGeometry): THREE.BufferGeometry {
  inUse.add(key);
  const hit = geometries.get(key);
  if (hit) return hit;
  if (geometries.size >= GEOMETRY_CACHE_LIMIT) {
    for (const [cachedKey, geometry] of geometries) {
      if (inUse.has(cachedKey)) continue;
      geometry.dispose();
      geometries.delete(cachedKey);
    }
  }
  const built = build();
  geometries.set(key, built);
  return built;
}

const reliefKey = (relief: LayerRelief) => `${relief.type}:${relief.depth_mm}:${relief.bevel_mm}`;

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

/** Raster artwork, by data URL: loaded once, then kept for the session (R2). */
const textures = new Map<string, THREE.Texture>();

function rasterTexture(url: string, onLoad: () => void): THREE.Texture | null {
  const hit = textures.get(url);
  if (hit) return hit;
  const texture = new THREE.TextureLoader().load(url, () => onLoad());
  texture.colorSpace = THREE.SRGBColorSpace;
  textures.set(url, texture);
  return texture.image ? texture : null;
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

/** Writes 1 into the stencil wherever the opening is the frontmost thing on screen. */
function maskMaterial(): THREE.Material {
  return new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -4,
    stencilWrite: true,
    stencilRef: 1,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilZPass: THREE.ReplaceStencilOp,
  });
}

/**
 * Pushes the depth inside the opening to the far plane, so the recess — which
 * lies behind the surface that was already drawn there — can be depth-sorted
 * among its own faces instead of being rejected by the part in front of it.
 */
function punchMaterial(): THREE.Material {
  return new THREE.ShaderMaterial({
    vertexShader: `void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	gl_Position.z = gl_Position.w;
}`,
    fragmentShader: "void main() { gl_FragColor = vec4( 0.0 ); }",
    colorWrite: false,
    depthWrite: true,
    depthFunc: THREE.AlwaysDepth,
    stencilWrite: true,
    stencilRef: 1,
    stencilFunc: THREE.EqualStencilFunc,
    stencilZPass: THREE.KeepStencilOp,
  });
}

/** The recess's own surfaces: the part's material, drawn only through the opening. */
function interiorMaterial(material: THREE.MeshPhysicalMaterial): THREE.MeshPhysicalMaterial {
  const clone = clonePatched(material);
  clone.side = THREE.FrontSide;
  clone.stencilWrite = true;
  clone.stencilRef = 1;
  clone.stencilFunc = THREE.EqualStencilFunc;
  clone.stencilZPass = THREE.KeepStencilOp;
  return clone;
}

/** A printed layer is ink on the surface: flat, and never fighting the face for depth. */
function decalMaterial(source: THREE.MeshPhysicalMaterial): THREE.MeshPhysicalMaterial {
  const clone = clonePatched(source);
  clone.side = THREE.FrontSide;
  clone.polygonOffset = true;
  clone.polygonOffsetFactor = -2;
  clone.polygonOffsetUnits = -4;
  return clone;
}

/** A raster decal (R2): the artwork's own pixels, its alpha honoured. */
const rasterMaterials = new Map<THREE.Texture, THREE.MeshPhysicalMaterial>();

function rasterMaterialFor(texture: THREE.Texture): THREE.MeshPhysicalMaterial {
  let material = rasterMaterials.get(texture);
  if (!material) {
    material = rasterMaterial(texture);
    rasterMaterials.set(texture, material);
  }
  return material;
}

function rasterMaterial(texture: THREE.Texture): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.02,
    metalness: 0,
    roughness: 0.6,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -4,
  });
}

interface ReliefMaterials {
  mask: THREE.Material;
  punch: THREE.Material;
  /** The recess's own surfaces, per source material: the fill of axis-design §3. */
  interior: (source: THREE.MeshPhysicalMaterial) => THREE.MeshPhysicalMaterial;
  /** Printed ink, per source material. */
  decal: (source: THREE.MeshPhysicalMaterial) => THREE.MeshPhysicalMaterial;
  dispose: () => void;
}

function reliefMaterials(): ReliefMaterials {
  const interiors = new Map<THREE.MeshPhysicalMaterial, THREE.MeshPhysicalMaterial>();
  const decals = new Map<THREE.MeshPhysicalMaterial, THREE.MeshPhysicalMaterial>();
  const derive = (cache: Map<THREE.MeshPhysicalMaterial, THREE.MeshPhysicalMaterial>, make: (m: THREE.MeshPhysicalMaterial) => THREE.MeshPhysicalMaterial) => (source: THREE.MeshPhysicalMaterial) => {
    let derived = cache.get(source);
    if (!derived) {
      derived = make(source);
      cache.set(source, derived);
    }
    return derived;
  };
  const mask = maskMaterial();
  const punch = punchMaterial();
  return {
    mask,
    punch,
    interior: derive(interiors, interiorMaterial),
    decal: derive(decals, decalMaterial),
    dispose: () => {
      mask.dispose();
      punch.dispose();
      for (const m of interiors.values()) m.dispose();
      for (const m of decals.values()) m.dispose();
      interiors.clear();
      decals.clear();
    },
  };
}

/**
 * The recipe's layers in the face frame: text as one group per glyph, a logo
 * as one group, each carrying the layer's relief — a raised extrusion, or an
 * opening mask, a depth punch, and the recess's walls and floor as their own
 * meshes (R2). Geometry only for display — never part of the measured model.
 */
export function BrandingMeshes({ layers, logoSources, model, faceZ, material, layerMaterials, onReport }: BrandingMeshesProps) {
  const [fonts, setFonts] = useState<Record<string, Font>>({});
  /** Bumped when a raster artwork finishes decoding, so the layout runs again. */
  const [textureVersion, setTextureVersion] = useState(0);
  const group = useMemo(() => new THREE.Group(), []);
  const lastCamera = useRef(new THREE.Matrix4());
  const layoutVersion = useRef(0);
  const projectedVersion = useRef(-1);

  // Derived materials (recess interiors, printed ink) are rebuilt when the
  // part's material is — one set for the part and every layer appearance.
  const materials: ReliefMaterials = useMemo(() => reliefMaterials(), [material]);
  useEffect(() => () => materials.dispose(), [materials]);

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
    inUse.clear();
    const glyphs: GlyphReport[] = [];
    const raycaster = new THREE.Raycaster();
    const normal = new THREE.Vector3();
    const tilt = new THREE.Quaternion();
    const spin = new THREE.Quaternion();
    const up = new THREE.Vector3();
    let raycastReady = false;

    const logos: LogoReport[] = [];
    const reliefs = new Map<string, ReliefReport>();
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

    const report = (layer: Layer, relief: LayerRelief): ReliefReport => {
      let entry = reliefs.get(layer.id);
      if (!entry) {
        const appearance = layerAppearance(layer);
        const own = layerMaterials?.[layer.id];
        entry = {
          layerId: layer.id,
          type: relief.type,
          depthMm: relief.depth_mm,
          bevelMm: relief.bevel_mm,
          pieces: 0,
          heightMm: null,
          floorMm: null,
          wallMeshes: 0,
          wallSpanMm: null,
          openingMeshes: 0,
          anchor: null,
          appearance,
          // What the layer actually rendered in, whatever it asked for.
          colourHex: `#${(own ?? material).color.getHexString().toUpperCase()}`,
        };
        reliefs.set(layer.id, entry);
      }
      return entry;
    };

    const span = (current: [number, number] | null, low: number, high: number): [number, number] =>
      current ? [Math.min(current[0], low), Math.max(current[1], high)] : [low, high];

    /**
     * One piece of a layer — a glyph or a logo — as a group standing on the
     * surface, oriented to its normal, carrying the relief itself.
     */
    const piece = (layer: Layer, relief: LayerRelief, outlines: ReliefOutline[], key: string): THREE.Group => {
      const holder = new THREE.Group();
      const entry = report(layer, relief);
      entry.pieces++;
      // The layer's own appearance, or the part's (Phase 6a R2).
      const own = layerMaterials?.[layer.id] ?? material;
      if (relief.type === "printed") {
        // Ink on the surface: the outline, flat, in the layer's colour. No
        // depth, so nothing is extruded and nothing is carved.
        const geometry = cached(`${key}|printed|flat`, () => openingGeometry(outlines));
        holder.add(new THREE.Mesh(geometry, materials.decal(own)));
        return holder;
      }
      if (relief.type === "emboss") {
        const geometry = cached(`${key}|${reliefKey(relief)}|raised`, () => raisedGeometry(outlines, relief));
        geometry.computeBoundingBox();
        const box = geometry.boundingBox as THREE.Box3;
        entry.heightMm = span(entry.heightMm, box.max.z, box.max.z);
        holder.add(new THREE.Mesh(geometry, own));
        return holder;
      }
      const opening = cached(`${key}|${reliefKey(relief)}|opening`, () => openingGeometry(outlines));
      const walls = cached(`${key}|${reliefKey(relief)}|walls`, () => recessWallGeometry(outlines, relief));
      const floor = cached(`${key}|${reliefKey(relief)}|floor`, () => recessFloorGeometry(outlines, relief));
      const mask = new THREE.Mesh(opening, materials.mask);
      mask.renderOrder = ORDER.mask;
      const punch = new THREE.Mesh(opening, materials.punch);
      punch.renderOrder = ORDER.punch;
      // The fill of axis-design §3: colour on the floor and the walls, the
      // part's own plating left on the rim (which is the part, not ours).
      const interior = materials.interior(own);
      const wallMesh = new THREE.Mesh(walls, interior);
      wallMesh.renderOrder = ORDER.interior;
      const floorMesh = new THREE.Mesh(floor, interior);
      floorMesh.renderOrder = ORDER.interior;
      holder.add(mask, punch, wallMesh, floorMesh);
      floor.computeBoundingBox();
      walls.computeBoundingBox();
      const floorBox = floor.boundingBox as THREE.Box3;
      const wallBox = walls.boundingBox as THREE.Box3;
      entry.floorMm = span(entry.floorMm, floorBox.min.z, floorBox.min.z);
      entry.wallSpanMm = span(entry.wallSpanMm, wallBox.min.z, wallBox.max.z);
      entry.wallMeshes++;
      entry.openingMeshes += 2;
      return holder;
    };

    for (const layer of layers) {
      if (!layer.visible) continue;
      const relief = layerRelief(layer);
      if (isLogoLayer(layer)) {
        const source = logoSources[layer.id];
        if (!source) continue;
        const heightMm = logoHeightMm(layer);
        let holder: THREE.Group;
        let outlines: ReliefOutline[] = [];
        if (source.kind === "raster") {
          // A photograph or a full-colour logo is printed, not engraved (R2):
          // it has no outline to extrude, so it is always a decal.
          const texture = rasterTexture(source.url, () => setTextureVersion((v) => v + 1));
          if (!texture) continue;
          holder = new THREE.Group();
          const entry = report(layer, relief);
          entry.pieces++;
          const geometry = cached(`raster|${logoKey(source.url)}|${layer.content.width_mm}|${heightMm}`, () => new THREE.PlaneGeometry(layer.content.width_mm, heightMm));
          geometry.translate(0, 0, OPENING_LIFT_MM);
          holder.add(new THREE.Mesh(geometry, rasterMaterialFor(texture)));
        } else {
          const artwork = logoArtwork(source.svg);
          if (!artwork) continue;
          outlines = logoOutlines(artwork, layer.content.width_mm);
          holder = piece(layer, relief, outlines, `logo|${logoKey(source.svg)}|${layer.content.width_mm}`);
        }
        spin.setFromAxisAngle(Z, -layer.placement.rotation_deg * DEG);
        const { x, y } = layer.placement.centre_mm;
        // A logo is one flat sheet, not a row of small glyphs: tilting it to
        // the normal under its centre buries its far side in a domed face.
        // It conforms by sitting on the highest surface under its whole
        // footprint instead, parallel to the face (4k R3; E1 §6 R2 tilts what
        // is small enough to tilt).
        const placed = layer.placement.conform
          ? surfaceUnder(footprint(layer.content.width_mm, heightMm, x, y, layer.placement.rotation_deg))
          : { z: faceZ, conformed: false };
        holder.position.set(x, y, placed.z);
        holder.quaternion.copy(spin);
        holder.userData = { logo: layer.id, conformed: placed.conformed };
        group.add(holder);
        // The artwork's own footprint, measured off a flat copy: what the logo
        // covers on the face is the same whichever way its relief runs. A
        // raster fills its own rectangle, so its plane is the measurement.
        const flat = outlines.length ? openingGeometry(outlines) : new THREE.PlaneGeometry(layer.content.width_mm, heightMm);
        built.push(flat);
        flat.computeBoundingBox();
        const box = flat.boundingBox as THREE.Box3;
        logos.push({
          layerId: layer.id,
          widthMm: layer.content.width_mm,
          heightMm,
          measuredWidthMm: box.max.x - box.min.x,
          measuredHeightMm: box.max.y - box.min.y,
          areaMm2: triangleArea(flat),
          facing: frontFacing(flat),
          x,
          y,
          z: placed.z,
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
        const size = layer.style.text_size_mm;
        const outlines = glyphOutlines(font, char, size);
        if (outlines.length === 0) continue;
        const holder = piece(layer, relief, outlines, `glyph|${layer.content.font.key}|${char}|${size}`);
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
        holder.position.set(placed.x, placed.y, z);
        holder.quaternion.copy(spin);
        holder.userData = { layerId: layer.id, index: placed.index, char, conformed };
        group.add(holder);
      }
    }
    layoutVersion.current++;

    // Read back from the world matrices three.js will render with, not from the layout's own numbers.
    group.updateWorldMatrix(true, true);
    const position = new THREE.Vector3();
    for (const holder of group.children) {
      position.setFromMatrixPosition(holder.matrixWorld);
      up.set(0, 0, 1).transformDirection(holder.matrixWorld);
      const { layerId, logo, index, char, conformed } = holder.userData;
      const entry = reliefs.get(layerId ?? logo ?? "");
      if (entry && !entry.anchor) {
        entry.anchor = { x: position.x, y: position.y, z: position.z, nx: up.x, ny: up.y, nz: up.z };
      }
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
    onReport?.({
      glyphMeshCount: group.children.length - logos.length,
      logoMeshCount: logos.length,
      logos,
      reliefs: [...reliefs.values()],
      minWorldDeterminant,
      glyphs,
    });

    // Relief geometry is cached and shared; only the flat measuring copies are ours.
    return () => {
      for (const geometry of built) geometry.dispose();
    };
  }, [group, layers, logoSources, model, fonts, faceZ, material, layerMaterials, materials, textureVersion, onReport]);

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

/** A short, stable key per uploaded artwork, so the geometry cache isn't keyed by the whole file. */
const logoKeys = new Map<string, number>();
function logoKey(source: string): number {
  let key = logoKeys.get(source);
  if (key === undefined) {
    key = logoKeys.size + 1;
    logoKeys.set(source, key);
  }
  return key;
}
