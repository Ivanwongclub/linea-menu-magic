import * as THREE from "three";
import type { PickerFinish } from "../hooks/useFinishOptions";
import type { LayerAppearance } from "./recipe";
import { applyShaderPatches, brushForSurface, type ZoneStyle } from "./shaderPatch";
import { NON_METAL_ROUGHNESS } from "./renderSettings";

/**
 * One finish row → one material, for the part and for a layer alike
 * (Phase 6a R2). The database derives every appearance column (3b–3e for
 * plated rows, the coating table for painted ones), so this reads the row
 * rather than deriving anything: colour, metalness, roughness, anisotropy and
 * clearcoat, plus the two-tone and brushed shader patches through the one
 * composer (E1 §6 R7).
 */
export function finishMaterial(finish: PickerFinish, zones: ZoneStyle[] | null = null): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    color: finish.base_color_hex ?? finish.hex_approx ?? "#9a9a9a",
    metalness: finish.metalness,
    roughness: finish.roughness,
    anisotropy: finish.anisotropy,
    anisotropyRotation: 0,
    clearcoat: finish.clearcoat ?? 0,
    clearcoatRoughness: finish.clearcoat_roughness ?? 0,
  });
  applyShaderPatches(material, {
    twoTone: !!finish.two_tone,
    twoToneOxideHex: finish.oxide_color_hex,
    brush: brushForSurface(finish.surface?.code, finish.anisotropy),
    zones,
  });
  return material;
}

/** A non-metal product's colourway: a plain dielectric (Phase 3b). */
export function colourMaterial(hex: string | null | undefined, zones: ZoneStyle[] | null = null): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({ color: hex ?? "#9a9a9a", metalness: 0, roughness: NON_METAL_ROUGHNESS });
  applyShaderPatches(material, { zones });
  return material;
}

/**
 * What a zone renders as (Phase 6b R2): the finish's own appearance columns,
 * or a custom colour's matt enamel approximation. Null while nothing is
 * chosen — the zone then renders as the part, not as a guess.
 */
export function zoneStyleFor(appearance: LayerAppearance, finishById: Map<string, PickerFinish>): ZoneStyle | null {
  if (appearance.custom) {
    return { colorHex: appearance.custom.hex, metalness: CUSTOM_PAINT.metalness, roughness: CUSTOM_PAINT.roughness };
  }
  const finish = appearance.finish_id ? finishById.get(appearance.finish_id) : undefined;
  if (!finish) return null;
  return {
    colorHex: finish.base_color_hex ?? finish.hex_approx ?? "#9a9a9a",
    metalness: finish.metalness,
    roughness: finish.roughness,
  };
}

/**
 * A custom colour (R3): a matt enamel approximation, because that is the
 * coating WIN-CYC would mix a Pantone into — the values are MATT_ENAMEL's
 * from the coating table, and the colour is the buyer's own approximation,
 * which is why it always carries "to be confirmed".
 */
export const CUSTOM_PAINT = { metalness: 0, roughness: 0.6, clearcoat: 0 } as const;

export function customPaintMaterial(hex: string): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    color: hex,
    metalness: CUSTOM_PAINT.metalness,
    roughness: CUSTOM_PAINT.roughness,
    clearcoat: CUSTOM_PAINT.clearcoat,
  });
  applyShaderPatches(material, {});
  return material;
}
