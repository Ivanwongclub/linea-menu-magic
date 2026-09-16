import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { PMREMGenerator } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Fixed, neutral studio lighting baked locally from three's own
 * `RoomEnvironment` via `PMREMGenerator` — no network fetch, never a drei
 * `preset` (those resolve to a remote CDN HDRI at runtime; E0 §5/§8).
 * Metals are unreadable without an environment map, and a varying one
 * would make the same finish look different on different pages
 * (architecture Part 7).
 */
export function StudioEnvironment() {
  const { gl, scene } = useThree();
  const pmrem = useMemo(() => new PMREMGenerator(gl), [gl]);

  useEffect(() => {
    const target = pmrem.fromScene(new RoomEnvironment(), 0.04);
    const previous = scene.environment;
    scene.environment = target.texture;
    return () => {
      scene.environment = previous;
      target.dispose();
    };
  }, [pmrem, scene]);

  useEffect(() => () => pmrem.dispose(), [pmrem]);

  return null;
}
