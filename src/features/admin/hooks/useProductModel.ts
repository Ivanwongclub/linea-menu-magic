import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "product-models";

function invalidate(queryClient: ReturnType<typeof useQueryClient>, productId: string) {
  queryClient.invalidateQueries({ queryKey: ["admin-product", productId] });
  queryClient.invalidateQueries({ queryKey: ["admin-products"] });
}

/**
 * The .obj upload for `products.model_storage_path` (bucket `product-models`,
 * created in Phase 1). Mirrors `useProductImages`: storage object first, then
 * the row — an orphan file is recoverable, an orphan reference is not.
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

      const { error: updateError } = await supabase.from("products").update({ model_storage_path: path }).eq("id", productId);
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
