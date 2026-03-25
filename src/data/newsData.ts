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
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop",
    description: "Founded in Hong Kong in 1979, Win-CYC has evolved from a local garment accessories supplier into a global manufacturing and export partner serving the United States, Europe, and Asia Pacific.",
    featured: true,
    content: [
      "Win-CYC was established in Hong Kong in 1979, initially focused on supplying garment accessories to the local textile industry. Over four decades, the company has grown into a global supply partner, serving major markets across the United States, Europe, and Asia Pacific.",
      "The company's growth has been driven by consistent investment in manufacturing capability, quality systems, and supply-chain infrastructure. Today, Win-CYC operates from its Hong Kong headquarters with production facilities in southern China and regional sourcing links across Southeast Asia.",
      "As an OEM and ODM partner, Win-CYC supports fashion brands and garment manufacturers with comprehensive accessory solutions — from product development and sampling through to volume production and export fulfilment.",
      "With more than 45 years of accumulated expertise in garment trims, Win-CYC continues to expand its global footprint while maintaining the hands-on service quality that has defined the company since its founding."
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
    title: "Inside Win-CYC's Product Capability: Buttons, Zippers, and Metal Accessories",
    subtitle: "Product Range Overview",
    date: "December 2024",
    location: "Hong Kong",
    image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&auto=format&fit=crop",
    description: "A comprehensive look at Win-CYC's accessory catalogue — spanning polyester buttons, metal buttons, zippers, D-rings, O-rings, buckles, and bespoke hardware for the global fashion industry.",
    featured: true,
    content: [
      "Win-CYC's product portfolio covers the full spectrum of garment accessories required by fashion brands and apparel manufacturers worldwide. Core product categories include polyester buttons, metal buttons, snap fasteners, zippers, D-rings, O-rings, buckles, rivets, eyelets, and decorative hardware.",
      "The company's button range alone encompasses polyester, metal, shell, wood, horn, and corozo — available in a wide variety of sizes, finishes, and custom colour matches. Metal accessories are produced with advanced plating and surface-treatment processes to ensure lasting durability and consistent finish quality.",
      "As both an OEM and ODM supplier, Win-CYC supports clients from initial concept through to final production. The one-stop development model means brands can source matched button, zipper, and hardware sets from a single partner, simplifying supply chains and reducing lead times.",
      "Product development is supported by in-house sampling, mould-making, and colour-matching capabilities — enabling rapid prototyping and custom solutions for fashion, sportswear, workwear, and luxury segments."
    ],
    gallery: [
      "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=600&auto=format&fit=crop",
    ],
  },
  {
    id: 3,
    type: "news",
    category: "quality",
    title: "Quality Systems at Win-CYC: ISO 9001 and OEKO-TEX-Aligned Standards",
    subtitle: "Quality & Compliance",
    date: "November 2024",
    location: "Hong Kong",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop",
    description: "Win-CYC maintains ISO 9001 quality management and OEKO-TEX-aligned testing protocols across its production lines, ensuring products meet international safety and quality benchmarks.",
    featured: false,
    content: [
      "Quality assurance is central to Win-CYC's operations. The company maintains ISO 9001:2015 quality management certification across its production facilities, ensuring systematic process control, traceability, and continuous improvement.",
      "In addition to ISO 9001, Win-CYC's products are tested against OEKO-TEX Standard 100 parameters — confirming that garment accessories are free from harmful substances and safe for end consumers. This testing covers metal components, coatings, plating finishes, and dyed materials.",
      "The company's quality control workflow includes incoming material inspection, in-process monitoring, and final outgoing quality checks. Dedicated QC teams work with standardised protocols to maintain consistency across production runs.",
      "These quality and compliance systems allow Win-CYC to serve demanding international markets — including the United States and the European Union — where regulatory requirements for garment accessories are particularly stringent."
    ],
  },
  {
    id: 4,
    type: "news",
    category: "operations",
    title: "Serving the United States, Europe, and Asia Pacific: Win-CYC's Market Footprint",
    subtitle: "Global Operations",
    date: "October 2024",
    location: "Hong Kong",
    image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=800&auto=format&fit=crop",
    description: "Win-CYC exports garment accessories to markets across the United States, Europe, and Asia Pacific — supported by Hong Kong headquarters and production bases in southern China.",
    featured: false,
    content: [
      "Win-CYC's export business spans three major regions: the United States, Europe, and Asia Pacific. The company's Hong Kong headquarters serves as the commercial and logistics hub, coordinating between production facilities and international buyers.",
      "Production is anchored in southern China, with manufacturing facilities in the Pearl River Delta region — one of the world's most established garment accessories production clusters. This geographic positioning provides access to skilled labour, raw materials, and efficient port logistics.",
      "The company's regional reach also extends into Southeast Asia, where sourcing and production links support brands with diversified supply-chain requirements. Vietnam, in particular, has become an increasingly important node in Win-CYC's operational network.",
      "By maintaining a lean operational structure with deep production expertise, Win-CYC delivers competitive pricing, reliable lead times, and responsive service to its international client base."
    ],
  },
  {
    id: 5,
    type: "news",
    category: "operations",
    title: "Supply Chain Snapshot: Vietnam as a Key Sourcing and Production Link",
    subtitle: "Regional Expansion",
    date: "September 2024",
    location: "Ho Chi Minh City",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&auto=format&fit=crop",
    description: "Win-CYC's supply chain extends into Vietnam, supporting brands that require diversified sourcing across multiple production regions in Asia.",
    featured: false,
    content: [
      "As global fashion supply chains continue to diversify beyond China, Vietnam has emerged as a critical production hub for garment manufacturing. Win-CYC has established sourcing and production links in the country to support clients seeking multi-origin supply-chain strategies.",
      "Vietnam's growing textile and garment sector — combined with favourable trade agreements with the United States and European Union — makes it an attractive complement to Win-CYC's established Chinese production base.",
      "The company's Vietnam operations focus on supporting accessory supply for garment factories in the Ho Chi Minh City and Binh Duong industrial clusters, where many international brands have concentrated their production.",
      "This multi-region capability allows Win-CYC to offer clients greater flexibility in sourcing, helping to manage lead times, costs, and supply-chain resilience across shifting trade environments."
    ],
  },
  {
    id: 6,
    type: "news",
    category: "product",
    title: "OEM and ODM Development: Win-CYC's One-Stop Accessory Service",
    subtitle: "Development Capability",
    date: "August 2024",
    location: "Dongguan",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop",
    description: "Win-CYC provides full OEM and ODM development services — from concept and sampling through to volume production and export — as a single-source accessories partner.",
    featured: false,
    content: [
      "Win-CYC operates as both an OEM and ODM partner, offering end-to-end accessory development for fashion brands and garment manufacturers. This one-stop model covers concept consultation, material selection, sampling, mould creation, production, quality control, and export logistics.",
      "For OEM clients, Win-CYC manufactures to exact specifications — replicating approved designs with consistent quality across large production volumes. For ODM engagements, the company's in-house development team works with brands to create original accessory designs, from initial sketches through to production-ready tooling.",
      "The development process is supported by rapid prototyping capabilities, with typical sample turnaround times measured in days rather than weeks. This speed-to-sample is a key competitive advantage for brands working to tight seasonal calendars.",
      "By consolidating buttons, zippers, metal hardware, and decorative trims under a single supplier, brands can reduce supplier management overhead, improve component consistency, and streamline their sourcing operations."
    ],
  },
  {
    id: 7,
    type: "news",
    category: "quality",
    title: "GRS Certification: Supporting Sustainable Material Standards",
    subtitle: "Environmental Compliance",
    date: "July 2024",
    location: "Dongguan",
    image: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&auto=format&fit=crop",
    description: "Win-CYC's production base maintains Global Recycled Standard (GRS) certification, supporting the use of verified recycled materials in garment accessories.",
    featured: false,
    content: [
      "Win-CYC's Dongguan production facility maintains Global Recycled Standard (GRS) certification, ensuring full traceability of recycled materials used in garment accessories. GRS is one of the most widely recognised sustainability certifications in the textile and apparel supply chain.",
      "The certification covers recycled-content buttons and accessories, confirming that materials meet international standards for recycled-input verification, chain-of-custody tracking, and environmental practices during production.",
      "For brands with sustainability commitments, GRS-certified accessories provide a verifiable way to demonstrate environmental responsibility across their product lines — from mainline collections through to sustainability-focused capsules.",
      "Win-CYC continues to invest in expanding its range of recycled and eco-friendly materials, including recycled polyester, recycled metal alloys, and bio-based alternatives."
    ],
  },
  {
    id: 8,
    type: "news",
    category: "company",
    title: "Digital Platform Update: Streamlining Product Discovery and Quotation",
    subtitle: "Digital Capability",
    date: "June 2024",
    location: "Hong Kong",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
    description: "Win-CYC is investing in digital tools for product browsing, specification sharing, and quotation management to improve the client experience.",
    featured: false,
    content: [
      "Win-CYC is investing in digital tools to modernise how clients discover products, review specifications, and manage quotation requests. The company's online platform aims to provide a faster, more transparent service experience for international buyers.",
      "Key features include a digital product catalogue with detailed specifications, high-resolution imagery, and downloadable technical data sheets. The platform also supports direct quotation requests, reducing the back-and-forth typically required in accessory sourcing.",
      "These digital initiatives complement Win-CYC's traditional relationship-based service model, giving clients the flexibility to browse and shortlist products independently before engaging with the sales team for detailed discussions.",
      "The platform is part of a broader operational modernisation effort that includes inventory visibility improvements and order-tracking capabilities."
    ],
    gallery: [
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&auto=format&fit=crop",
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
