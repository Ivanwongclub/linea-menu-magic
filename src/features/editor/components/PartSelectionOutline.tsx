import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { toCreasedNormals } from "three-stdlib";
import { BackSide, BufferGeometry, Color, Vector2, type Mesh } from "three";

const COLOUR = "#2563eb";
const VERTEX_SHADER = `
  uniform vec2 viewportSize;
  void main() {
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec2 direction = (projectionMatrix * vec4(normalMatrix * normal, 0.0)).xy;
    direction /= max(length(direction), 0.0001);
    clip.xy += direction * 2.0 / viewportSize * 2.0 * clip.w;
    gl_Position = clip;
  }
`;
const FRAGMENT_SHADER = `
  uniform vec3 outlineColour;
  void main() {
    gl_FragColor = vec4(outlineColour, 1.0);
    #include <colorspace_fragment>
  }
`;

/** View-only overlay: never added to the measured model or its face/part indices. */
export function PartSelectionOutline({ mesh }: { mesh: Mesh }) {
  const { width, height } = useThree((state) => state.size);
  const uniforms = useMemo(() => ({
    viewportSize: { value: new Vector2(width, height) },
    outlineColour: { value: new Color(COLOUR) },
  }), [width, height]);
  const matrix = useMemo(() => {
    mesh.updateWorldMatrix(true, false);
    return mesh.matrixWorld.clone();
  }, [mesh]);
  const silhouette = useMemo(() => {
    // Smooth a separate position-only copy; source normals, UVs and zone masks stay intact.
    const copy = new BufferGeometry();
    copy.setAttribute("position", mesh.geometry.getAttribute("position").clone());
    if (mesh.geometry.index) copy.setIndex(mesh.geometry.index.clone());
    const result = toCreasedNormals(copy, Math.PI);
    if (result !== copy) copy.dispose();
    return result;
  }, [mesh]);
  useEffect(() => () => silhouette.dispose(), [silhouette]);

  return (
    <group matrix={matrix} matrixAutoUpdate={false}>
      {/* A two-pixel silhouette also identifies rounded parts with no sharp edges. */}
      <mesh geometry={silhouette} raycast={() => null} renderOrder={1000}>
        <shaderMaterial
          vertexShader={VERTEX_SHADER}
          fragmentShader={FRAGMENT_SHADER}
          uniforms={uniforms}
          side={BackSide}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Keep open borders and facets readable without exposing every triangulation edge. */}
      <Edges geometry={mesh.geometry} threshold={25} color={COLOUR} lineWidth={1.5}
        transparent depthWrite={false} toneMapped={false} renderOrder={1001} />
    </group>
  );
}
