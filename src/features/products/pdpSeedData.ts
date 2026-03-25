/**
 * Temporary frontend seed layer for PDP detail.
 * Fills gaps when backend specifications/production data is incomplete.
 * Keyed by product slug for stable matching.
 * 
 * Precedence: real backend data → seed data → omit.
 */

export interface PdpSeedSpecs {
  material?: string;
  finish?: string;
  size?: string;
  weight?: string;
  thickness?: string;
  attachment?: string;
  color_options?: string[];
  tensileStrength?: string;
}

export interface PdpSeedProduction {
  moq?: string;
  sample_time?: string;
  lead_time?: string;
  origin?: string;
  capacity?: string;
}

export interface PdpSeedCertification {
  name: string;
  abbreviation: string;
}

export interface PdpSeedApplications {
  industries: string[];
}

export interface PdpSeedEntry {
  description?: string;
  specifications?: PdpSeedSpecs;
  production?: PdpSeedProduction;
  certifications?: PdpSeedCertification[];
  applications?: PdpSeedApplications;
  is_customizable?: boolean;
}

const seedData: Record<string, PdpSeedEntry> = {
  'metal-button': {
    description: 'Classic metal button for garment applications. Available in multiple finishes and sizes, suitable for outerwear, blazers, and branded apparel.',
    specifications: {
      material: 'Zinc Alloy',
      finish: 'Nickel Plated',
      size: '15mm',
      weight: '4.2g',
      thickness: '2.5mm',
      attachment: 'Sew-Through (4 Hole)',
      color_options: ['Silver', 'Gold', 'Antique Brass', 'Gunmetal'],
    },
    production: {
      moq: '5,000 pcs',
      sample_time: '5–7 days',
      lead_time: '25–35 days',
      origin: 'Shenzhen, China',
      capacity: '300,000 pcs/month',
    },
    certifications: [
      { name: 'OEKO-TEX Standard 100', abbreviation: 'OEKO-TEX' },
      { name: 'Nickel-Free Compliant (EU)', abbreviation: 'Ni-Free' },
    ],
    applications: { industries: ['Apparel', 'Outerwear', 'Uniforms'] },
  },

  'resin-button': {
    description: 'Lightweight resin button with a smooth matte finish. Ideal for shirts, knitwear, and casual garments where a softer tactile quality is preferred.',
    specifications: {
      material: 'Polyester Resin',
      finish: 'Matte',
      size: '12mm',
      weight: '1.1g',
      thickness: '2.0mm',
      attachment: 'Sew-Through (4 Hole)',
      color_options: ['Natural', 'Black', 'Navy', 'Ivory', 'Olive'],
    },
    production: {
      moq: '3,000 pcs',
      sample_time: '3–5 days',
      lead_time: '20–30 days',
      origin: 'Shenzhen, China',
      capacity: '500,000 pcs/month',
    },
    certifications: [
      { name: 'OEKO-TEX Standard 100', abbreviation: 'OEKO-TEX' },
    ],
    applications: { industries: ['Apparel', 'Knitwear', 'Casual Wear'] },
  },

  'brand-button': {
    description: 'Customizable branded button with logo engraving or embossing. Designed for premium fashion brands requiring distinctive hardware.',
    specifications: {
      material: 'Brass',
      finish: 'Polished / Custom Plating',
      size: '18mm',
      weight: '6.8g',
      thickness: '3.0mm',
      attachment: 'Shank',
      color_options: ['Gold', 'Rose Gold', 'Black Nickel', 'Custom'],
    },
    production: {
      moq: '2,000 pcs',
      sample_time: '7–10 days',
      lead_time: '30–45 days',
      origin: 'Shenzhen, China',
      capacity: '150,000 pcs/month',
    },
    certifications: [
      { name: 'OEKO-TEX Standard 100', abbreviation: 'OEKO-TEX' },
    ],
    applications: { industries: ['Fashion', 'Premium Apparel', 'Branded Goods'] },
    is_customizable: true,
  },

  'engraved-button': {
    description: 'Precision-engraved metal button with fine detail work. Suited for blazers, coats, and luxury outerwear where decorative hardware is valued.',
    specifications: {
      material: 'Zinc Alloy',
      finish: 'Antique Bronze',
      size: '20mm',
      weight: '7.5g',
      thickness: '3.2mm',
      attachment: 'Shank',
      color_options: ['Antique Bronze', 'Antique Silver', 'Antique Gold'],
    },
    production: {
      moq: '3,000 pcs',
      sample_time: '7–10 days',
      lead_time: '30–40 days',
      origin: 'Shenzhen, China',
      capacity: '200,000 pcs/month',
    },
    certifications: [
      { name: 'Nickel-Free Compliant (EU)', abbreviation: 'Ni-Free' },
    ],
    applications: { industries: ['Outerwear', 'Blazers', 'Luxury Fashion'] },
  },

  'pearl-button': {
    description: 'Pearlescent button with iridescent surface. Lightweight and elegant, commonly used for blouses, bridal wear, and high-end womenswear.',
    specifications: {
      material: 'ABS / Pearlescent Resin',
      finish: 'Iridescent Pearl',
      size: '10mm',
      weight: '0.8g',
      thickness: '1.8mm',
      attachment: 'Sew-Through (2 Hole)',
      color_options: ['White Pearl', 'Cream', 'Blush Pink', 'Champagne'],
    },
    production: {
      moq: '5,000 pcs',
      sample_time: '3–5 days',
      lead_time: '20–25 days',
      origin: 'Shenzhen, China',
      capacity: '600,000 pcs/month',
    },
    certifications: [
      { name: 'OEKO-TEX Standard 100', abbreviation: 'OEKO-TEX' },
    ],
    applications: { industries: ['Womenswear', 'Bridal', 'Blouses'] },
  },

  'jeans-button': {
    description: 'Heavy-duty riveted jeans button designed for denim construction. Features a tack-and-post fastening system built for durability.',
    specifications: {
      material: 'Brass / Steel',
      finish: 'Antique Copper',
      size: '17mm',
      weight: '5.6g',
      thickness: '4.0mm',
      attachment: 'Tack & Post (Rivet)',
      color_options: ['Antique Copper', 'Silver', 'Matte Black', 'Raw Brass'],
    },
    production: {
      moq: '5,000 pcs',
      sample_time: '5–7 days',
      lead_time: '25–35 days',
      origin: 'Shenzhen, China',
      capacity: '400,000 pcs/month',
    },
    certifications: [
      { name: 'OEKO-TEX Standard 100', abbreviation: 'OEKO-TEX' },
      { name: 'Nickel-Free Compliant (EU)', abbreviation: 'Ni-Free' },
    ],
    applications: { industries: ['Denim', 'Workwear', 'Casual Wear'] },
  },

  'sample-trim-collection': {
    description: 'Curated sample collection featuring our bestselling trims across all categories. Ideal for design teams evaluating materials and finishes.',
    specifications: {
      material: 'Mixed (Metal, Resin, Fabric)',
      finish: 'Various',
      size: 'Assorted',
    },
    production: {
      moq: '1 set',
      sample_time: '3–5 days',
      lead_time: 'N/A — sample kit',
      origin: 'Hong Kong',
    },
    applications: { industries: ['Design Teams', 'Sourcing', 'Product Development'] },
  },

  'plastic-side-release-buckle': {
    description: 'Lightweight side-release buckle for bags and outdoor equipment. Snap-fit design for easy assembly.',
    specifications: {
      material: 'Nylon (POM)',
      finish: 'Matte',
      size: '25mm',
      weight: '3.1g',
      thickness: '6.0mm',
      attachment: 'Webbing Insert (Snap Fit)',
      color_options: ['Black', 'Olive', 'Coyote Brown', 'Wolf Grey'],
    },
    production: {
      moq: '3,000 pcs',
      sample_time: '5–7 days',
      lead_time: '20–25 days',
      origin: 'Shenzhen, China',
      capacity: '500,000 pcs/month',
    },
    certifications: [
      { name: 'REACH Compliant', abbreviation: 'REACH' },
    ],
    applications: { industries: ['Bags & Luggage', 'Outdoor & Sports', 'Military'] },
  },

  'metal-d-ring-buckle': {
    description: 'Heavy-duty zinc alloy D-ring buckle for bags, belts and straps. Available in multiple plated finishes.',
    specifications: {
      material: 'Zinc Alloy',
      finish: 'Antique Bronze',
      size: '25mm',
      weight: '8.5g',
      thickness: '3.5mm',
      attachment: 'Loop-Through',
      color_options: ['Antique Bronze', 'Silver', 'Gold', 'Black'],
      tensileStrength: '≥ 35 kg',
    },
    production: {
      moq: '2,000 pcs',
      sample_time: '7–10 days',
      lead_time: '30–45 days',
      origin: 'Shenzhen, China',
      capacity: '200,000 pcs/month',
    },
    certifications: [
      { name: 'OEKO-TEX Standard 100', abbreviation: 'OEKO-TEX' },
      { name: 'Nickel-Free Compliant (EU)', abbreviation: 'Ni-Free' },
    ],
    applications: { industries: ['Bags & Luggage', 'Belts', 'Fashion Accessories'] },
    is_customizable: true,
  },

  'eco-lace-trim': {
    description: 'OEKO-TEX certified recycled polyester lace trim. Available in 20mm width, suitable for sustainable fashion applications.',
    specifications: {
      material: 'Recycled Polyester',
      finish: 'Natural',
      size: '20mm width',
      weight: '8g/m',
      attachment: 'Sew-On',
      color_options: ['Off White', 'Ivory', 'Black', 'Beige'],
    },
    production: {
      moq: '500 meters',
      sample_time: '14–21 days',
      lead_time: '40–60 days',
      origin: 'Shenzhen, China',
      capacity: '50,000 m/month',
    },
    certifications: [
      { name: 'OEKO-TEX Standard 100', abbreviation: 'OEKO-TEX' },
      { name: 'Global Recycled Standard', abbreviation: 'GRS' },
    ],
    applications: { industries: ['Womenswear', 'Lingerie', 'Sustainable Fashion'] },
    is_customizable: true,
  },
};

export function getPdpSeed(slug: string): PdpSeedEntry | undefined {
  return seedData[slug];
}
