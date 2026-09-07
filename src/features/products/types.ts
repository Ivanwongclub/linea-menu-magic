export type ProductStatus = 'draft' | 'active' | 'archived';

export type ProductCategory = {
  id: string;
  name: string;
  name_zh_hant?: string | null;
  name_zh_hans?: string | null;
  slug: string;
  family_id?: string | null;
  sort_order: number;
  icon_url?: string;
};

export type ProductMaterial = {
  id: string;
  name: string;
  name_zh_hant?: string | null;
  name_zh_hans?: string | null;
  slug: string;
  is_sustainable: boolean;
  /** Drives the finish gate: only metal products may carry finishes. */
  is_metal?: boolean;
};

/** How a trim attaches (shank, sew-through, prong…). `products.attachment_id`. */
export type ProductAttachment = {
  id: string;
  code: string;
  name: string;
  name_zh_hant?: string | null;
  name_zh_hans?: string | null;
};

/** M1 compliance standard, attached through `product_compliance_map`. */
export type ComplianceStandard = {
  id: string;
  code: string;
  name: string;
  name_zh_hant?: string | null;
  name_zh_hans?: string | null;
};

/**
 * One size of a product. Weight and thickness are properties of a SIZE,
 * never of the product, so they live here and nowhere else.
 */
export type ProductSizeVariant = {
  id: string;
  size_label?: string | null;
  size_ligne?: number | null;
  size_primary_mm: number;
  size_secondary_mm?: number | null;
  thickness_mm?: number | null;
  weight_g?: number | null;
  is_default: boolean;
  sort_order: number;
};

/** A named colour on a non-metal product. */
export type ProductColour = {
  id: string;
  name: string;
  name_zh_hant?: string | null;
  name_zh_hans?: string | null;
  hex?: string | null;
  sort_order: number;
};

/**
 * A finish attached to a metal product. Structurally satisfies
 * `FinishMaterial` from `@/features/finishes/swatch`, so it renders through
 * the shared swatch module without adaptation.
 */
export type ProductFinish = {
  id: string;
  cyc_code?: string | null;
  marketing_name: string;
  marketing_name_zh_hant?: string | null;
  marketing_name_zh_hans?: string | null;
  factory_name_en: string;
  hex_approx: string | null;
  swatch_url?: string | null;
  is_public: boolean;
  is_standard: boolean;
  metalness: number;
  roughness: number;
  anisotropy: number;
  /** Order of this attachment on the product (`product_finishes.sort_order`). */
  attached_sort_order: number;
  /** True when the product names this as its `default_finish_id`. */
  is_default: boolean;
};

export type ProductIndustry = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type ProductCertification = {
  id: string;
  name: string;
  abbreviation: string;
  logo_url?: string;
};

export type ProductTag = {
  id: string;
  name: string;
  slug: string;
  color: 'black' | 'gray' | 'white';
};

export type ProductImage = {
  id: string;
  url: string;
  sort_order: number;
  alt_text?: string;
  is_primary: boolean;
};

export type Product = {
  id: string;
  item_code: string;
  /** English base since the trilingual migration. Render via `localizedName`. */
  name: string;
  name_zh_hant?: string | null;
  name_zh_hans?: string | null;
  /** @deprecated legacy override, mirrors `name`. Retired in M5 Step 2. */
  name_en?: string;
  slug: string;
  description?: string;
  description_zh_hant?: string | null;
  description_zh_hans?: string | null;
  /** @deprecated legacy override, mirrors `description`. Retired in M5 Step 2. */
  description_en?: string;
  status: ProductStatus;
  is_public: boolean;
  is_customizable: boolean;
  brand_id?: string | null;
  /** @deprecated untyped blob, replaced by the typed columns below. */
  specifications?: Record<string, unknown>;
  /** @deprecated untyped blob, replaced by the typed columns below. */
  production?: Record<string, unknown>;
  thumbnail_url?: string;
  model_url?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;

  // Typed specification columns (M1). Absent means absent: render nothing.
  material_id?: string | null;
  attachment_id?: string | null;
  default_finish_id?: string | null;
  face_style?: string | null;
  hole_count?: number | null;
  logo_customisable?: boolean;
  tensile_strength?: string | null;
  wash_resistance?: string | null;
  origin?: string | null;
  sample_time_days?: number | null;
  nickel_release_compliant?: boolean | null;
  moq_qty?: number | null;
  moq_unit?: string | null;
  lead_time_min_days?: number | null;
  lead_time_max_days?: number | null;

  // Joined relations
  categories?: ProductCategory[];
  primary_category?: ProductCategory;
  /** Legacy many-to-many. Read `material` first — see `resolveProductMaterials`. */
  materials?: ProductMaterial[];
  /** The authoritative material, from `material_id`. */
  material?: ProductMaterial | null;
  attachment?: ProductAttachment | null;
  compliance_standards?: ComplianceStandard[];
  size_variants?: ProductSizeVariant[];
  colours?: ProductColour[];
  /** Attached finishes the viewer may see; private finishes are omitted. */
  finishes?: ProductFinish[];
  industries?: ProductIndustry[];
  certifications?: ProductCertification[];
  tags?: ProductTag[];
  images?: ProductImage[];
};

export type DownloadableFile = {
  id: string;
  name: string;
  type: 'obj' | 'pdf' | 'step' | 'dwg';
  url: string;
  size: string;
};

export type UserLibraryItem = {
  id: string;
  product_id: string;
  team_id: string;
  team_name?: string;
  custom_name?: string;
  custom_description?: string;
  custom_brand?: string;
  custom_specs?: Record<string, unknown>;
  notes?: string;
  is_favourite: boolean;
  is_admin_default: boolean;
  downloadable_files: DownloadableFile[];
  added_at: string;
  added_by?: string;
  product?: Product;
  section: string;
};

export type ProductFilters = {
  /**
   * `public` (default): only public catalog rows.
   * `brand`: include brand-private rows; DB RLS still enforces access.
   */
  visibility?: 'public' | 'brand';
  search?: string;
  family?: string;
  categories?: string[];
  segments?: string[];
  materials?: string[];
  industries?: string[];
  certifications?: string[];
  tags?: string[];
  /** Finish facets from the URL: axis key → selected value codes (M4 Step 4). */
  finishes?: Partial<Record<string, string[]>>;
  /** Resolved by useProductFinishFacets: products with ANY of these finishes. */
  finishIds?: string[];
  is_customizable?: boolean;
  sort?: 'name_asc' | 'name_desc';
  featured?: string;
  collection?: string;
  page?: number;
  pageSize?: number;
};
