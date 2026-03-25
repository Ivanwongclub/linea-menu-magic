// Transitional types — to be merged into Product type in a future update
// MIGRATED from src/data/mockLibraryData.ts

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
