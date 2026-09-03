import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminProductStatus = "draft" | "active" | "archived";

export interface AdminProductRow {
  id: string;
  item_code: string | null;
  name: string;
  slug: string;
  status: AdminProductStatus | string;
  is_public: boolean;
  brand_id: string | null;
  brand_name: string | null;
  material_id: string | null;
  material_name: string | null;
  primary_category: { id: string; name: string; family_id: string | null } | null;
  updated_at: string;
}

interface RawRow {
  id: string;
  item_code: string | null;
  name: string;
  slug: string;
  status: string;
  is_public: boolean;
  brand_id: string | null;
  material_id: string | null;
  updated_at: string;
  brands: { id: string; name: string } | null;
  material: { id: string; name: string } | null;
  product_category_map: {
    is_primary: boolean;
    product_categories: { id: string; name: string; family_id: string | null } | null;
  }[];
}

const QUERY_KEY = ["admin-products"] as const;

/**
 * Admin-side product listing. Deliberately NOT the storefront `useProducts`
 * hook — that one hard-filters `status = 'active'`, which is exactly the
 * thing an editor needs to see past. Catalogue editors read every row via
 * RLS, brand-owned (customer catalogue) rows included, so the brand comes
 * back with each row to keep them distinguishable in the list.
 */
export function useAdminProducts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<AdminProductRow[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          id, item_code, name, slug, status, is_public, brand_id, material_id, updated_at,
          brands:brand_id ( id, name ),
          material:material_id ( id, name ),
          product_category_map ( is_primary, product_categories ( id, name, family_id ) )
        `,
        )
        .order("updated_at", { ascending: false });
      if (error) throw error;

      // Distinct on product id — the count and the list must both reflect
      // products, never product×category pairs.
      const byId = new Map<string, AdminProductRow>();
      for (const row of (data ?? []) as unknown as RawRow[]) {
        if (byId.has(row.id)) continue;
        // Primary category, falling back to the first mapped one — same
        // convention as the storefront's transformProduct().
        const maps = row.product_category_map ?? [];
        const primary = maps.find((m) => m.is_primary)?.product_categories ?? maps[0]?.product_categories ?? null;
        byId.set(row.id, {
          id: row.id,
          item_code: row.item_code,
          name: row.name,
          slug: row.slug,
          status: row.status,
          is_public: row.is_public,
          brand_id: row.brand_id,
          brand_name: row.brands?.name ?? null,
          material_id: row.material_id,
          material_name: row.material?.name ?? null,
          primary_category: primary,
          updated_at: row.updated_at,
        });
      }
      return [...byId.values()];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const setStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: AdminProductStatus }) => {
      const { error } = await supabase.from("products").update({ status }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  /** Publish = status 'active' AND is_public true — what actually makes a house product visible. */
  const publish = useMutation({
    mutationFn: async ({ ids }: { ids: string[] }) => {
      const { error } = await supabase
        .from("products")
        .update({ status: "active", is_public: true })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { query, setStatus, publish };
}
