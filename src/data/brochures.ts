import type { Brochure } from "@/types/flipbook";

export const brochures: Brochure[] = [
  {
    id: "spring-collection-2025",
    title: "Spring Collection 2025",
    description: "Explore our latest spring collection featuring premium buttons, zippers, and hardware accessories.",
    coverImage: "https://picsum.photos/seed/brochure1/600/800",
    pages: Array.from({ length: 10 }, (_, i) => ({
      id: `spring-p${i + 1}`,
      pageNumber: i + 1,
      imageUrl: `https://picsum.photos/seed/spring${i + 1}/800/1100`,
      ...(i === 0
        ? {
            links: [
              { id: "hl-1", x: 10, y: 20, width: 30, height: 8, url: "#", label: "Learn more" },
              { id: "hl-2", x: 50, y: 60, width: 25, height: 6, url: "#", label: "Learn more" },
              { id: "hl-3", x: 15, y: 80, width: 20, height: 7, url: "#", label: "Learn more" },
            ],
          }
        : {}),
    })),
  },
  {
    id: "sustainable-materials",
    title: "Sustainable Materials Catalog",
    description: "Our commitment to sustainability through eco-friendly materials and responsible manufacturing.",
    coverImage: "https://picsum.photos/seed/brochure2/600/800",
    pages: Array.from({ length: 10 }, (_, i) => ({
      id: `sustain-p${i + 1}`,
      pageNumber: i + 1,
      imageUrl: `https://picsum.photos/seed/sustain${i + 1}/800/1100`,
    })),
  },
  {
    id: "hardware-innovations",
    title: "Hardware Innovations",
    description: "Discover cutting-edge hardware designs and finishes for the modern fashion industry.",
    coverImage: "https://picsum.photos/seed/brochure3/600/800",
    pages: Array.from({ length: 10 }, (_, i) => ({
      id: `hardware-p${i + 1}`,
      pageNumber: i + 1,
      imageUrl: `https://picsum.photos/seed/hardware${i + 1}/800/1100`,
    })),
  },
];
