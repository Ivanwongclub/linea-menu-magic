// QUARANTINED (P17 T1) — the workspace no longer consumes these types.
// The only remaining importer is src/components/designer-studio/QuickRFQDialog.tsx,
// which is itself quarantined (P14). When the real RFQ data layer ships and
// QuickRFQDialog is rewritten or deleted, delete this file entirely.

export interface DownloadableFile {
  id: string;
  name: string;
  description: string;
  fileType: 'obj' | 'stl' | 'step' | 'pdf' | 'ai' | 'dwg' | 'other';
  fileSize: string;
  url: string;
  uploadedAt: string;
}

export interface LibraryItem {
  id: string;
  itemCode: string;
  /** Product slug — added in P14 so workspace surfaces can deep-link to /contact and /products. Optional for legacy mock rows. */
  slug?: string;
  name: string;
  nameEn: string;
  category: 'buttons' | 'zippers' | 'lace' | 'hardware' | 'other';
  description: string;
  specifications: {
    material?: string;
    size?: string;
    color?: string;
    finish?: string;
    weight?: string;
    thickness?: string;
    tensileStrength?: string;
  };
  pricing: {
    unitPrice: number;
    currency: string;
    moq: number;
    priceBreaks?: { quantity: number; price: number }[];
  };
  production: {
    leadTime: string;
    sampleTime: string;
    origin: string;
    capacity: string;
  };
  certifications: string[];
  availableColors: string[];
  applications: string[];
  downloadableFiles?: DownloadableFile[];
  isPublic: boolean;
  teamId?: string;
  teamName?: string;
  modelUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const categoryLabels: Record<LibraryItem['category'], string> = {
  buttons: 'Buttons',
  zippers: 'Zippers',
  lace: 'Lace & Trim',
  hardware: 'Hardware',
  other: 'Other',
};
