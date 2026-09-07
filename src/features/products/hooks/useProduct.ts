import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  ComplianceStandard,
  Product,
  ProductAttachment,
  ProductColour,
  ProductFinish,
  ProductMaterial,
  ProductSizeVariant,
} from '../types';

interface UseProductResult {
  product: Product | null;
  loading: boolean;
  error: string | null;
}

type Row = Record<string, unknown>;

/**
 * Everything the detail page needs, in one round trip.
 *
 * Two embeds are aliased because `products` reaches `product_materials`
 * twice (directly via `material_id`, and through `product_material_map`);
 * without the alias PostgREST refuses the query as ambiguous.
 *
 * Row-level security does the filtering: a viewer who may not see the
 * product gets no row, and finishes that are not public come back with a
 * null embed, which the mapper drops.
 */
const PRODUCT_SELECT = `
  *,
  product_category_map(
    is_primary,
    product_categories(id, name, name_zh_hant, name_zh_hans, slug, family_id, sort_order, icon_url)
  ),
  product_material_map(
    product_materials(id, name, name_zh_hant, name_zh_hans, slug, is_sustainable, is_metal)
  ),
  material:product_materials!material_id(
    id, name, name_zh_hant, name_zh_hans, slug, is_sustainable, is_metal
  ),
  attachment:product_attachments!attachment_id(id, code, name, name_zh_hant, name_zh_hans),
  product_compliance_map(
    compliance_standards(id, code, name, name_zh_hant, name_zh_hans, sort_order)
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
  product_images(id, url, sort_order, alt_text, is_primary),
  product_size_variants(
    id, size_label, size_ligne, size_primary_mm, size_secondary_mm,
    thickness_mm, weight_g, is_default, sort_order
  ),
  product_colours(id, name, name_zh_hant, name_zh_hans, hex, sort_order),
  product_finishes(
    sort_order,
    finishes(
      id, cyc_code, marketing_name, marketing_name_zh_hant, marketing_name_zh_hans,
      factory_name_en, hex_approx, swatch_url, is_public, is_standard,
      metalness, roughness, anisotropy, sort_order
    )
  )
`;

const rows = (value: unknown): Row[] => (Array.isArray(value) ? (value as Row[]) : []);
const num = (value: unknown): number => (typeof value === 'number' ? value : 0);
const str = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

function toMaterial(m: Row): ProductMaterial {
  return {
    id: m.id as string,
    name: m.name as string,
    name_zh_hant: (m.name_zh_hant as string | null) ?? null,
    name_zh_hans: (m.name_zh_hans as string | null) ?? null,
    slug: (m.slug as string | null) ?? '',
    is_sustainable: (m.is_sustainable as boolean) ?? false,
    is_metal: (m.is_metal as boolean) ?? false,
  };
}

