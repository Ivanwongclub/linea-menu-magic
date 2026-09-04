import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductFinishLink {
  finish_id: string;
  sort_order: number;
}

const key = (productId: string) => ["admin-product-finishes", productId] as const;

/**
 * product_finishes is keyed by (product_id, finish_id) — no `id` column, so
 * no default to protect. Every write here is subject to the metal gate:
 * check_finish_requires_metal_material rejects the insert unless the
 * product's material is flagged is_metal, and the message it raises is
 * relayed to the editor verbatim.
 */
export function useProductFinishes(productId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: key(productId),
    queryFn: async (): Promise<ProductFinishLink[]> => {
      const { data, error } = await supabase
        .from("product_finishes")
        .select("finish_id, sort_order")
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

  const attach = useMutation({
    mutationFn: async ({ finishId, sortOrder }: { finishId: string; sortOrder: number }) => {
      const { error } = await supabase
        .from("product_finishes")
        .insert({ product_id: productId, finish_id: finishId, sort_order: sortOrder });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const detach = useMutation({
    mutationFn: async ({ finishId, wasDefault }: { finishId: string; wasDefault: boolean }) => {
      // The default selector is limited to attached finishes; keep the
      // database consistent with that by clearing it before the link goes.
      if (wasDefault) {
        const { error } = await supabase.from("products").update({ default_finish_id: null }).eq("id", productId);
        if (error) throw error;
      }
      const { error } = await supabase
        .from("product_finishes")
        .delete()
        .eq("product_id", productId)
        .eq("finish_id", finishId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: async (finishIdsInOrder: string[]) => {
      const results = await Promise.all(
        finishIdsInOrder.map((finish_id, sort_order) =>
          supabase
            .from("product_finishes")
            .update({ sort_order })
            .eq("product_id", productId)
            .eq("finish_id", finish_id),
        ),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: invalidate,
  });

  const setDefault = useMutation({
    mutationFn: async (finishId: string | null) => {
      const { error } = await supabase.from("products").update({ default_finish_id: finishId }).eq("id", productId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { query, attach, detach, reorder, setDefault };
}
