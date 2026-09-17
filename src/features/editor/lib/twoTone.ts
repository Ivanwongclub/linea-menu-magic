import * as THREE from "three";

/**
 * Antique two-tone (Phase 3c R2). High points are buffed metal — the
 * finish's own base colour and roughness — and recesses are oxide: the same
 * base × OXIDE_FACTOR at OXIDE_ROUGHNESS, mixed per fragment by the baked
 * `occlusion` attribute (lib/ambientOcclusion.ts). A mesh without the
 * attribute reads occlusion 0, i.e. buffed everywhere.
 */
export const OXIDE_FACTOR = 0.25;
export const OXIDE_ROUGHNESS = 0.55;
/** Occlusion below the first edge is fully buffed, above the second fully oxide. */
export const OXIDE_RAMP: [number, number] = [0.08, 0.45];

export function applyTwoTone(material: THREE.MeshPhysicalMaterial): void {
  const oxide = material.color.clone().multiplyScalar(OXIDE_FACTOR);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.oxideColor = { value: oxide };
    shader.uniforms.oxideRoughness = { value: OXIDE_ROUGHNESS };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float occlusion;\nvarying float vOcclusion;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvOcclusion = occlusion;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 oxideColor;\nuniform float oxideRoughness;\nvarying float vOcclusion;")
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        `float oxideMix = smoothstep( ${OXIDE_RAMP[0].toFixed(3)}, ${OXIDE_RAMP[1].toFixed(3)}, vOcclusion );\n\tvec4 diffuseColor = vec4( mix( diffuse, oxideColor, oxideMix ), opacity );`,
      )
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n\troughnessFactor = mix( roughnessFactor, oxideRoughness, oxideMix );");
  };
  material.customProgramCacheKey = () => "wincyc-two-tone";
}
