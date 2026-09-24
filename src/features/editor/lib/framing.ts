import { MathUtils, Vector3, type PerspectiveCamera } from "three";
import { CAMERA_AZIMUTH_DEG, CAMERA_ELEVATION_DEG, TARGET_VIEWPORT_FILL } from "./renderSettings";

/** The model's own box in mm, as `PartsReport` carries it. */
export interface BoundsMm {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

/**
 * Framing (Phase 3 R1), extracted in E2 U9 so that the load framing and the
 * cluster's zoom-to-fit solve the same distance the same way. The numbers are
 * unchanged — `render-calibration` measures this loop, and its baselines are
 * what prove the extraction was faithful.
 */

/** The three-quarter view the model is first framed in. */
export function homeDirection(): Vector3 {
  const elevation = MathUtils.degToRad(CAMERA_ELEVATION_DEG);
  const azimuth = MathUtils.degToRad(CAMERA_AZIMUTH_DEG);
  return new Vector3(Math.cos(elevation) * Math.sin(azimuth), Math.sin(elevation), Math.cos(elevation) * Math.cos(azimuth));
}

export function cornersOf(bounds: BoundsMm): Vector3[] {
  return [0, 1, 2, 3, 4, 5, 6, 7].map(
    (i) => new Vector3(i & 1 ? bounds.maxX : bounds.minX, i & 2 ? bounds.maxY : bounds.minY, i & 4 ? bounds.maxZ : bounds.minZ),
  );
}

export function centreOf(bounds: BoundsMm): Vector3 {
  return new Vector3((bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2, (bounds.minZ + bounds.maxZ) / 2);
}

/** The box's diagonal — where the solve starts, and what bounds it. */
export function diagonalOf(bounds: BoundsMm): number {
  return Math.max(new Vector3(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, bounds.maxZ - bounds.minZ).length(), 1);
}

/**
 * The distance along `direction` at which the box's projection fills
 * `TARGET_VIEWPORT_FILL` of the limiting viewport dimension. Six fixed
 * iterations rather than a solve: the projection is monotone in distance, and
 * a fixed count is reproducible frame to frame, which a convergence test is
 * not.
 *
 * The camera is moved while solving; the caller places it at the answer.
 */
export function fitDistance(camera: PerspectiveCamera, centre: Vector3, corners: Vector3[], direction: Vector3, startDistance: number): number {
  let distance = startDistance;
  const ndc = new Vector3();
  for (let i = 0; i < 6; i++) {
    camera.position.copy(centre).addScaledVector(direction, distance);
    camera.lookAt(centre);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const c of corners) {
      ndc.copy(c).project(camera);
      minX = Math.min(minX, ndc.x);
      maxX = Math.max(maxX, ndc.x);
      minY = Math.min(minY, ndc.y);
      maxY = Math.max(maxY, ndc.y);
    }
    const fill = Math.max(maxX - minX, maxY - minY) / 2;
    if (fill <= 0) break;
    distance *= fill / TARGET_VIEWPORT_FILL;
  }
  return distance;
}
