import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  ProductCategory,
  ProductMaterial,
  ProductIndustry,
  ProductCertification,
  ProductTag,
} from '../types';

interface TaxonomyData {
  categories: ProductCategory[];
  materials: ProductMaterial[];
  industries: ProductIndustry[];
  certifications: ProductCertification[];
  tags: ProductTag[];
  loading: boolean;
}

const cache: {
  data: Omit<TaxonomyData, 'loading'> | null;
} = { data: null };

export function useProductTaxonomy(): TaxonomyData {
  const [loading, setLoading] = useState(!cache.data);
  const [data, setData] = useState<Omit<TaxonomyData, 'loading'>>(
    cache.data ?? {
      categories: [],
      materials: [],
      industries: [],
      certifications: [],
      tags: [],
    }
  );
  const fetched = useRef(!!cache.data);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchAll = async () => {
      const [catRes, matRes, indRes, certRes, tagRes] = await Promise.all([
        supabase
          .from('product_categories')
          .select('id, name, slug, sort_order, icon_url')
          .order('sort_order'),
        supabase
          .from('product_materials')
          .select('id, name, slug, is_sustainable')
          .order('name'),
        supabase
          .from('product_industries')
          .select('id, name, slug, sort_order')
          .order('sort_order'),
        supabase
          .from('product_certifications')
          .select('id, name, abbreviation, logo_url')
          .order('name'),
        supabase
          .from('product_tags')
          .select('id, name, slug, color')
          .order('slug'),
      ]);

      const result: Omit<TaxonomyData, 'loading'> = {
        categories: (catRes.data ?? []) as ProductCategory[],
        materials: (matRes.data ?? []) as ProductMaterial[],
        industries: (indRes.data ?? []) as ProductIndustry[],
        certifications: (certRes.data ?? []) as ProductCertification[],
        tags: (tagRes.data ?? []) as ProductTag[],
      };

      cache.data = result;
      setData(result);
      setLoading(false);
    };

    fetchAll();
  }, []);

  return { ...data, loading };
}
