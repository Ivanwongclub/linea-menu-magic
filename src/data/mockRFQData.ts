export type RFQStatus = 
  | 'submitted' 
  | 'model_uploaded' 
  | 'design_confirmed' 
  | 'ready_for_printing'
  | 'printing' 
  | 'shipped'
  | 'sample_review' 
  | 'production'
  | 'closed';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userRole: 'user' | 'manufacturer' | 'admin';
  content: string;
  createdAt: string;
  attachments?: string[];
}

export interface RFQFile {
  id: string;
  name: string;
  type: 'model' | 'reference' | 'attachment';
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface RFQ {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  quantity: number;
  targetPrice: number;
  targetDate: string;
  notes: string;
  status: RFQStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  teamName: string;
  comments: Comment[];
  files: RFQFile[];
  modelUrl?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export const mockRFQs: RFQ[] = [
  {
    id: 'RFQ-0001',
    itemCode: 'BTN-2024-001',
    itemName: 'Metal 4-Hole Button 18mm',
    category: 'Buttons',
    quantity: 10000,
    targetPrice: 0.15,
    targetDate: '2024-02-15',
    notes: 'Matte gold electroplating required, edges should be smooth and rounded. See attached reference image.',
    status: 'model_uploaded',
    createdAt: '2024-01-10T08:30:00Z',
    updatedAt: '2024-01-12T14:20:00Z',
    createdBy: 'Nike Design Team',
    teamName: 'Nike',
    comments: [
      {
        id: 'c1',
        userId: 'u1',
        userName: 'Designer Chen',
        userRole: 'user',
        content: 'Please ensure the metal has a substantial, weighty feel',
        createdAt: '2024-01-10T09:00:00Z',
      },
      {
        id: 'c2',
        userId: 'm1',
        userName: 'Manufacturer',
        userRole: 'manufacturer',
        content: '3D model uploaded — please confirm the design meets your requirements',
        createdAt: '2024-01-12T14:20:00Z',
      },
    ],
    files: [
      {
        id: 'f1',
        name: 'reference-image.jpg',
        type: 'reference',
        url: '/placeholder.svg',
        uploadedBy: 'Nike Design Team',
        uploadedAt: '2024-01-10T08:30:00Z',
      },
      {
        id: 'f2',
        name: 'BTN-2024-001.obj',
        type: 'model',
        url: '/model.obj',
        uploadedBy: 'Manufacturer',
        uploadedAt: '2024-01-12T14:20:00Z',
      },
    ],
    modelUrl: '/model.obj',
  },
  {
    id: 'RFQ-0002',
    itemCode: 'ZIP-2024-003',
    itemName: 'Waterproof Zipper #5',
    category: 'Zippers',
    quantity: 5000,
    targetPrice: 0.85,
    targetDate: '2024-02-20',
    notes: 'YKK-equivalent quality required, black nylon teeth.',
    status: 'submitted',
    createdAt: '2024-01-11T10:15:00Z',
    updatedAt: '2024-01-11T10:15:00Z',
    createdBy: 'Adidas Team',
    teamName: 'Adidas',
    comments: [],
    files: [],
  },
  {
    id: 'RFQ-0003',
    itemCode: 'LCE-2024-007',
    itemName: 'Cotton Lace Trim 3cm',
    category: 'Lace',
    quantity: 2000,
    targetPrice: 0.45,
    targetDate: '2024-03-01',
    notes: 'Pure white, fine pattern required, suitable for bridal wear.',
    status: 'design_confirmed',
    createdAt: '2024-01-05T14:00:00Z',
    updatedAt: '2024-01-14T09:30:00Z',
    createdBy: 'Vera Wang Studio',
    teamName: 'Vera Wang',
    comments: [
      {
        id: 'c3',
        userId: 'u2',
        userName: 'Ms. Wang',
        userRole: 'user',
        content: 'Design confirmed — proceed with 3D printing',
        createdAt: '2024-01-14T09:30:00Z',
      },
    ],
    files: [
      {
        id: 'f3',
        name: 'LCE-2024-007.obj',
        type: 'model',
        url: '/model.obj',
        uploadedBy: 'Manufacturer',
        uploadedAt: '2024-01-08T11:00:00Z',
      },
    ],
    modelUrl: '/model.obj',
  },
  {
    id: 'RFQ-0004',
    itemCode: 'HW-2024-012',
    itemName: 'Metal D-Ring 25mm',
    category: 'Hardware',
    quantity: 8000,
    targetPrice: 0.28,
    targetDate: '2024-02-28',
    notes: 'Rust-proof treatment required, load capacity at least 5kg.',
    status: 'printing',
    createdAt: '2024-01-02T16:45:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    createdBy: 'Coach Design',
    teamName: 'Coach',
    comments: [],
    files: [],
    estimatedDelivery: '2024-01-20',
  },
  {
    id: 'RFQ-0005',
    itemCode: 'BTN-2024-015',
    itemName: 'Pearl Button 12mm',
    category: 'Buttons',
    quantity: 15000,
    targetPrice: 0.22,
    targetDate: '2024-03-10',
    notes: 'Faux pearl material, must have a lustrous finish.',
    status: 'sample_review',
    createdAt: '2023-12-20T11:30:00Z',
    updatedAt: '2024-01-16T15:00:00Z',
    createdBy: 'Chanel Team',
    teamName: 'Chanel',
    comments: [],
    files: [],
    trackingNumber: 'SF1234567890',
    estimatedDelivery: '2024-01-18',
  },
  {
    id: 'RFQ-0006',
    itemCode: 'ZIP-2024-008',
    itemName: 'Metal Zipper #3',
    category: 'Zippers',
    quantity: 3000,
    targetPrice: 1.20,
    targetDate: '2024-02-25',
    notes: 'Rose gold color, two-way slider design.',
    status: 'production',
    createdAt: '2023-12-15T09:00:00Z',
    updatedAt: '2024-01-17T08:00:00Z',
    createdBy: 'Louis Vuitton',
    teamName: 'LV',
    comments: [],
    files: [],
  },
];

export const statusLabels: Record<RFQStatus, string> = {
  submitted: 'Pending',
  model_uploaded: 'Model Uploaded',
  design_confirmed: 'Design Confirmed',
  ready_for_printing: 'Ready to Print',
  printing: '3D Printing',
  shipped: 'Shipped',
  sample_review: 'Sample Review',
  production: 'In Production',
  closed: 'Closed',
};

export const statusColors: Record<RFQStatus, string> = {
  submitted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  model_uploaded: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  design_confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  ready_for_printing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  printing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  shipped: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  sample_review: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  production: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};
