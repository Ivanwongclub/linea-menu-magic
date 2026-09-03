import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

export interface AdminProductDetail extends ProductRow {
  primary_category_id: string | null;
  compliance_standard_ids: string[];
}

interface RawDetail extends ProductRow {
  product_category_map: { category_id: string; is_primary: boolean }[];
  product_compliance_map: { standard_id: string }[];
}

export interface SaveProductInput {
  /** Column values for `products` — status/is_public included when an action sets them. */
  product: ProductUpdate;
  /** Chosen primary category; null leaves the mapping untouched. */
  primaryCategoryId: string | null;
  complianceStandardIds: string[];
}

const detailKey = (id: string) => ["admin-product", id] as const;

async function syncRelations(productId: string, input: SaveProductInput, currentCompliance: string[]) {
  if (input.primaryCategoryId) {
    // One primary category per product. Legacy secondary mappings (the old
    // editor allowed several) are kept, just demoted.
    const { error: upsertError } = await supabase
      .from("product_category_map")
      .upsert(
        { product_id: productId, category_id: input.primaryCategoryId, is_primary: true },
        { onConflict: "product_id,category_id" },
      );
    if (upsertError) throw upsertError;
    const { error: demoteError } = await supabase
      .from("product_category_map")
      .update({ is_primary: false })
      .eq("product_id", productId)
      .neq("category_id", input.primaryCategoryId);
    if (demoteError) throw demoteError;
  }

  const wanted = new Set(input.complianceStandardIds);
  const have = new Set(currentCompliance);
  const toAdd = [...wanted].filter((id) => !have.has(id));
  const toRemove = [...have].filter((id) => !wanted.has(id));
  if (toAdd.length > 0) {
    const { error } = await supabase
      .from("product_compliance_map")
      .insert(toAdd.map((standard_id) => ({ product_id: productId, standard_id })));
    if (error) throw error;
  }
  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("product_compliance_map")
      .delete()
      .eq("product_id", productId)
      .in("standard_id", toRemove);
    if (error) throw error;
  }
}

/** Single-product read + save for the editor. `id` undefined = creating. */
export function useAdminProduct(id: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: detailKey(id ?? "new"),
    enabled: !!id,
    queryFn: async (): Promise<AdminProductDetail> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_category_map ( category_id, is_primary ), product_compliance_map ( standard_id )")
        .eq("id", id!)
        .single();
      if (error) throw error;
      const raw = data as unknown as RawDetail;
      const maps = raw.product_category_map ?? [];
      const primary = maps.find((m) => m.is_primary) ?? maps[0];
      const { product_category_map: _c, product_compliance_map: _s, ...row } = raw;
      return {
        ...row,
        primary_category_id: primary?.category_id ?? null,
        compliance_standard_ids: (raw.product_compliance_map ?? []).map((m) => m.standard_id),
      };
    },
  });

  const invalidate = (productId: string) => {
    queryClient.invalidateQueries({ queryKey: detailKey(productId) });
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const save = useMutation({
    mutationFn: async (input: SaveProductInput) => {
      if (!id) throw new Error("save called without a product id");
      const { error } = await supabase.from("products").update(input.product).eq("id", id);
      if (error) throw error;
      await syncRelations(id, input, query.data?.compliance_standard_ids ?? []);
      return id;
    },
    onSuccess: invalidate,
  });

  const create = useMutation({
    mutationFn: async (input: SaveProductInput & { product: ProductInsert }) => {
      const { data, error } = await supabase.from("products").insert(input.product).select("id").single();
      if (error) throw error;
      await syncRelations(data.id, input, []);
      return data.id as string;
    },
    onSuccess: invalidate,
  });

  return { query, save, create };
}
