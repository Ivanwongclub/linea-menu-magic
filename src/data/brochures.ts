export interface Brochure {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  pages: string[];
}

export const brochures: Brochure[] = [
  {
    id: "spring-collection-2025",
    title: "Spring Collection 2025",
    description: "Explore our latest spring collection featuring premium buttons, zippers, and hardware accessories.",
    coverImage: "https://picsum.photos/seed/brochure1/600/800",
    pages: Array.from({ length: 10 }, (_, i) => `https://picsum.photos/seed/spring${i + 1}/800/1100`),
  },
  {
    id: "sustainable-materials",
    title: "Sustainable Materials Catalog",
    description: "Our commitment to sustainability through eco-friendly materials and responsible manufacturing.",
    coverImage: "https://picsum.photos/seed/brochure2/600/800",
    pages: Array.from({ length: 10 }, (_, i) => `https://picsum.photos/seed/sustain${i + 1}/800/1100`),
  },
  {
    id: "hardware-innovations",
    title: "Hardware Innovations",
    description: "Discover cutting-edge hardware designs and finishes for the modern fashion industry.",
    coverImage: "https://picsum.photos/seed/brochure3/600/800",
    pages: Array.from({ length: 10 }, (_, i) => `https://picsum.photos/seed/hardware${i + 1}/800/1100`),
  },
];