function transformProduct(row: Row, defaultFinishId: string | null): Product {
  const categoryMaps = rows(row.product_category_map);
  const categories = categoryMaps
    .map((m) => m.product_categories as Row | null)
    .filter((c): c is Row => !!c)
    .map((c) => ({
      id: c.id as string,
      name: c.name as string,
      name_zh_hant: (c.name_zh_hant as string | null) ?? null,
      name_zh_hans: (c.name_zh_hans as string | null) ?? null,
      slug: c.slug as string,
      family_id: (c.family_id as string | null) ?? null,
      sort_order: num(c.sort_order),
      icon_url: str(c.icon_url),
    }));

  const primaryMap = categoryMaps.find((m) => m.is_primary === true);
  const primaryCategoryId = (primaryMap?.product_categories as Row | null)?.id as string | undefined;
  const primaryCategory = primaryCategoryId
    ? categories.find((c) => c.id === primaryCategoryId)
    : categories[0];

  // Legacy many-to-many; `material` below is the authoritative one.
  const materials = rows(row.product_material_map)
    .map((m) => m.product_materials as Row | null)
    .filter((m): m is Row => !!m)
    .map(toMaterial);

  const materialRow = row.material as Row | null;
  const attachmentRow = row.attachment as Row | null;

  const attachment: ProductAttachment | null = attachmentRow
    ? {
        id: attachmentRow.id as string,
        code: attachmentRow.code as string,
        name: attachmentRow.name as string,
        name_zh_hant: (attachmentRow.name_zh_hant as string | null) ?? null,
        name_zh_hans: (attachmentRow.name_zh_hans as string | null) ?? null,
      }
    : null;

  const complianceStandards: ComplianceStandard[] = rows(row.product_compliance_map)
    .map((m) => m.compliance_standards as Row | null)
    .filter((c): c is Row => !!c)
    .map((c) => ({
      id: c.id as string,
      code: c.code as string,
      name: c.name as string,
      name_zh_hant: (c.name_zh_hant as string | null) ?? null,
      name_zh_hans: (c.name_zh_hans as string | null) ?? null,
      sort_order: num(c.sort_order),
    }))
    .sort((a, b) => a.sort_order - b.sort_order || a.code.localeCompare(b.code))
    .map(({ sort_order: _order, ...standard }) => standard);

  const sizeVariants: ProductSizeVariant[] = rows(row.product_size_variants)
    .map((v) => ({
      id: v.id as string,
      size_label: (v.size_label as string | null) ?? null,
      size_ligne: (v.size_ligne as number | null) ?? null,
      size_primary_mm: num(v.size_primary_mm),
      size_secondary_mm: (v.size_secondary_mm as number | null) ?? null,
      thickness_mm: (v.thickness_mm as number | null) ?? null,
      weight_g: (v.weight_g as number | null) ?? null,
      is_default: (v.is_default as boolean) ?? false,
      sort_order: num(v.sort_order),
    }))
    .sort((a, b) => a.sort_order - b.sort_order || a.size_primary_mm - b.size_primary_mm);

  const colours: ProductColour[] = rows(row.product_colours)
    .map((c) => ({
      id: c.id as string,
      name: c.name as string,
      name_zh_hant: (c.name_zh_hant as string | null) ?? null,
      name_zh_hans: (c.name_zh_hans as string | null) ?? null,
      hex: (c.hex as string | null) ?? null,
      sort_order: num(c.sort_order),
    }))
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));

  // A null embed means the finish is not public and this viewer may not see
  // it. Attachment order ties often, so fall back to the finish's own order.
  type AttachedFinish = ProductFinish & { finish_sort_order: number };
  const finishes: ProductFinish[] = rows(row.product_finishes)
    .flatMap<AttachedFinish>((pf) => {
      const f = pf.finishes as Row | null;
      if (!f) return [];
      return [{
        id: f.id as string,
        cyc_code: (f.cyc_code as string | null) ?? null,
        marketing_name: f.marketing_name as string,
        marketing_name_zh_hant: (f.marketing_name_zh_hant as string | null) ?? null,
        marketing_name_zh_hans: (f.marketing_name_zh_hans as string | null) ?? null,
        factory_name_en: f.factory_name_en as string,
        hex_approx: (f.hex_approx as string | null) ?? null,
        swatch_url: (f.swatch_url as string | null) ?? null,
        is_public: (f.is_public as boolean) ?? false,
        is_standard: (f.is_standard as boolean) ?? false,
        metalness: num(f.metalness),
        roughness: num(f.roughness),
        anisotropy: num(f.anisotropy),
        attached_sort_order: num(pf.sort_order),
        is_default: !!defaultFinishId && f.id === defaultFinishId,
        finish_sort_order: num(f.sort_order),
      }];
    })
    .sort(
      (a, b) =>
        a.attached_sort_order - b.attached_sort_order ||
        a.finish_sort_order - b.finish_sort_order ||
        (a.cyc_code ?? '').localeCompare(b.cyc_code ?? ''),
    )
    .map(({ finish_sort_order: _order, ...finish }) => finish);

  return {
    id: row.id as string,
    item_code: row.item_code as string,
    name: row.name as string,
    name_zh_hant: (row.name_zh_hant as string | null) ?? null,
    name_zh_hans: (row.name_zh_hans as string | null) ?? null,
    name_en: str(row.name_en),
    slug: row.slug as string,
    description: str(row.description),
    description_zh_hant: (row.description_zh_hant as string | null) ?? null,
    description_zh_hans: (row.description_zh_hans as string | null) ?? null,
    description_en: str(row.description_en),
    status: row.status as Product['status'],
    is_public: row.is_public as boolean,
    is_customizable: row.is_customizable as boolean,
    brand_id: (row.brand_id as string | null) ?? null,
    specifications: row.specifications as Record<string, unknown> | undefined,
    production: row.production as Record<string, unknown> | undefined,
    thumbnail_url: str(row.thumbnail_url),
    model_url: str(row.model_url),
    sort_order: num(row.sort_order),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,

    material_id: (row.material_id as string | null) ?? null,
    attachment_id: (row.attachment_id as string | null) ?? null,
    default_finish_id: defaultFinishId,
    face_style: (row.face_style as string | null) ?? null,
    hole_count: (row.hole_count as number | null) ?? null,
    logo_customisable: (row.logo_customisable as boolean) ?? false,
    tensile_strength: (row.tensile_strength as string | null) ?? null,
    wash_resistance: (row.wash_resistance as string | null) ?? null,
    origin: (row.origin as string | null) ?? null,
    sample_time_days: (row.sample_time_days as number | null) ?? null,
    nickel_release_compliant: (row.nickel_release_compliant as boolean | null) ?? null,
    moq_qty: (row.moq_qty as number | null) ?? null,
    moq_unit: (row.moq_unit as string | null) ?? null,
    lead_time_min_days: (row.lead_time_min_days as number | null) ?? null,
    lead_time_max_days: (row.lead_time_max_days as number | null) ?? null,

    categories,
    primary_category: primaryCategory,
    materials,
    material: materialRow ? toMaterial(materialRow) : null,
    attachment,
    compliance_standards: complianceStandards,
    size_variants: sizeVariants,
    colours,
    finishes,
    industries: rows(row.product_industry_map)
      .map((m) => m.product_industries as Row | null)
      .filter((i): i is Row => !!i)
      .map((i) => ({
        id: i.id as string,
        name: i.name as string,
        slug: i.slug as string,
        sort_order: num(i.sort_order),
      })),
    certifications: rows(row.product_certification_map)
      .map((m) => m.product_certifications as Row | null)
      .filter((c): c is Row => !!c)
      .map((c) => ({
        id: c.id as string,
        name: c.name as string,
        abbreviation: (c.abbreviation as string) ?? '',
        logo_url: str(c.logo_url),
      })),
    tags: rows(row.product_tag_map)
      .map((m) => m.product_tags as Row | null)
      .filter((t): t is Row => !!t)
      .map((t) => ({
        id: t.id as string,
        name: t.name as string,
        slug: t.slug as string,
        color: (t.color as 'black' | 'gray' | 'white') ?? 'black',
      })),
    images: rows(row.product_images)
      .map((img) => ({
        id: img.id as string,
        url: img.url as string,
        sort_order: num(img.sort_order),
        alt_text: str(img.alt_text),
        is_primary: (img.is_primary as boolean) ?? false,
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
  };
}

async function fetchProductBySlug(slug: string): Promise<Product | null> {
  // maybeSingle, not single: a product this viewer may not see (a brand's
  // private product, a draft) is "not found", not an error.
  const { data, error: queryError } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .maybeSingle();

  if (queryError) {
    throw new Error(queryError.message);
  }

  if (!data) {
    return null;
  }

  const row = data as unknown as Row;
  return transformProduct(row, (row.default_finish_id as string | null) ?? null);
}

export function useProduct(slug: string): UseProductResult {
  const query = useQuery<Product | null, Error>({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug),
    enabled: Boolean(slug),
    placeholderData: (previous) => previous,
  });

  return {
    product: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
  };
}
