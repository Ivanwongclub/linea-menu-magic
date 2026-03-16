import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '../types';

interface UseProductResult {
  product: Product | null;
  loading: boolean;
  error: string | null;
}

export function useProduct(slug: string): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('products')
        .select(
          `
          *,
          product_category_map(
            is_primary,
            product_categories(id, name, slug, sort_order, icon_url)
          ),
          product_material_map(
            product_materials(id, name, slug, is_sustainable)
          ),
          product_industry_map(
            product_industries(id, name, slug, sort_order)
          ),
          product_certification_map(
            product_certifications(id, name, abbreviation, logo_url)
          ),
          product_tag_map(
            product_tags(id, name, slug, color)
          ),
          product_images(id, url, sort_order, alt_text, is_primary)
        `
        )
        .eq('slug', slug)
        .single();

      if (controller.signal.aborted) return;

      if (queryError) {
        setError(queryError.message);
        setProduct(null);
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Product not found');
        setProduct(null);
        setLoading(false);
        return;
      }

      const row = data as unknown as Record<string, unknown>;

      // Extract categories
      const categoryMaps =
        (row.product_category_map as Record<string, unknown>[]) ?? [];
      const categories = categoryMaps
        .map((m) => m.product_categories as Record<string, unknown> | null)
        .filter(Boolean)
        .map((c) => ({
          id: c!.id as string,
          name: c!.name as string,
          slug: c!.slug as string,
          sort_order: (c!.sort_order as number) ?? 0,
          icon_url: c!.icon_url as string | undefined,
        }));

      const primaryMap = categoryMaps.find((m) => m.is_primary === true);
      const primaryCategory = primaryMap
        ? categories.find(
            (c) =>
              c.id ===
              (
                (primaryMap.product_categories as Record<string, unknown> | null)
                  ?.id as string
              )
          )
        : categories[0];

      // Extract materials
      const materialMaps =
        (row.product_material_map as Record<string, unknown>[]) ?? [];
      const materials = materialMaps
        .map((m) => m.product_materials as Record<string, unknown> | null)
        .filter(Boolean)
        .map((m) => ({
          id: m!.id as string,
          name: m!.name as string,
          slug: m!.slug as string,
          is_sustainable: (m!.is_sustainable as boolean) ?? false,
        }));

      // Extract industries
      const industryMaps =
        (row.product_industry_map as Record<string, unknown>[]) ?? [];
      const industries = industryMaps
        .map((m) => m.product_industries as Record<string, unknown> | null)
        .filter(Boolean)
        .map((i) => ({
          id: i!.id as string,
          name: i!.name as string,
          slug: i!.slug as string,
          sort_order: (i!.sort_order as number) ?? 0,
        }));

      // Extract certifications
      const certMaps =
        (row.product_certification_map as Record<string, unknown>[]) ?? [];
      const certifications = certMaps
        .map(
          (m) => m.product_certifications as Record<string, unknown> | null
        )
        .filter(Boolean)
        .map((c) => ({
          id: c!.id as string,
          name: c!.name as string,
          abbreviation: c!.abbreviation as string,
          logo_url: c!.logo_url as string | undefined,
        }));

      // Extract tags
      const tagMaps =
        (row.product_tag_map as Record<string, unknown>[]) ?? [];
      const tags = tagMaps
        .map((m) => m.product_tags as Record<string, unknown> | null)
        .filter(Boolean)
        .map((t) => ({
          id: t!.id as string,
          name: t!.name as string,
          slug: t!.slug as string,
          color: (t!.color as 'black' | 'gray' | 'white') ?? 'black',
        }));

      // Extract images
      const rawImages =
        (row.product_images as Record<string, unknown>[]) ?? [];
      const images = rawImages
        .map((img) => ({
          id: img.id as string,
          url: img.url as string,
          sort_order: (img.sort_order as number) ?? 0,
          alt_text: img.alt_text as string | undefined,
          is_primary: (img.is_primary as boolean) ?? false,
        }))
        .sort((a, b) => a.sort_order - b.sort_order);

      setProduct({
        id: row.id as string,
        item_code: row.item_code as string,
        name: row.name as string,
        name_en: row.name_en as string | undefined,
        slug: row.slug as string,
        description: row.description as string | undefined,
        description_en: row.description_en as string | undefined,
        status: row.status as Product['status'],
        is_public: row.is_public as boolean,
        is_customizable: row.is_customizable as boolean,
        specifications: row.specifications as Record<string, unknown> | undefined,
        production: row.production as Record<string, unknown> | undefined,
        thumbnail_url: row.thumbnail_url as string | undefined,
        model_url: row.model_url as string | undefined,
        sort_order: row.sort_order as number,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
        categories,
        primary_category: primaryCategory,
        materials,
        industries,
        certifications,
        tags,
        images,
      });
      setLoading(false);
    };

    fetchProduct();

    return () => controller.abort();
  }, [slug]);

  return { product, loading, error };
}
