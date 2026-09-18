import { useEffect, useMemo } from "react";
import type * as THREE from "three";
import { customPaintMaterial, finishMaterial } from "../lib/finishMaterial";
import { layerAppearance, type Layer, type LayerAppearance } from "../lib/recipe";
import type { PickerFinish } from "./useFinishOptions";

/**
 * The material each layer renders in (Phase 6a R2): the part's own material
 * for `part` (null here — `BrandingMeshes` falls back to it), the chosen
 * finish's for `plated`, `paint` and `printed`, and a matt enamel
 * approximation for a custom colour.
 *
 * Keyed by what the appearance actually is, so two layers in the same black
 * enamel share one material and a drag rebuilds nothing.
 */
export function appearanceKey(appearance: LayerAppearance): string | null {
  if (appearance.mode === "part") return null;
  if (appearance.custom) return `custom:${appearance.custom.hex}`;
  return appearance.finish_id ? `${appearance.mode === "plated" ? "plated" : "paint"}:${appearance.finish_id}` : null;
}

export function useLayerMaterials(layers: Layer[], finishes: PickerFinish[] | undefined): Record<string, THREE.MeshPhysicalMaterial> {
  const byId = useMemo(() => new Map((finishes ?? []).map((f) => [f.id, f])), [finishes]);

  const built = useMemo(() => {
    const materials = new Map<string, THREE.MeshPhysicalMaterial>();
    for (const layer of layers) {
      const appearance = layerAppearance(layer);
      const key = appearanceKey(appearance);
      if (!key || materials.has(key)) continue;
      if (appearance.custom) {
        materials.set(key, customPaintMaterial(appearance.custom.hex));
        continue;
      }
      const finish = appearance.finish_id ? byId.get(appearance.finish_id) : undefined;
      // A finish the catalogue no longer offers renders as the part until the
      // buyer picks again — never as a guessed colour.
      if (finish) materials.set(key, finishMaterial(finish));
    }
    return materials;
  }, [layers, byId]);

  useEffect(() => {
    return () => {
      for (const material of built.values()) material.dispose();
    };
  }, [built]);

  return useMemo(() => {
    const perLayer: Record<string, THREE.MeshPhysicalMaterial> = {};
    for (const layer of layers) {
      const key = appearanceKey(layerAppearance(layer));
      const material = key ? built.get(key) : undefined;
      if (material) perLayer[layer.id] = material;
    }
    return perLayer;
  }, [layers, built]);
}
