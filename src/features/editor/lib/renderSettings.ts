import { NeutralToneMapping, SRGBColorSpace } from "three";

/**
 * Colour pipeline (Phase 3b R1). Khronos PBR Neutral tone mapping: a base
 * colour lit by a white environment of unit radiance renders as that same
 * sRGB value, which is what `render-calibration.mjs` checks. Never ACES —
 * it shifts hue and crushes saturated darks. Exposure is set once, from the
 * calibration run: with the HDRI at ENVIRONMENT_ROTATION_Y the camera-facing
 * disc already receives unit irradiance, so 1.0 reproduces #808080 as
 * (128,127,128) and #C0392B as (193,56,43) — within ±1 of the input.
 */
export const TONE_MAPPING_EXPOSURE = 1.0;

export const GL_SETTINGS = {
  toneMapping: NeutralToneMapping,
  toneMappingExposure: TONE_MAPPING_EXPOSURE,
  outputColorSpace: SRGBColorSpace,
} as const;

/**
 * public/env/studio.hdr — fixed. Swept 0–360° in 30° steps then 150–180° in
 * 5°: at 160° a bright nickel face reflects the cyclorama's curve as a soft
 * diagonal gradient; 150° shows a flat's hard edge, 170°+ goes flat white,
 * 0–90° reflects the dark studio floor (R2).
 */
export const STUDIO_HDRI = "/env/studio.hdr";
export const ENVIRONMENT_ROTATION_Y = (160 * Math.PI) / 180;

/** A plain dielectric for non-metal colourways — no PBR data exists for a colour row. */
export const NON_METAL_ROUGHNESS = 0.5;

/** Three-quarter view (R1, Phase 3). */
export const CAMERA_ELEVATION_DEG = 30;
export const CAMERA_AZIMUTH_DEG = -25;
export const TARGET_VIEWPORT_FILL = 0.6;
