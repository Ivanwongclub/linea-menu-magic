export type ProductStatus = 'draft' | 'active' | 'archived';

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  icon_url?: string;
};

export type ProductMaterial = {
  id: string;
  name: string;
  slug: string;
  is_sustainable: boolean;
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
  name: string;
  name_en?: string;
  slug: string;
  description?: string;
  description_en?: string;
  status: ProductStatus;
  is_public: boolean;
  is_customizable: boolean;
  specifications?: Record<string, unknown>;
  production?: Record<string, unknown>;
  thumbnail_url?: string;
  model_url?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;

  // Joined relations
  categories?: ProductCategory[];
  primary_category?: ProductCategory;
  materials?: ProductMaterial[];
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
  search?: string;
  categories?: string[];
  materials?: string[];
  industries?: string[];
  certifications?: string[];
  tags?: string[];
  is_customizable?: boolean;
  sort?: 'newest' | 'name_asc' | 'name_desc' | 'category';
};
