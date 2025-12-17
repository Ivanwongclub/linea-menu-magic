import metalButton from '@/assets/products/metal-button.jpg';
import resinButtons from '@/assets/products/resin-buttons.jpg';
import metalZipper from '@/assets/products/metal-zipper.jpg';
import nylonZipper from '@/assets/products/nylon-zipper.jpg';
import beltBuckle from '@/assets/products/belt-buckle.jpg';
import snapButton from '@/assets/products/snap-button.jpg';
import cottonLace from '@/assets/products/cotton-lace.jpg';
import engravedButton from '@/assets/products/engraved-button.jpg';
import brandedZipper from '@/assets/products/branded-zipper.jpg';
import metalClasp from '@/assets/products/metal-clasp.jpg';
import brandButton from '@/assets/products/brand-button.jpg';
import wovenLabel from '@/assets/products/woven-label.jpg';

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
  isPublic: boolean;
  teamId?: string;
  teamName?: string;
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
    description: '經典四孔金屬鈕扣，適用於外套、襯衫等服飾。表面拋光處理，耐磨耐用。採用環保電鍍工藝，符合國際環保標準。',
    specifications: {
      material: '鋅合金',
      size: '15mm',
      color: '銀色',
      finish: '拋光',
      weight: '2.5g',
      thickness: '3mm',
    },
    pricing: {
      unitPrice: 0.12,
      currency: 'USD',
      moq: 5000,
      priceBreaks: [
        { quantity: 10000, price: 0.10 },
        { quantity: 50000, price: 0.08 },
        { quantity: 100000, price: 0.065 },
      ],
    },
    production: {
      leadTime: '15-20 工作天',
      sampleTime: '5-7 工作天',
      origin: '中國東莞',
      capacity: '500,000 件/月',
    },
    certifications: ['OEKO-TEX® Standard 100', 'REACH Compliant', 'Nickel-Free'],
    availableColors: ['銀色', '金色', '古銅色', '黑鎳', '玫瑰金', '槍色'],
    applications: ['外套', '西裝', '襯衫', '牛仔褲', '風衣'],
    isPublic: true,
    modelUrl: '/models/button.obj',
    thumbnailUrl: metalButton,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'item-002',
    itemCode: 'BTN-P2H-002',
    name: '樹脂雙孔鈕扣',
    nameEn: 'Resin 2-Hole Button',
    category: 'buttons',
    description: '輕量化樹脂材質，色彩鮮豔持久，適合休閒服飾使用。採用環保樹脂原料，可回收再利用。',
    specifications: {
      material: '不飽和聚酯樹脂',
      size: '12mm',
      color: '多色可選',
      finish: '啞光',
      weight: '0.8g',
      thickness: '2.5mm',
    },
    pricing: {
      unitPrice: 0.025,
      currency: 'USD',
      moq: 10000,
      priceBreaks: [
        { quantity: 50000, price: 0.02 },
        { quantity: 100000, price: 0.015 },
      ],
    },
    production: {
      leadTime: '10-15 工作天',
      sampleTime: '3-5 工作天',
      origin: '中國廣州',
      capacity: '2,000,000 件/月',
    },
    certifications: ['OEKO-TEX® Standard 100', 'SGS Tested'],
    availableColors: ['白色', '黑色', '紅色', '藍色', '綠色', '黃色', '紫色', '粉色', '灰色', '棕色'],
    applications: ['休閒襯衫', '童裝', 'T恤', '家居服', '運動服'],
    isPublic: true,
    thumbnailUrl: resinButtons,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'item-003',
    itemCode: 'ZIP-M5-001',
    name: '金屬拉鏈 5號',
    nameEn: 'Metal Zipper #5',
    category: 'zippers',
    description: '高品質金屬拉鏈，齒片採用銅合金製成，順滑耐用。經過10,000次開合測試，確保使用壽命。',
    specifications: {
      material: '銅合金齒片 + 棉質布帶',
      size: '5號 (齒寬5mm)',
      color: '古銅色',
      finish: '仿古處理',
      tensileStrength: '≥800N',
    },
    pricing: {
      unitPrice: 0.85,
      currency: 'USD',
      moq: 2000,
      priceBreaks: [
        { quantity: 5000, price: 0.75 },
        { quantity: 10000, price: 0.65 },
      ],
    },
    production: {
      leadTime: '20-25 工作天',
      sampleTime: '7-10 工作天',
      origin: '中國深圳',
      capacity: '100,000 條/月',
    },
    certifications: ['OEKO-TEX® Standard 100', 'REACH Compliant', 'YKK Quality Standard'],
    availableColors: ['古銅色', '金色', '銀色', '黑鎳', '青古銅', '紅銅'],
    applications: ['外套', '皮衣', '牛仔褲', '包包', '靴子'],
    isPublic: true,
    modelUrl: '/models/zipper.obj',
    thumbnailUrl: metalZipper,
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'item-004',
    itemCode: 'ZIP-N3-002',
    name: '尼龍拉鏈 3號',
    nameEn: 'Nylon Zipper #3',
    category: 'zippers',
    description: '輕量尼龍拉鏈，適合輕便服飾和配件使用。防水處理可選，適合戶外服飾。',
    specifications: {
      material: '尼龍齒片 + 聚酯布帶',
      size: '3號 (齒寬3mm)',
      color: '黑色',
      finish: '標準',
      tensileStrength: '≥500N',
    },
    pricing: {
      unitPrice: 0.25,
      currency: 'USD',
      moq: 5000,
      priceBreaks: [
        { quantity: 20000, price: 0.20 },
        { quantity: 50000, price: 0.15 },
      ],
    },
    production: {
      leadTime: '12-15 工作天',
      sampleTime: '3-5 工作天',
      origin: '中國福建',
      capacity: '500,000 條/月',
    },
    certifications: ['OEKO-TEX® Standard 100', 'Bluesign Approved'],
    availableColors: ['黑色', '白色', '深藍', '灰色', '卡其色', '軍綠'],
    applications: ['運動外套', '休閒褲', '背包', '帳篷', '睡袋'],
    isPublic: true,
    thumbnailUrl: nylonZipper,
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: '2024-02-10T10:00:00Z',
  },
  {
    id: 'item-005',
    itemCode: 'HW-BUCK-001',
    name: '金屬皮帶扣',
    nameEn: 'Metal Belt Buckle',
    category: 'hardware',
    description: '經典款金屬皮帶扣，可搭配多種皮帶寬度使用。表面拉絲處理，質感高級。',
    specifications: {
      material: '304不鏽鋼',
      size: '內寬40mm × 外框50mm',
      color: '銀色',
      finish: '拉絲',
      weight: '45g',
      thickness: '4mm',
    },
    pricing: {
      unitPrice: 1.50,
      currency: 'USD',
      moq: 1000,
      priceBreaks: [
        { quantity: 3000, price: 1.30 },
        { quantity: 10000, price: 1.10 },
      ],
    },
    production: {
      leadTime: '18-22 工作天',
      sampleTime: '7-10 工作天',
      origin: '中國義烏',
      capacity: '50,000 件/月',
    },
    certifications: ['REACH Compliant', 'Nickel-Free', 'ISO 9001'],
    availableColors: ['銀色', '金色', '黑色', '槍色', '古銅色'],
    applications: ['皮帶', '腰帶', '背包扣', '服裝裝飾'],
    isPublic: true,
    modelUrl: '/models/hardware.obj',
    thumbnailUrl: beltBuckle,
    createdAt: '2024-02-15T10:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z',
  },
  {
    id: 'item-006',
    itemCode: 'HW-SNAP-002',
    name: '四合扣',
    nameEn: 'Snap Button',
    category: 'hardware',
    description: '高品質四合扣，安裝方便，開合順暢。經過5,000次開合測試，確保耐用性。',
    specifications: {
      material: '黃銅',
      size: '帽蓋15mm',
      color: '金色',
      finish: '電鍍',
      weight: '3.2g (全套)',
      thickness: '帽高6mm',
    },
    pricing: {
      unitPrice: 0.08,
      currency: 'USD',
      moq: 10000,
      priceBreaks: [
        { quantity: 50000, price: 0.065 },
        { quantity: 100000, price: 0.05 },
      ],
    },
    production: {
      leadTime: '12-18 工作天',
      sampleTime: '5-7 工作天',
      origin: '中國廣東',
      capacity: '1,000,000 套/月',
    },
    certifications: ['OEKO-TEX® Standard 100', 'CPSIA Compliant'],
    availableColors: ['金色', '銀色', '古銅色', '黑鎳', '珍珠白', '彩色烤漆'],
    applications: ['牛仔褲', '外套', '嬰兒服', '帳篷', '包包'],
    isPublic: true,
    thumbnailUrl: snapButton,
    createdAt: '2024-02-20T10:00:00Z',
    updatedAt: '2024-02-20T10:00:00Z',
  },
  {
    id: 'item-007',
    itemCode: 'LACE-COT-001',
    name: '棉質蕾絲花邊',
    nameEn: 'Cotton Lace Trim',
    category: 'lace',
    description: '精緻棉質蕾絲，適合女裝、內衣和家居用品裝飾。使用環保染料，色牢度達4級以上。',
    specifications: {
      material: '100% 有機棉',
      size: '寬度 25mm × 捲裝 15碼/卷',
      color: '白色',
    },
    pricing: {
      unitPrice: 0.35,
      currency: 'USD',
      moq: 500,
      priceBreaks: [
        { quantity: 2000, price: 0.28 },
        { quantity: 5000, price: 0.22 },
      ],
    },
    production: {
      leadTime: '20-25 工作天',
      sampleTime: '10-14 工作天',
      origin: '中國潮州',
      capacity: '200,000 碼/月',
    },
    certifications: ['OEKO-TEX® Standard 100', 'GOTS Certified', 'Organic Cotton'],
    availableColors: ['白色', '米白', '黑色', '粉色', '淺藍', '淺紫'],
    applications: ['女裝', '內衣', '婚紗', '窗簾', '桌布', '抱枕'],
    isPublic: true,
    thumbnailUrl: cottonLace,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 'item-008',
    itemCode: 'NIKE-BTN-001',
    name: '客製雕刻鈕扣',
    nameEn: 'Custom Engraved Button',
    category: 'buttons',
    description: 'Nike 專屬客製鈕扣，帶有品牌標誌雕刻。CNC精密雕刻，細節清晰。',
    specifications: {
      material: '黃銅',
      size: '18mm',
      color: '金色',
      finish: 'CNC雕刻 + 電鍍',
      weight: '4.5g',
      thickness: '4mm',
    },
    pricing: {
      unitPrice: 0.45,
      currency: 'USD',
      moq: 3000,
      priceBreaks: [
        { quantity: 10000, price: 0.38 },
        { quantity: 30000, price: 0.32 },
      ],
    },
    production: {
      leadTime: '25-30 工作天',
      sampleTime: '10-14 工作天',
      origin: '中國東莞',
      capacity: '200,000 件/月',
    },
    certifications: ['OEKO-TEX® Standard 100', 'REACH Compliant', 'Nike QA Approved'],
    availableColors: ['金色', '銀色', '古銅色', '黑鎳'],
    applications: ['運動外套', '訓練服', '聯名款'],
    isPublic: false,
    teamId: 'team-nike',
    teamName: 'Nike',
    modelUrl: '/models/button.obj',
    thumbnailUrl: engravedButton,
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
  {
    id: 'item-009',
    itemCode: 'NIKE-ZIP-001',
    name: '品牌訂製拉鏈頭',
    nameEn: 'Custom Branded Zipper Pull',
    category: 'zippers',
    description: 'Nike 專屬訂製拉鏈頭，帶有品牌標誌。採用壓鑄工藝，細節精緻。',
    specifications: {
      material: '鋅合金',
      size: '拉頭 20mm × 12mm',
      color: '黑鎳',
      finish: '烤漆 + 激光雕刻',
      weight: '8g',
    },
    pricing: {
      unitPrice: 0.55,
      currency: 'USD',
      moq: 2000,
      priceBreaks: [
        { quantity: 5000, price: 0.48 },
        { quantity: 15000, price: 0.42 },
      ],
    },
    production: {
      leadTime: '22-28 工作天',
      sampleTime: '10-14 工作天',
      origin: '中國深圳',
      capacity: '150,000 件/月',
    },
    certifications: ['OEKO-TEX® Standard 100', 'REACH Compliant', 'Nike QA Approved'],
    availableColors: ['黑鎳', '銀色', '金色'],
    applications: ['運動外套', '風衣', '運動包'],
    isPublic: false,
    teamId: 'team-nike',
    teamName: 'Nike',
    modelUrl: '/models/zipper.obj',
    thumbnailUrl: brandedZipper,
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
  },
  {
    id: 'item-011',
    itemCode: 'ADIDAS-HW-001',
    name: 'Adidas 專屬金屬扣件',
    nameEn: 'Adidas Custom Metal Clasp',
    category: 'hardware',
    description: 'Adidas 專屬設計金屬扣件，用於運動服飾。三葉草標誌壓印，品牌識別度高。',
    specifications: {
      material: '316L不鏽鋼',
      size: '25mm × 18mm',
      color: '銀色',
      finish: '噴砂 + 拋光',
      weight: '12g',
      thickness: '3mm',
    },
    pricing: {
      unitPrice: 0.75,
      currency: 'USD',
      moq: 2000,
      priceBreaks: [
        { quantity: 5000, price: 0.65 },
        { quantity: 10000, price: 0.55 },
      ],
    },
    production: {
      leadTime: '20-25 工作天',
      sampleTime: '7-10 工作天',
      origin: '中國東莞',
      capacity: '100,000 件/月',
    },
    certifications: ['OEKO-TEX® Standard 100', 'REACH Compliant', 'Adidas QA Approved'],
    availableColors: ['銀色', '黑色', '金色'],
    applications: ['運動外套', '訓練服', '運動包'],
    isPublic: false,
    teamId: 'team-adidas',
    teamName: 'Adidas',
    modelUrl: '/models/hardware.obj',
    thumbnailUrl: metalClasp,
    createdAt: '2024-03-18T10:00:00Z',
    updatedAt: '2024-03-18T10:00:00Z',
  },
  {
    id: 'item-012',
    itemCode: 'PUMA-BTN-001',
    name: 'Puma 品牌鈕扣',
    nameEn: 'Puma Brand Button',
    category: 'buttons',
    description: 'Puma 專屬品牌鈕扣，帶有躍豹標誌。UV印刷工藝，圖案持久不脫落。',
    specifications: {
      material: '環保ABS樹脂',
      size: '15mm',
      color: '黑色',
      finish: 'UV印刷 + 亮面',
      weight: '1.2g',
      thickness: '3mm',
    },
    pricing: {
      unitPrice: 0.18,
      currency: 'USD',
      moq: 5000,
      priceBreaks: [
        { quantity: 20000, price: 0.15 },
        { quantity: 50000, price: 0.12 },
      ],
    },
    production: {
      leadTime: '15-20 工作天',
      sampleTime: '5-7 工作天',
      origin: '中國廣州',
      capacity: '300,000 件/月',
    },
    certifications: ['OEKO-TEX® Standard 100', 'Puma QA Approved'],
    availableColors: ['黑色', '白色', '紅色'],
    applications: ['運動服', '休閒服', '配件'],
    isPublic: false,
    teamId: 'team-puma',
    teamName: 'Puma',
    thumbnailUrl: brandButton,
    createdAt: '2024-03-20T10:00:00Z',
    updatedAt: '2024-03-20T10:00:00Z',
  },
  {
    id: 'item-010',
    itemCode: 'OTH-LABEL-001',
    name: '織嘜標籤',
    nameEn: 'Woven Label',
    category: 'other',
    description: '高密度織嘜標籤，可客製圖案和文字。達馬士織造工藝，細節精緻。',
    specifications: {
      material: '100% 聚酯纖維',
      size: '30mm × 15mm (可訂製)',
      color: '可訂製',
    },
    pricing: {
      unitPrice: 0.08,
      currency: 'USD',
      moq: 3000,
      priceBreaks: [
        { quantity: 10000, price: 0.06 },
        { quantity: 50000, price: 0.045 },
      ],
    },
    production: {
      leadTime: '15-20 工作天',
      sampleTime: '7-10 工作天',
      origin: '中國杭州',
      capacity: '1,000,000 片/月',
    },
    certifications: ['OEKO-TEX® Standard 100', 'GOTS Available'],
    availableColors: ['客製化配色'],
    applications: ['服裝標籤', '包包標籤', '家紡標籤', '帽子標籤'],
    isPublic: true,
    thumbnailUrl: wovenLabel,
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
