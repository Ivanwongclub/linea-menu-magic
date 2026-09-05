import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { resizeImage } from "@/features/images/resizeImage";
import { removeFromBucket, storagePathFromPublicUrl, uploadToBucket } from "@/features/images/storage";

export type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];

export interface UploadOutcome {
  name: string;
  ok: boolean;
  error?: string;
}

const key = (productId: string) => ["admin-product-images", productId] as const;

/** "Name", then "Name 2", "Name 3", … — five images all reading the same alt help nobody. */
export function defaultAltText(productName: string, index: number): string {
  return index === 0 ? productName : `${productName} ${index + 1}`;
}

export function useProductImages(productId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: key(productId),
    queryFn: async (): Promise<ProductImageRow[]> => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: key(productId) });
    queryClient.invalidateQueries({ queryKey: ["admin-product", productId] });
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  };

  /** Resize in the browser, upload the master, insert the row. Sequential so sort_order is stable. */
  const upload = useMutation({
    mutationFn: async ({ files, productName }: { files: File[]; productName: string }) => {
      const existing = query.data ?? [];
      const outcomes: UploadOutcome[] = [];
      let index = existing.length;
      for (const file of files) {
        try {
          const resized = await resizeImage(file);
          const path = `images/${productId}/${Date.now()}-${index}.${resized.ext}`;
          const url = await uploadToBucket(path, resized.blob, resized.contentType);
          // No `id` key on the insert row — the default must apply.
          const { error } = await supabase.from("product_images").insert({
            product_id: productId,
            url,
            sort_order: index,
            is_primary: index === 0,
            alt_text: defaultAltText(productName, index),
          });
          if (error) throw error;
          outcomes.push({ name: file.name, ok: true });
          index += 1;
        } catch (err) {
          outcomes.push({ name: file.name, ok: false, error: err instanceof Error ? err.message : String(err) });
        }
      }
      return outcomes;
    },
    onSuccess: invalidate,
  });

  const setPrimary = useMutation({
    mutationFn: async (imageId: string) => {
      const { error: clearError } = await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
      if (clearError) throw clearError;
      const { error } = await supabase.from("product_images").update({ is_primary: true }).eq("id", imageId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const saveOrderAndAlt = useMutation({
    mutationFn: async (rows: { id: string; sort_order: number; alt_text: string | null }[]) => {
      const results = await Promise.all(
        rows.map((r) => supabase.from("product_images").update({ sort_order: r.sort_order, alt_text: r.alt_text }).eq("id", r.id)),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: invalidate,
  });

  /**
   * Storage object FIRST, then the row. An orphan file is recoverable; an
   * orphan row is a broken image on a customer's screen.
   */
  const remove = useMutation({
    mutationFn: async (row: ProductImageRow): Promise<{ fileWasGone: boolean }> => {
      const path = storagePathFromPublicUrl(row.url);
      let fileWasGone = false;
      if (path) fileWasGone = !(await removeFromBucket(path));
      const { error } = await supabase.from("product_images").delete().eq("id", row.id);
      if (error) throw error;
      // If the deleted row was primary, promote the first remaining image.
      if (row.is_primary) {
        const { data: rest } = await supabase
          .from("product_images")
          .select("id")
          .eq("product_id", productId)
          .order("sort_order")
          .limit(1);
        if (rest?.[0]) await supabase.from("product_images").update({ is_primary: true }).eq("id", rest[0].id);
      }
      return { fileWasGone };
    },
    onSuccess: invalidate,
  });

  return { query, upload, setPrimary, saveOrderAndAlt, remove };
}
