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
  };
  isPublic: boolean;
  teamId?: string;
  modelUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const mockLibraryItems: LibraryItem[] = [
  {
    id: 'item-001',
    itemCode: 'BTN-M4H-001',
    name: '金屬四孔鈕扣',
    nameEn: 'Metal 4-Hole Button',
    category: 'buttons',
    description: '經典四孔金屬鈕扣，適用於外套、襯衫等服飾。表面拋光處理，耐磨耐用。',
    specifications: {
      material: '鋅合金',
      size: '15mm',
      color: '銀色',
      finish: '拋光',
    },
    isPublic: true,
    modelUrl: '/models/button.obj',
    thumbnailUrl: '/placeholder.svg',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'item-002',
    itemCode: 'BTN-P2H-002',
    name: '樹脂雙孔鈕扣',
    nameEn: 'Resin 2-Hole Button',
    category: 'buttons',
    description: '輕量化樹脂材質，色彩鮮豔，適合休閒服飾使用。',
    specifications: {
      material: '樹脂',
      size: '12mm',
      color: '多色可選',
      finish: '啞光',
    },
    isPublic: true,
    thumbnailUrl: '/placeholder.svg',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'item-003',
    itemCode: 'ZIP-M5-001',
    name: '金屬拉鏈 5號',
    nameEn: 'Metal Zipper #5',
    category: 'zippers',
    description: '高品質金屬拉鏈，齒片採用銅合金製成，順滑耐用。',
    specifications: {
      material: '銅合金',
      size: '5號',
      color: '古銅色',
      finish: '仿古處理',
    },
    isPublic: true,
    modelUrl: '/models/zipper.obj',
    thumbnailUrl: '/placeholder.svg',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'item-004',
    itemCode: 'ZIP-N3-002',
    name: '尼龍拉鏈 3號',
    nameEn: 'Nylon Zipper #3',
    category: 'zippers',
    description: '輕量尼龍拉鏈，適合輕便服飾和配件使用。',
    specifications: {
      material: '尼龍',
      size: '3號',
      color: '黑色',
      finish: '標準',
    },
    isPublic: true,
    thumbnailUrl: '/placeholder.svg',
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: '2024-02-10T10:00:00Z',
  },
  {
    id: 'item-005',
    itemCode: 'HW-BUCK-001',
    name: '金屬皮帶扣',
    nameEn: 'Metal Belt Buckle',
    category: 'hardware',
    description: '經典款金屬皮帶扣，可搭配多種皮帶寬度使用。',
    specifications: {
      material: '不鏽鋼',
      size: '40mm',
      color: '銀色',
      finish: '拉絲',
    },
    isPublic: true,
    modelUrl: '/models/hardware.obj',
    thumbnailUrl: '/placeholder.svg',
    createdAt: '2024-02-15T10:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z',
  },
  {
    id: 'item-006',
    itemCode: 'HW-SNAP-002',
    name: '四合扣',
    nameEn: 'Snap Button',
    category: 'hardware',
    description: '高品質四合扣，安裝方便，開合順暢。',
    specifications: {
      material: '銅',
      size: '15mm',
      color: '金色',
      finish: '電鍍',
    },
    isPublic: true,
    thumbnailUrl: '/placeholder.svg',
    createdAt: '2024-02-20T10:00:00Z',
    updatedAt: '2024-02-20T10:00:00Z',
  },
  {
    id: 'item-007',
    itemCode: 'LACE-COT-001',
    name: '棉質蕾絲花邊',
    nameEn: 'Cotton Lace Trim',
    category: 'lace',
    description: '精緻棉質蕾絲，適合女裝、內衣和家居用品裝飾。',
    specifications: {
      material: '100% 棉',
      size: '寬度 25mm',
      color: '白色',
    },
    isPublic: true,
    thumbnailUrl: '/placeholder.svg',
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 'item-008',
    itemCode: 'TEAM-BTN-001',
    name: '客製雕刻鈕扣',
    nameEn: 'Custom Engraved Button',
    category: 'buttons',
    description: '團隊專屬客製鈕扣，帶有品牌標誌雕刻。',
    specifications: {
      material: '黃銅',
      size: '18mm',
      color: '金色',
      finish: '雕刻',
    },
    isPublic: false,
    teamId: 'team-nike',
    modelUrl: '/models/button.obj',
    thumbnailUrl: '/placeholder.svg',
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
  {
    id: 'item-009',
    itemCode: 'TEAM-ZIP-001',
    name: '品牌訂製拉鏈頭',
    nameEn: 'Custom Branded Zipper Pull',
    category: 'zippers',
    description: '帶有品牌標誌的訂製拉鏈頭，限團隊內部使用。',
    specifications: {
      material: '鋅合金',
      size: '標準',
      color: '黑鎳',
      finish: '烤漆',
    },
    isPublic: false,
    teamId: 'team-nike',
    modelUrl: '/models/zipper.obj',
    thumbnailUrl: '/placeholder.svg',
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
  },
  {
    id: 'item-010',
    itemCode: 'OTH-LABEL-001',
    name: '織嘜標籤',
    nameEn: 'Woven Label',
    category: 'other',
    description: '高密度織嘜標籤，可客製圖案和文字。',
    specifications: {
      material: '聚酯纖維',
      size: '30x15mm',
      color: '可訂製',
    },
    isPublic: true,
    thumbnailUrl: '/placeholder.svg',
    createdAt: '2024-03-20T10:00:00Z',
    updatedAt: '2024-03-20T10:00:00Z',
  },
];

export const categoryLabels: Record<LibraryItem['category'], string> = {
  buttons: '鈕扣',
  zippers: '拉鏈',
  lace: '蕾絲花邊',
  hardware: '五金配件',
  other: '其他',
};
