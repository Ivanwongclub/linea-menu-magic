export interface NewsItem {
  id: number;
  type: "news";
  category: "company" | "product" | "quality" | "operations";
  title: string;
  subtitle: string;
  date: string;
  location: string;
  image: string;
  description: string;
  featured: boolean;
  content: string[];
  gallery?: string[];
  /** Whether this article is based on directly verifiable public information */
  evidenceBasis: "public" | "editorial";
}

export const newsItems: NewsItem[] = [
  {
    id: 1,
    type: "news",
    category: "company",
    title: "Since 1979: Win-CYC's Journey from Hong Kong to Global Supply Partner",
    subtitle: "Company Heritage",
    date: "January 2025",
    location: "Hong Kong",
    image: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&auto=format&fit=crop",
    description: "Founded in Hong Kong in 1979, Win-CYC has grown from a local garment accessories supplier into a manufacturing and export partner serving the United States, Europe, and Asia Pacific.",
    featured: true,
    evidenceBasis: "public",
    content: [
      "Win-CYC was established in Hong Kong in 1979, initially focused on supplying garment accessories to the local textile industry. Over four decades, the company has grown into a supply partner serving major markets across the United States, Europe, and Asia Pacific.",
      "The company's growth has been driven by consistent investment in manufacturing capability, quality systems, and supply-chain infrastructure. Today, Win-CYC operates from its Hong Kong headquarters with production facilities in southern China and regional sourcing links across Southeast Asia.",
      "As an OEM and ODM partner, Win-CYC supports fashion brands and garment manufacturers with comprehensive accessory solutions — from product development and sampling through to volume production and export fulfilment.",
      "With more than 45 years of accumulated expertise in garment trims, Win-CYC continues to expand its reach while maintaining the hands-on service quality that has defined the company since its founding."
    ],
    gallery: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=600&auto=format&fit=crop",
    ],
  },
  {
    id: 2,
    type: "news",
    category: "product",
    title: "Product Range: Buttons, Zippers, and Metal Accessories",
    subtitle: "Product Capability Overview",
    date: "December 2024",
    location: "Hong Kong",
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&auto=format&fit=crop",
    description: "An overview of Win-CYC's garment accessory range — spanning polyester and metal buttons, zippers, D-rings, buckles, and bespoke hardware for the fashion industry.",
    featured: true,
    evidenceBasis: "public",
    content: [
      "Win-CYC's product portfolio covers a broad range of garment accessories used by fashion brands and apparel manufacturers. Core categories include polyester buttons, metal buttons, snap fasteners, zippers, D-rings, O-rings, buckles, rivets, eyelets, and decorative hardware.",
      "The button range encompasses polyester, metal, shell, wood, horn, and corozo — available in a variety of sizes, finishes, and custom colour matches. Metal accessories are produced with plating and surface-treatment processes to ensure durability and finish consistency.",
      "As both an OEM and ODM supplier, Win-CYC supports clients from initial concept through to production. Brands can source matched button, zipper, and hardware sets from a single partner, simplifying supply chains and reducing lead times.",
      "Product development is supported by in-house sampling, mould-making, and colour-matching capabilities — enabling prototyping and custom solutions for fashion, sportswear, workwear, and luxury segments."
    ],
    gallery: [
      "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=600&auto=format&fit=crop",
    ],
  },
  {
    id: 3,
    type: "news",
    category: "quality",
    title: "Quality Standards: ISO 9001 and Product Safety Testing",
    subtitle: "Quality & Compliance",
    date: "November 2024",
    location: "Hong Kong",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop",
    description: "Win-CYC maintains ISO 9001 quality management across its production facilities and conducts product safety testing aligned with international standards.",
    featured: false,
    evidenceBasis: "public",
    content: [
      "Quality assurance is central to Win-CYC's operations. The company maintains ISO 9001:2015 quality management certification across its production facilities, ensuring systematic process control, traceability, and continuous improvement.",
      "Products undergo testing aligned with international safety parameters — including assessment for harmful substances in metal components, coatings, plating finishes, and dyed materials. These protocols help ensure accessories meet the requirements of regulated markets.",
      "The quality control workflow includes incoming material inspection, in-process monitoring, and final outgoing quality checks. Dedicated QC teams work with standardised protocols to maintain consistency across production runs.",
      "These quality and compliance systems support Win-CYC's ability to serve international markets — including the United States and the European Union — where regulatory requirements for garment accessories are particularly stringent."
    ],
  },
  {
    id: 4,
    type: "news",
    category: "operations",
    title: "Export Markets: United States, Europe, and Asia Pacific",
    subtitle: "Market Footprint",
    date: "October 2024",
    location: "Hong Kong",
    image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=800&auto=format&fit=crop",
    description: "Win-CYC exports garment accessories to the United States, Europe, and Asia Pacific, coordinated from its Hong Kong headquarters and southern China production base.",
    featured: false,
    evidenceBasis: "public",
    content: [
      "Win-CYC's export business spans three major regions: the United States, Europe, and Asia Pacific. The company's Hong Kong headquarters serves as the commercial and logistics hub, coordinating between production facilities and international buyers.",
      "Production is anchored in southern China, with manufacturing facilities in the Pearl River Delta region — one of the world's most established garment accessories production clusters. This positioning provides access to skilled labour, raw materials, and efficient port logistics.",
      "The company's regional reach also extends into Southeast Asia, where sourcing links support brands with diversified supply-chain requirements.",
      "By maintaining a lean operational structure with deep production expertise, Win-CYC delivers competitive pricing, reliable lead times, and responsive service to its international client base."
    ],
  },
  {
    id: 5,
    type: "news",
    category: "product",
    title: "OEM and ODM: Win-CYC's One-Stop Accessory Development Model",
    subtitle: "Development Capability",
    date: "September 2024",
    location: "Dongguan",
    image: "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&auto=format&fit=crop",
    description: "Win-CYC provides OEM and ODM development services — from concept and sampling through to volume production — as a single-source accessories partner.",
    featured: false,
    evidenceBasis: "public",
    content: [
      "Win-CYC operates as both an OEM and ODM partner, offering end-to-end accessory development for fashion brands and garment manufacturers. This model covers concept consultation, material selection, sampling, mould creation, production, quality control, and export logistics.",
      "For OEM clients, Win-CYC manufactures to exact specifications — replicating approved designs with consistent quality across production volumes. For ODM engagements, the in-house development team works with brands to create original accessory designs, from initial sketches through to production-ready tooling.",
      "The development process is supported by rapid prototyping capabilities, with typical sample turnaround measured in days rather than weeks. This speed is a practical advantage for brands working to tight seasonal calendars.",
      "By consolidating buttons, zippers, metal hardware, and decorative trims under a single supplier, brands can reduce supplier management overhead, improve component consistency, and streamline sourcing operations."
    ],
  },
  {
    id: 6,
    type: "news",
    category: "quality",
    title: "Sustainable Materials: Recycled and Eco-Conscious Accessory Options",
    subtitle: "Environmental Responsibility",
    date: "August 2024",
    location: "Dongguan",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop",
    description: "Win-CYC offers a growing range of accessories made from recycled and eco-conscious materials, supporting brands with sustainability commitments.",
    featured: false,
    evidenceBasis: "editorial",
    content: [
      "Win-CYC has been expanding its range of garment accessories made from recycled and eco-conscious materials. This includes recycled polyester buttons, recycled metal alloy components, and bio-based material alternatives.",
      "For brands with sustainability commitments, these options provide a way to extend environmental responsibility into the accessories and trims portion of their product lines — an area often overlooked in broader sustainability strategies.",
      "The company's production facilities maintain certifications and testing protocols that support traceability of recycled content, helping brands substantiate environmental claims across their supply chains.",
      "Win-CYC continues to invest in sourcing and developing sustainable material alternatives as demand for eco-conscious accessories grows across the global fashion industry."
    ],
  },
];

export const categoryOptions = [
  { key: "all" as const, label: "All" },
  { key: "company" as const, label: "Company" },
  { key: "product" as const, label: "Products" },
  { key: "quality" as const, label: "Quality" },
  { key: "operations" as const, label: "Operations" },
];

export const filterOptions = [
  { key: "all" as const, label: "All" },
];
