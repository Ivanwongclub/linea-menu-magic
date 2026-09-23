import type { PickerFinish } from "../hooks/useFinishOptions";
import type { EditorColour, EditorProduct, EditorSizeVariant } from "../hooks/useEditorProduct";

/**
 * What a saved version freezes (Phase 1 R2, extended by Phase 4a R3): a
 * denormalised copy of every entity the recipe points at, so rendering a
 * version never reads a live row. A finish recalibrated next month, a product
 * renamed, a scale re-confirmed — none of them move a version that was already
 * saved, which is the whole reason the column exists.
 *
 * Kept pure and free of runtime imports so the unit test can read it directly.
 */
export const SNAPSHOT_VERSION = 1;

/** The material columns `finishMaterial` reads — the ones that decide what the version looks like. */
export interface SnapshotFinishMaterial {
  base_color_hex: string | null;
  hex_approx: string | null;
  metalness: number;
  roughness: number;
  anisotropy: number;
  clearcoat: number | null;
  clearcoat_roughness: number | null;
  two_tone: boolean;
  oxide_color_hex: string | null;
  /** `brushForSurface` keys off the surface code, so the code is part of the material. */
  surface_code: string | null;
}

export interface VersionSnapshot {
  snapshot_version: number;
  saved_at: string;
  product: { id: string; slug: string; name: string; item_code: string; is_metal: boolean };
  finish: { id: string; cyc_code: string | null; marketing_name: string | null; material: SnapshotFinishMaterial } | null;
  size_variant: { id: string; size_label: string | null; size_ligne: number | null; size_primary_mm: number } | null;
  colour: { id: string; name: string; hex: string | null } | null;
  /**
   * The OBJ this version renders from and how it is scaled. `sha256` is null
   * until something hashes the file — the editor never reads its bytes (see
   * this phase's open questions).
   */
  model: {
    storage_path: string | null;
    sha256: string | null;
    scale_factor: number | null;
    scale_status: string;
    scale_reference_variant_id: string | null;
    branding_group_indices: number[];
  };
}

function finishMaterialOf(finish: PickerFinish): SnapshotFinishMaterial {
  return {
    base_color_hex: finish.base_color_hex ?? null,
    hex_approx: finish.hex_approx ?? null,
    metalness: finish.metalness,
    roughness: finish.roughness,
    anisotropy: finish.anisotropy,
    clearcoat: finish.clearcoat ?? null,
    clearcoat_roughness: finish.clearcoat_roughness ?? null,
    two_tone: !!finish.two_tone,
    oxide_color_hex: finish.oxide_color_hex ?? null,
    surface_code: finish.surface?.code ?? null,
  };
}

export function buildSnapshot({
  product,
  finish,
  sizeVariant,
  colour,
  savedAt,
}: {
  product: EditorProduct;
  finish: PickerFinish | null;
  sizeVariant: EditorSizeVariant | null;
  colour: EditorColour | null;
  savedAt: string;
}): VersionSnapshot {
  return {
    snapshot_version: SNAPSHOT_VERSION,
    saved_at: savedAt,
    product: { id: product.id, slug: product.slug, name: product.name, item_code: product.item_code, is_metal: product.is_metal },
    // A non-metal product has a colourway, not a finish; storing the picker's
    // fallback finish there would claim a plating nobody chose.
    finish:
      finish && product.is_metal
        ? { id: finish.id, cyc_code: finish.cyc_code ?? null, marketing_name: finish.marketing_name ?? null, material: finishMaterialOf(finish) }
        : null,
    size_variant: sizeVariant
      ? {
          id: sizeVariant.id,
          size_label: sizeVariant.size_label,
          size_ligne: sizeVariant.size_ligne,
          size_primary_mm: sizeVariant.size_primary_mm,
        }
      : null,
    colour: colour && !product.is_metal ? { id: colour.id, name: colour.name, hex: colour.hex } : null,
    model: {
      storage_path: product.model_storage_path,
      sha256: null,
      scale_factor: product.model_scale_factor,
      scale_status: product.model_scale_status,
      scale_reference_variant_id: product.model_scale_reference_variant_id,
      branding_group_indices: [...product.model_branding_group_indices],
    },
  };
}
