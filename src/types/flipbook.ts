export interface HotLink {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  url: string;
  label: string;
}

export interface Page {
  id: string;
  pageNumber: number;
  imageUrl: string;
  links?: HotLink[];
}

export interface Brochure {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  pages: Page[];
}
