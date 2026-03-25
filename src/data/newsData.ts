export interface NewsItem {
  id: number;
  type: "exhibition" | "news";
  category: "industry" | "product" | "certification" | "partnership";
  title: string;
  subtitle: string;
  date: string;
  location: string;
  image: string;
  description: string;
  featured: boolean;
  content: string[];
  gallery?: string[];
}

export const newsItems: NewsItem[] = [
  {
    id: 1,
    type: "exhibition",
    category: "industry",
    title: "Première Vision Paris 2025",
    subtitle: "Global Textile Exhibition",
    date: "11–13 Feb 2025",
    location: "Paris, France",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop",
    description: "WIN-CYC will showcase its latest garment accessories collection at Première Vision Paris. Industry professionals are warmly invited.",
    featured: true,
    content: [
      "WIN-CYC Group will participate in the world's most influential textile exhibition — Première Vision Paris — from 11 to 13 February 2025. As a leader in garment accessories, we will present a range of innovative products and eco-friendly solutions.",
      "Highlights include our eco-friendly button series made from GRS-certified recycled materials, a new line of metal zippers, and bespoke accessories for high-end fashion brands. These products demonstrate WIN-CYC's commitment to both quality and sustainability.",
      "We sincerely invite designers, sourcing professionals, and industry partners from around the world to visit our booth. Our expert team will introduce each product's features and applications, and provide personalised customisation recommendations.",
      "During the exhibition, we will also host a seminar on 'The Sustainable Future of Garment Accessories', exploring industry trends and eco-friendly innovations. All industry professionals are welcome to attend."
    ],
    gallery: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop",
    ],
  },
  {
    id: 2,
    type: "news",
    category: "product",
    title: "WIN-CYC+ Digital Transformation Officially Launched",
    subtitle: "Leading Industry Innovation",
    date: "December 2024",
    location: "Hong Kong",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&auto=format&fit=crop",
    description: "The Group announces the launch of WIN-CYC+ digital transformation programme, centred on Speed, Innovation, and Digitalisation.",
    featured: true,
    content: [
      "WIN-CYC Group today officially announced the launch of the WIN-CYC+ digital transformation programme, marking an important milestone in the Group's journey towards smart, digitalised development. The programme is built on three pillars: Speed, Innovation, and Digitalisation, aiming to comprehensively enhance client experience and operational efficiency.",
      "Key Phase 1 projects include the launch of the new Designer Studio platform, deployment of smart inventory management systems, and the digital upgrade of our online product catalogue. These initiatives will provide clients with a more convenient and efficient service experience.",
      "The Group Chairman stated: 'Digital transformation is at the core of WIN-CYC's future strategy. Through WIN-CYC+, we will better serve our global clients while enhancing competitiveness and sustainability.'",
      "The WIN-CYC+ programme is scheduled for phased implementation over the next two years, covering product R&D, manufacturing, supply chain management, and client services."
    ],
    gallery: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&auto=format&fit=crop",
    ],
  },
  {
    id: 3,
    type: "exhibition",
    category: "industry",
    title: "Intertextile Shanghai 2025",
    subtitle: "China International Textile Exhibition",
    date: "March 2025",
    location: "Shanghai, China",
    image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&auto=format&fit=crop",
    description: "Showcasing our eco-friendly sustainable product range, embodying the perfect combination of craftsmanship and innovation.",
    featured: false,
    content: [
      "WIN-CYC will participate in Intertextile Shanghai in March 2025, Asia's largest textile industry event.",
      "We will focus on our sustainable product series, including buttons, zippers, and metal accessories made from recycled materials. These products meet international environmental standards while reflecting our unwavering pursuit of craftsmanship and innovation.",
      "We look forward to connecting with clients across mainland China and the Asia-Pacific region to explore collaboration opportunities."
    ],
  },
  {
    id: 4,
    type: "news",
    category: "certification",
    title: "New Environmental Certification Achieved",
    subtitle: "Sustainability Milestone",
    date: "November 2024",
    location: "Hong Kong",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop",
    description: "WIN-CYC has been awarded OEKO-TEX environmental certification, further strengthening our leadership in sustainable development.",
    featured: false,
    content: [
      "WIN-CYC Group is pleased to announce that its main product lines have successfully passed the OEKO-TEX Standard 100 certification audit. This internationally recognised standard ensures products are harmless to human health and is one of the most credible safety certifications in the textile industry.",
      "The certification covers our metal buttons, zippers, and various garment accessories. Through rigorous testing and auditing, these products have been confirmed to meet the highest environmental and safety standards.",
      "Achieving OEKO-TEX certification further strengthens WIN-CYC's leadership in sustainable development and demonstrates our commitment to product quality and consumer safety."
    ],
  },
  {
    id: 5,
    type: "exhibition",
    category: "industry",
    title: "Hong Kong Fashion Week 2025",
    subtitle: "Hong Kong Fashion Week",
    date: "January 2025",
    location: "Hong Kong Convention and Exhibition Centre",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
    description: "Collaborating with local and international designers to showcase the limitless possibilities of garment accessories in fashion design.",
    featured: false,
    content: [
      "WIN-CYC will participate in Hong Kong Fashion Week in January 2025, collaborating with local and international designers to showcase the limitless possibilities of garment accessories in fashion design.",
      "As a Hong Kong-based enterprise, we have always actively supported the development of the local fashion industry. This exhibition will feature a series of designer-collaborative products, including limited-edition button collections and custom metal accessories.",
      "We look forward to raising awareness about the important role of garment accessories in fashion design, and demonstrating WIN-CYC's expertise in this field."
    ],
  },
  {
    id: 6,
    type: "news",
    category: "product",
    title: "Designer Studio Platform Launched",
    subtitle: "Digital Service Upgrade",
    date: "October 2024",
    location: "Hong Kong",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
    description: "The new Designer Studio platform is officially live, offering designers a one-stop digital product browsing and quotation service.",
    featured: false,
    content: [
      "WIN-CYC Group today announced the official launch of its new Designer Studio platform. This is a key component of the WIN-CYC+ digital transformation programme, designed to provide designers and brand clients with a more convenient and efficient digital service experience.",
      "The Designer Studio integrates product browsing, 3D model preview, sample requests, and quote management. Users can browse our complete product catalogue, view detailed specifications and technical parameters, and submit quotation requests directly.",
      "The 3D model preview feature allows designers to intuitively understand product appearance and details, significantly improving design decision efficiency. The smart quotation system can quickly generate accurate proposals based on client requirements.",
      "We believe the Designer Studio will become an important bridge for communication and collaboration between designers and WIN-CYC, driving the entire industry towards digitalisation."
    ],
    gallery: [
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&auto=format&fit=crop",
    ],
  },
  {
    id: 7,
    type: "news",
    category: "partnership",
    title: "Strategic Partnership with International Fashion Brands",
    subtitle: "Global Business Expansion",
    date: "September 2024",
    location: "Hong Kong",
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&auto=format&fit=crop",
    description: "Establishing long-term strategic partnerships with multiple internationally renowned fashion brands, further expanding our global footprint.",
    featured: false,
    content: [
      "WIN-CYC Group has recently signed strategic partnership agreements with multiple internationally renowned fashion brands. This marks a significant milestone in the Group's global business expansion strategy.",
      "Under the agreements, WIN-CYC will provide comprehensive garment accessories supply and customisation services, covering buttons, zippers, metal fittings, webbing, and more.",
      "The Group stated that these strategic partnerships are a strong endorsement of WIN-CYC's product quality and service capabilities. We will continue to serve global clients with outstanding quality and innovative design."
    ],
  },
  {
    id: 8,
    type: "news",
    category: "certification",
    title: "GRS Certification Audit Successfully Passed",
    subtitle: "Environmental Commitment",
    date: "August 2024",
    location: "Dongguan",
    image: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&auto=format&fit=crop",
    description: "Our production base has successfully passed the Global Recycled Standard (GRS) annual audit, continuing to drive sustainable development.",
    featured: false,
    content: [
      "WIN-CYC Group's Dongguan production base has successfully passed the Global Recycled Standard (GRS) annual audit. This is the third consecutive year of GRS certification, demonstrating our sustained efforts and commitment to sustainability.",
      "GRS is one of the world's most authoritative recycled material certification standards, requiring strict traceability management throughout the supply chain. This certification proves that WIN-CYC products meet international environmental standards, providing clients with reliable eco-friendly solutions.",
      "We will continue to increase investment in eco-material R&D and green production, contributing to a more sustainable fashion industry."
    ],
  },
  {
    id: 9,
    type: "exhibition",
    category: "industry",
    title: "Munich Fabric Start 2025",
    subtitle: "European Textile Exhibition",
    date: "January 2025",
    location: "Munich, Germany",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop",
    description: "Showcasing the latest eco-friendly materials and innovative designs, connecting with European buyers.",
    featured: false,
    content: [
      "WIN-CYC will participate in Munich Fabric Start 2025, presenting our latest eco-friendly materials and innovative design series.",
      "This is one of Europe's most important textile exhibitions, bringing together top global suppliers and buyers."
    ],
  },
  {
    id: 10,
    type: "news",
    category: "product",
    title: "New Premium Metal Accessories Collection",
    subtitle: "Craftsmanship Innovation",
    date: "July 2024",
    location: "Shenzhen",
    image: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&auto=format&fit=crop",
    description: "Launching a new premium metal accessories collection with advanced plating techniques for lasting lustre and durability.",
    featured: false,
    content: [
      "WIN-CYC launches a new premium metal accessories collection, featuring advanced plating processes and eco-friendly surface treatment technologies.",
      "The new series includes zipper pulls, buttons, buckles, and more, suitable for high-end fashion and sportswear."
    ],
  },
  {
    id: 11,
    type: "news",
    category: "partnership",
    title: "Partnership with Japanese Textile Group",
    subtitle: "Asia-Pacific Market Expansion",
    date: "June 2024",
    location: "Tokyo",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop",
    description: "Signed a memorandum of understanding with a leading Japanese textile group to jointly develop the Asia-Pacific market.",
    featured: false,
    content: [
      "WIN-CYC has signed a strategic MOU with a renowned Japanese textile group to jointly develop the Asia-Pacific market.",
      "The collaboration covers product R&D, technology exchange, and market promotion."
    ],
  },
  {
    id: 12,
    type: "exhibition",
    category: "industry",
    title: "Canton Fair Spring 2025",
    subtitle: "China Import and Export Fair",
    date: "April 2025",
    location: "Guangzhou, China",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
    description: "Exhibiting the complete product range at China's largest trade fair, welcoming global buyers.",
    featured: false,
    content: [
      "WIN-CYC will showcase its complete product range at Canton Fair Spring 2025. Global buyers are welcome to visit."
    ],
  },
  {
    id: 13,
    type: "news",
    category: "certification",
    title: "ISO 9001:2015 Certification Renewed",
    subtitle: "Quality Management System",
    date: "May 2024",
    location: "Hong Kong",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop",
    description: "Successfully passed the ISO 9001:2015 Quality Management System annual audit.",
    featured: false,
    content: [
      "WIN-CYC has successfully passed the ISO 9001:2015 Quality Management System annual audit, ensuring quality management meets international standards."
    ],
  },
  {
    id: 14,
    type: "news",
    category: "product",
    title: "Eco-Friendly Recycled Button Series Launched",
    subtitle: "Green Product Line",
    date: "April 2024",
    location: "Dongguan",
    image: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&auto=format&fit=crop",
    description: "An eco-friendly button series made from 100% recycled materials is now officially available.",
    featured: false,
    content: [
      "WIN-CYC launches an eco-friendly button series made from 100% recycled materials, offering an ideal choice for sustainable fashion."
    ],
  },
];

export const categoryOptions = [
  { key: "all" as const, label: "All Categories" },
  { key: "industry" as const, label: "Industry" },
  { key: "product" as const, label: "Product Launches" },
  { key: "certification" as const, label: "Certifications" },
  { key: "partnership" as const, label: "Partnerships" },
];

export const filterOptions = [
  { key: "all" as const, label: "All" },
  { key: "exhibition" as const, label: "Exhibitions" },
  { key: "news" as const, label: "News" },
];
