import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Color } from "three";
import { useEditorStore } from "../store/useEditorStore";

/** Paints the WebGL clear colour so the canvas matches the view-only background chip. */
export function ViewportBackground() {
  const hex = useEditorStore((s) => s.viewportBackgroundHex);
  const { gl, scene } = useThree();

  useEffect(() => {
    const colour = new Color(hex);
    const previous = scene.background;
    scene.background = colour;
    gl.setClearColor(colour, 1);
    return () => {
      scene.background = previous;
    };
  }, [gl, scene, hex]);

  return null;
}
