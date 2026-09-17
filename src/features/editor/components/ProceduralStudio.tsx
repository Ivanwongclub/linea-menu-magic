import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PMREMGenerator } from "three";
import { buildStudioScene, disposeScene, STUDIO, type StudioConfig } from "../lib/studioEnvironment";

/** Bakes the procedural studio into `scene.environment` once per renderer (Phase 3c R1). No download. */
export function ProceduralStudio({ config = STUDIO }: { config?: StudioConfig }) {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const studio = buildStudioScene(config);
    const target = pmrem.fromScene(studio, 0.02, 0.1, 500);
    const previous = scene.environment;
    scene.environment = target.texture;
    return () => {
      scene.environment = previous;
      target.dispose();
      pmrem.dispose();
      disposeScene(studio);
    };
  }, [gl, scene, config]);

  return null;
}
