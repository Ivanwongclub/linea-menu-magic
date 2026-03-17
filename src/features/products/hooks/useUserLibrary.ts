import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserLibraryItem } from '../types';

interface UseUserLibraryResult {
  items: UserLibraryItem[];
  loading: boolean;
  error: string | null;
  toggleFavourite: (itemId: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
}

export function useUserLibrary(teamId: string): UseUserLibraryResult {
  const [items, setItems] = useState<UserLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!teamId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('user_library_items')
      .select(
        `
        *,
        products(
          id, item_code, name, name_en, slug, description, description_en,
          status, is_public, is_customizable, specifications,
          production, thumbnail_url, model_url, sort_order,
          created_at, updated_at,
          product_category_map(
            is_primary,
            product_categories(id, name, slug)
          ),
          product_certification_map(
            product_certifications(id, name, abbreviation)
          ),
          product_industry_map(
            product_industries(id, name, slug)
          )
        )
      `
      )
      .eq('team_id', teamId)
      .order('added_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setItems([]);
      setLoading(false);
      return;
    }

    const transformed: UserLibraryItem[] = (data ?? []).map((row) => {
      const r = row as unknown as Record<string, unknown>;
      const productData = r.products as Record<string, unknown> | null;

      return {
        id: r.id as string,
        product_id: r.product_id as string,
        team_id: r.team_id as string,
        team_name: r.team_name as string | undefined,
        custom_name: r.custom_name as string | undefined,
        custom_description: r.custom_description as string | undefined,
        custom_brand: r.custom_brand as string | undefined,
        custom_specs: r.custom_specs as Record<string, unknown> | undefined,
        notes: r.notes as string | undefined,
        is_favourite: r.is_favourite as boolean,
        added_at: r.added_at as string,
        added_by: r.added_by as string | undefined,
        product: productData
          ? {
              id: productData.id as string,
              item_code: productData.item_code as string,
              name: productData.name as string,
              name_en: productData.name_en as string | undefined,
              slug: productData.slug as string,
              description: productData.description as string | undefined,
              status: productData.status as 'draft' | 'active' | 'archived',
              is_public: productData.is_public as boolean,
              is_customizable: productData.is_customizable as boolean,
              specifications: productData.specifications as
                | Record<string, unknown>
                | undefined,
              production: productData.production as
                | Record<string, unknown>
                | undefined,
              thumbnail_url: productData.thumbnail_url as string | undefined,
              model_url: productData.model_url as string | undefined,
              sort_order: productData.sort_order as number,
              created_at: productData.created_at as string,
              updated_at: productData.updated_at as string,
            }
          : undefined,
      };
    });

    setItems(transformed);
    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const toggleFavourite = useCallback(
    async (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const newValue = !item.is_favourite;

      // Optimistic update
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, is_favourite: newValue } : i
        )
      );

      const { error: updateError } = await supabase
        .from('user_library_items')
        .update({ is_favourite: newValue })
        .eq('id', itemId);

      if (updateError) {
        // Revert on failure
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, is_favourite: !newValue } : i
          )
        );
      }
    },
    [items]
  );

  const removeItem = useCallback(async (itemId: string) => {
    const { error: deleteError } = await supabase
      .from('user_library_items')
      .delete()
      .eq('id', itemId);

    if (!deleteError) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  }, []);

  return { items, loading, error, toggleFavourite, removeItem };
}
