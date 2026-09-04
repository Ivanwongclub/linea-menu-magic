import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ColourRow = Database["public"]["Tables"]["product_colours"]["Row"];

export interface ColourWrite {
  id?: string;
  name: string;
  name_zh_hant: string | null;
  name_zh_hans: string | null;
  hex: string | null;
  sort_order: number;
}

const key = (productId: string) => ["admin-product-colours", productId] as const;

export function useProductColours(productId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: key(productId),
    queryFn: async (): Promise<ColourRow[]> => {
      const { data, error } = await supabase
        .from("product_colours")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  /** Whole-list save: delete removed, upsert existing, insert new. */
  const saveAll = useMutation({
    mutationFn: async ({ rows, removedIds }: { rows: ColourWrite[]; removedIds: string[] }) => {
      if (removedIds.length > 0) {
        const { error } = await supabase.from("product_colours").delete().in("id", removedIds);
        if (error) throw error;
      }
      const existing = rows.filter((r): r is ColourWrite & { id: string } => !!r.id);
      const fresh = rows.filter((r) => !r.id);
      if (existing.length > 0) {
        const { error } = await supabase
          .from("product_colours")
          .upsert(existing.map((r) => ({ ...r, product_id: productId })), { onConflict: "id" });
        if (error) throw error;
      }
      if (fresh.length > 0) {
        // Strip the `id` KEY on inserts — a present-but-undefined key is
        // listed in postgrest-js's `columns=` param and written as null,
        // defeating gen_random_uuid(). (Same bug as the Phase 5 sizes fix.)
        const { error } = await supabase
          .from("product_colours")
          .insert(fresh.map(({ id: _omit, ...r }) => ({ ...r, product_id: productId })));
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(productId) }),
  });

  return { query, saveAll };
}
