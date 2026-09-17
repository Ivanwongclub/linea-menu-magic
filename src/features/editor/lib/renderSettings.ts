import { NeutralToneMapping, SRGBColorSpace } from "three";

/**
 * Colour pipeline (Phase 3b R1, recalibrated 3c). Khronos PBR Neutral tone
 * mapping, sRGB output. Exposure set once from the calibration run under the
 * procedural studio (lib/studioEnvironment.ts): #808080 → (128,128,128),
 * #C0392B → (192,58,45). Never ACES.
 */
export const TONE_MAPPING_EXPOSURE = 0.92;

export const GL_SETTINGS = {
  toneMapping: NeutralToneMapping,
  toneMappingExposure: TONE_MAPPING_EXPOSURE,
  outputColorSpace: SRGBColorSpace,
  // Engraved layers carve their recess with the stencil buffer (Phase 5 R2;
  // E1 §6 R4) — asked for explicitly, never left to the renderer's default.
  stencil: true,
} as const;

/**
 * A plain dielectric for non-metal colourways. 0.3 keeps the specular lobe
 * on the fill's falloff, which the calibration above depends on (0.5 lets
 * the dark surround in and crushes #C0392B's blue channel by ~5).
 */
export const NON_METAL_ROUGHNESS = 0.3;

/** Three-quarter view (R1, Phase 3). */
export const CAMERA_ELEVATION_DEG = 30;
export const CAMERA_AZIMUTH_DEG = -25;
export const TARGET_VIEWPORT_FILL = 0.6;
