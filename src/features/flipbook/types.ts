export type BrochureStatus = "draft" | "published" | "archived";

export interface HotLink {
  id: string;
  page_id: string;
  label: string | null;
  url: string | null;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface Page {
  id: string;
  brochure_id: string;
  page_number: number;
  image_url: string;
  hotlinks?: HotLink[];
}

export interface Brochure {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  cover_image_url: string | null;
  status: BrochureStatus;
  created_at: string;
  updated_at: string;
}

/** Brochure with its pages (and nested hotlinks) fully loaded */
export interface BrochureWithPages extends Brochure {
  pages: Page[];
}
