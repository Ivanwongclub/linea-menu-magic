import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Matrix4, Vector3 } from "three";

/**
 * Camera read-back for the e2e framing check (R3, 4h): the canvas carries
 * `data-camera-direction` — the unit vector from the orbit target to the
 * camera, 3 dp — and `data-camera-distance`, updated whenever they change. `EditorModel` writes the framed
 * home direction to `data-camera-home` once per framing. 4j: also
 * `data-view-projection` (column-major, 16 numbers), so a scenario can
 * project face-frame points onto its own screenshot.
 */
export function CameraReport() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const controls = useThree((s) => s.controls) as { target?: Vector3 } | null;
  const scratch = useRef(new Vector3());
  const viewProjection = useRef(new Matrix4());
  const last = useRef("");

  useFrame(() => {
    const target = controls?.target;
    if (!target) return;
    const offset = scratch.current.copy(camera.position).sub(target);
    // E2 U9: the distance too, so a scenario can tell zoom-to-fit (same
    // direction, solved distance) from reset view (the home direction back).
    const distance = offset.length();
    const d = offset.normalize();
    const text = `${d.x.toFixed(3)},${d.y.toFixed(3)},${d.z.toFixed(3)}`;
    const vp = viewProjection.current.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).elements.map((v) => +v.toPrecision(8)).join(",");
    const key = `${text}|${distance.toFixed(3)}|${vp}`;
    if (key === last.current) return;
    last.current = key;
    gl.domElement.dataset.cameraDirection = text;
    gl.domElement.dataset.cameraDistance = distance.toFixed(3);
    gl.domElement.dataset.viewProjection = vp;
  });
  return null;
}
