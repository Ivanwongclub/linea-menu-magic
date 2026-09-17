import * as THREE from "three";

/**
 * Procedural studio (Phase 3c R1), rendered once through PMREMGenerator.
 * Neutral dark surround, one large key softbox above-left, a weaker fill
 * to the right, a thin rim strip top-back. Softboxes fall off smoothly
 * toward their edges so a flat mirror shows one gradient, not a hard line.
 *
 * Directions use the camera's convention: elevation above the horizon,
 * azimuth from +Z toward +X (the decorated face points +Z; −X is the
 * viewer's left).
 */
export interface Softbox {
  elevationDeg: number;
  azimuthDeg: number;
  /** Angular size, degrees. */
  widthDeg: number;
  heightDeg: number;
  /** Linear radiance at the centre. */
  intensity: number;
  /** Fraction of each half-extent over which radiance falls to 0. */
  feather: number;
}

export interface StudioConfig {
  surround: number;
  key: Softbox;
  fill: Softbox;
  rim: Softbox;
}

/**
 * Tuned by sweep (docs/3d-editor/STATUS.md, Phase 3c) against three targets
 * at once: a bright nickel flat disc reads surround ≈ #323232 → highlight
 * ≈ #EEEEEE in one gradient; a #808080 dielectric disc renders (128,128,128)
 * and #C0392B renders (192,58,45). The fill is placed so the disc's
 * reflection lands on its falloff — that is what makes the gradient, and
 * what gives a dielectric the ~4% specular PBR Neutral tone mapping expects.
 */
export const STUDIO: StudioConfig = {
  surround: 0.17,
  key: { elevationDeg: 40, azimuthDeg: -50, widthDeg: 70, heightDeg: 55, intensity: 10.5, feather: 0.6 },
  fill: { elevationDeg: -28, azimuthDeg: 64, widthDeg: 80, heightDeg: 90, intensity: 8.5, feather: 1.0 },
  rim: { elevationDeg: 55, azimuthDeg: 180, widthDeg: 90, heightDeg: 8, intensity: 3, feather: 0.5 },
};

/** Softboxes sit at RADIUS; the surround sphere is far outside so large panels never clip into it. */
const RADIUS = 10;
const SURROUND_RADIUS = 200;

function direction(elevationDeg: number, azimuthDeg: number): THREE.Vector3 {
  const e = THREE.MathUtils.degToRad(elevationDeg);
  const a = THREE.MathUtils.degToRad(azimuthDeg);
  return new THREE.Vector3(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a));
}

function softboxMesh(box: Softbox): THREE.Mesh {
  const width = 2 * RADIUS * Math.tan(THREE.MathUtils.degToRad(Math.min(box.widthDeg, 170) / 2));
  const height = 2 * RADIUS * Math.tan(THREE.MathUtils.degToRad(Math.min(box.heightDeg, 170) / 2));
  const geometry = new THREE.PlaneGeometry(width, height, 48, 48);
  const position = geometry.getAttribute("position");
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const u = Math.abs(position.getX(i)) / (width / 2);
    const v = Math.abs(position.getY(i)) / (height / 2);
    const edge = 1 - box.feather;
    const fu = 1 - THREE.MathUtils.smoothstep(u, edge, 1);
    const fv = 1 - THREE.MathUtils.smoothstep(v, edge, 1);
    const k = box.intensity * fu * fv;
    colors[i * 3] = k;
    colors[i * 3 + 1] = k;
    colors[i * 3 + 2] = k;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(direction(box.elevationDeg, box.azimuthDeg).multiplyScalar(RADIUS));
  mesh.lookAt(0, 0, 0);
  return mesh;
}

export function buildStudioScene(config: StudioConfig = STUDIO): THREE.Scene {
  const scene = new THREE.Scene();
  const surround = new THREE.Mesh(
    new THREE.SphereGeometry(SURROUND_RADIUS, 32, 16),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color().setRGB(config.surround, config.surround, config.surround, THREE.LinearSRGBColorSpace),
      side: THREE.BackSide,
      toneMapped: false,
    }),
  );
  scene.add(surround, softboxMesh(config.key), softboxMesh(config.fill), softboxMesh(config.rim));
  return scene;
}

export function disposeScene(scene: THREE.Scene): void {
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
  });
}
