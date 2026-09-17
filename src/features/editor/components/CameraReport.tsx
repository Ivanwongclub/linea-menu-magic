import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

/**
 * Camera read-back for the e2e framing check (R3, 4h): the canvas carries
 * `data-camera-direction` — the unit vector from the orbit target to the
 * camera, 3 dp — updated whenever it changes. `EditorModel` writes the framed
 * home direction to `data-camera-home` once per framing.
 */
export function CameraReport() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const controls = useThree((s) => s.controls) as { target?: Vector3 } | null;
  const scratch = useRef(new Vector3());
  const last = useRef("");

  useFrame(() => {
    const target = controls?.target;
    if (!target) return;
    const d = scratch.current.copy(camera.position).sub(target).normalize();
    const text = `${d.x.toFixed(3)},${d.y.toFixed(3)},${d.z.toFixed(3)}`;
    if (text === last.current) return;
    last.current = text;
    gl.domElement.dataset.cameraDirection = text;
  });
  return null;
}
