import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserLibraryItem, DownloadableFile } from '../types';

const ADMIN_DEFAULT_TEAM_ID = '00000000-0000-0000-0000-000000000000';

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
        product:products (
          id, item_code, name, name_en,
          slug, description,
          thumbnail_url, model_url,
          is_customizable, is_public, status,
          specifications, production, sort_order,
          created_at, updated_at,
          product_category_map (
            is_primary,
            product_categories (
              id, name, slug
            )
          ),
          product_certification_map (
            product_certifications (
              id, name, abbreviation
            )
          )
        )
      `
      )
      .or(`team_id.eq.${teamId},is_admin_default.eq.true`)
      .order('is_admin_default', { ascending: false })
      .order('added_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setItems([]);
      setLoading(false);
      return;
    }

    const transformed: UserLibraryItem[] = (data ?? []).map((row) => {
      const r = row as unknown as Record<string, unknown>;
      const productRaw = r.product as Record<string, unknown> | null;

      // Parse category maps
      let categories: { id: string; name: string; slug: string; sort_order: number }[] = [];
      let primaryCategory: { id: string; name: string; slug: string; sort_order: number } | undefined;

      if (productRaw) {
        const catMaps = (productRaw.product_category_map ?? []) as Array<{
          is_primary: boolean;
          product_categories: { id: string; name: string; slug: string } | null;
        }>;
        categories = catMaps
          .filter((m) => m.product_categories)
          .map((m) => ({ ...m.product_categories!, sort_order: 0 }));
        const primary = catMaps.find((m) => m.is_primary && m.product_categories);
        primaryCategory = primary?.product_categories ? { ...primary.product_categories, sort_order: 0 } : categories[0];
      }

      // Parse certifications
      let certifications: { id: string; name: string; abbreviation: string }[] = [];
      if (productRaw) {
        const certMaps = (productRaw.product_certification_map ?? []) as Array<{
          product_certifications: { id: string; name: string; abbreviation: string } | null;
        }>;
        certifications = certMaps
          .filter((m) => m.product_certifications)
          .map((m) => m.product_certifications!);
      }

      const isAdminDefault = r.is_admin_default as boolean;
      const downloadableFiles = (r.downloadable_files ?? []) as DownloadableFile[];

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
        is_admin_default: isAdminDefault,
        downloadable_files: downloadableFiles,
        added_at: r.added_at as string,
        added_by: r.added_by as string | undefined,
        section: isAdminDefault ? 'WIN-CYC Collection' : 'My Library',
        product: productRaw
          ? {
              id: productRaw.id as string,
              item_code: productRaw.item_code as string,
              name: productRaw.name as string,
              name_en: productRaw.name_en as string | undefined,
              slug: productRaw.slug as string,
              description: productRaw.description as string | undefined,
              status: productRaw.status as 'draft' | 'active' | 'archived',
              is_public: productRaw.is_public as boolean,
              is_customizable: productRaw.is_customizable as boolean,
              specifications: productRaw.specifications as Record<string, unknown> | undefined,
              production: productRaw.production as Record<string, unknown> | undefined,
              thumbnail_url: productRaw.thumbnail_url as string | undefined,
              model_url: productRaw.model_url as string | undefined,
              sort_order: productRaw.sort_order as number,
              created_at: productRaw.created_at as string,
              updated_at: productRaw.updated_at as string,
              categories,
              primary_category: primaryCategory as any,
              certifications: certifications as any[],
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
