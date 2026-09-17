import * as THREE from "three";

/**
 * Antique two-tone (Phase 3c R2, oxide colour 3e R2). High points are buffed
 * metal — the finish's own base colour and roughness — and recesses are oxide:
 * the row's `oxide_color_hex` (chart L*, derived in the database) at
 * OXIDE_ROUGHNESS, mixed per fragment by the baked `occlusion` attribute
 * (lib/ambientOcclusion.ts). A mesh without the attribute reads occlusion 0,
 * i.e. buffed everywhere. A row without an oxide colour falls back to
 * base × OXIDE_FACTOR, the 3c oxide.
 *
 * Phase 5: the chunks are applied by `lib/shaderPatch.ts`, which owns the
 * single `onBeforeCompile` and the program cache key (E1 §6 R7).
 */
export const OXIDE_FACTOR = 0.25;
export const OXIDE_ROUGHNESS = 0.55;
/** Occlusion below the first edge is fully buffed, above the second fully oxide. */
export const OXIDE_RAMP: [number, number] = [0.08, 0.45];

interface Shader {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: unknown }>;
}

/** The row's oxide colour, or the 3c fallback derived from the material's own base. */
export function oxideColor(material: THREE.MeshPhysicalMaterial, oxideColorHex?: string | null): THREE.Color {
  return oxideColorHex ? new THREE.Color(oxideColorHex) : material.color.clone().multiplyScalar(OXIDE_FACTOR);
}

export function twoToneVertexChunks(shader: Shader): void {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nattribute float occlusion;\nvarying float vOcclusion;")
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvOcclusion = occlusion;");
}

export function twoToneFragmentChunks(shader: Shader, oxide: THREE.Color): void {
  shader.uniforms.oxideColor = { value: oxide };
  shader.uniforms.oxideRoughness = { value: OXIDE_ROUGHNESS };
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nuniform vec3 oxideColor;\nuniform float oxideRoughness;\nvarying float vOcclusion;")
    .replace(
      "vec4 diffuseColor = vec4( diffuse, opacity );",
      `float oxideMix = smoothstep( ${OXIDE_RAMP[0].toFixed(3)}, ${OXIDE_RAMP[1].toFixed(3)}, vOcclusion );\n\tvec4 diffuseColor = vec4( mix( diffuse, oxideColor, oxideMix ), opacity );`,
    )
    .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n\troughnessFactor = mix( roughnessFactor, oxideRoughness, oxideMix );");
}
