import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseObjFileRawBounds, type ModelRawBounds } from "@/features/admin/lib/objBounds";

const BUCKET = "product-models";

export type ScaleMethod = "unit_mm" | "known_dimension" | "two_point";

export interface ProductModelScale {
  model_raw_bounds: ModelRawBounds | null;
  model_scale_status: "confirmed" | "unconfirmed";
  model_scale_factor: number | null;
  model_scale_method: ScaleMethod | null;
  model_scale_reference_variant_id: string | null;
  model_scale_confirmed_at: string | null;
  model_scale_confirmed_by: string | null;
}

export interface ProductSizeVariantOption {
  id: string;
  size_label: string | null;
  size_primary_mm: number;
  is_default: boolean;
}

function scaleQueryKey(productId: string) {
  return ["admin-product-model-scale", productId];
}
function variantsQueryKey(productId: string) {
  return ["admin-product-model-scale-variants", productId];
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>, productId: string) {
  queryClient.invalidateQueries({ queryKey: ["admin-product", productId] });
  queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  queryClient.invalidateQueries({ queryKey: scaleQueryKey(productId) });
}

/**
 * The .obj upload for `products.model_storage_path` (bucket `product-models`,
 * created in Phase 1). Mirrors `useProductImages`: storage object first, then
 * the row — an orphan file is recoverable, an orphan reference is not.
 *
 * Phase 4a: the raw AABB is parsed client-side (`OBJLoader.parse` on the
 * `File` text, no viewer) after a successful upload and written as
 * `model_raw_bounds` in the same row update that sets `model_storage_path`
 * (E1 collision 12). The `products_reset_model_scale` trigger (Phase 4a)
 * clears any previous confirmation, factor, method and branding marks
 * whenever `model_storage_path` changes, so replace/remove never inherit a
 * stale scale (collision 13).
 */
export function useProductModel(productId: string) {
  const queryClient = useQueryClient();

  const upload = useMutation({
    mutationFn: async ({ file, previousPath }: { file: File; previousPath: string | null }) => {
      const path = `models/${productId}/${Date.now()}.obj`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: "model/obj",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      let rawBounds: ModelRawBounds;
      try {
        rawBounds = await parseObjFileRawBounds(file);
      } catch (err) {
        // The storage object is already written (recoverable orphan); the row
        // is left untouched rather than referencing a file with no bounds.
        throw new Error(`Uploaded, but couldn't read its geometry: ${err instanceof Error ? err.message : String(err)}`);
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({ model_storage_path: path, model_raw_bounds: rawBounds })
        .eq("id", productId);
      if (updateError) throw updateError;

      if (previousPath) {
        await supabase.storage.from(BUCKET).remove([previousPath]);
      }
      return path;
    },
    onSuccess: () => invalidate(queryClient, productId),
  });

  const remove = useMutation({
    mutationFn: async (path: string) => {
      const { error: updateError } = await supabase.from("products").update({ model_storage_path: null }).eq("id", productId);
      if (updateError) throw updateError;
      await supabase.storage.from(BUCKET).remove([path]);
    },
    onSuccess: () => invalidate(queryClient, productId),
  });

  return { upload, remove };
}

/**
 * Phase 4a scale confirmation: the product's raw bounds/confirmation state,
 * its size variants (for the reference-variant picker, Q2: defaults to the
 * default variant), and the two write paths — confirm the proposed unit
 * interpretation, or calibrate against a typed known dimension (spec §7/§16).
 * Two-point calibration is Phase 4c.
 */
export function useProductModelScale(productId: string) {
  const queryClient = useQueryClient();

  const scale = useQuery({
    queryKey: scaleQueryKey(productId),
    queryFn: async (): Promise<ProductModelScale> => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "model_raw_bounds, model_scale_status, model_scale_factor, model_scale_method, model_scale_reference_variant_id, model_scale_confirmed_at, model_scale_confirmed_by",
        )
        .eq("id", productId)
        .single();
      if (error) throw error;
      return data as unknown as ProductModelScale;
    },
  });

  const variants = useQuery({
    queryKey: variantsQueryKey(productId),
    queryFn: async (): Promise<ProductSizeVariantOption[]> => {
      const { data, error } = await supabase
        .from("product_size_variants")
        .select("id, size_label, size_primary_mm, is_default")
        .eq("product_id", productId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  async function confirmedByFields() {
    const { data } = await supabase.auth.getUser();
    return {
      model_scale_confirmed_at: new Date().toISOString(),
      model_scale_confirmed_by: data.user?.id ?? null,
    };
  }

  const confirmUnitScale = useMutation({
    mutationFn: async ({ factor, referenceVariantId }: { factor: number; referenceVariantId: string }) => {
      const { error } = await supabase
        .from("products")
        .update({
          model_scale_factor: factor,
          model_scale_status: "confirmed",
          model_scale_method: "unit_mm",
          model_scale_reference_variant_id: referenceVariantId,
          ...(await confirmedByFields()),
        })
        .eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(queryClient, productId),
  });

  const calibrateKnownDimension = useMutation({
    mutationFn: async ({ knownMm, primaryRawUnits, referenceVariantId }: { knownMm: number; primaryRawUnits: number; referenceVariantId: string }) => {
      const factor = knownMm / primaryRawUnits;
      const { error } = await supabase
        .from("products")
        .update({
          model_scale_factor: factor,
          model_scale_status: "confirmed",
          model_scale_method: "known_dimension",
          model_scale_reference_variant_id: referenceVariantId,
          ...(await confirmedByFields()),
        })
        .eq("id", productId);
      if (error) throw error;
      return factor;
    },
    onSuccess: () => invalidate(queryClient, productId),
  });

  return { scale, variants, confirmUnitScale, calibrateKnownDimension };
}
