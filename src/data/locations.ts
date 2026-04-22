import locationHongkong from "@/assets/location-hongkong.jpg";
import locationShanghai from "@/assets/location-shanghai.jpg";
import locationNewyork from "@/assets/location-newyork.jpg";
import factoryProduction from "@/assets/factory-production.jpg";
import locationVietnam from "@/assets/location-vietnam.jpg";

export type LocationEntry = {
  city: string;
  label: string;
  image: string;
  description: string;
  tags: string[];
};

export const offices: LocationEntry[] = [
  {
    city: "Hong Kong",
    label: "Headquarters",
    image: locationHongkong,
    description:
      "Global coordination hub since 1979. Manages export operations, client relationships, product development strategy, and supply-chain orchestration across all locations.",
    tags: ["Coordination", "Export", "Client Service"],
  },
  {
    city: "Shanghai",
    label: "Sales Office",
    image: locationShanghai,
    description:
      "Supports domestic and regional market development with dedicated account management, sample showrooms, and rapid customer-response capability.",
    tags: ["Market Development", "Showroom", "Account Management"],
  },
  {
    city: "New York",
    label: "Sales Office",
    image: locationNewyork,
    description:
      "Serves the Americas market with local business development, trend consultation, and logistics coordination for faster turnaround on Western-hemisphere orders.",
    tags: ["Americas Market", "Business Development", "Logistics"],
  },
];

export const factories: LocationEntry[] = [
  {
    city: "China",
    label: "Manufacturing Hub",
    image: factoryProduction,
    description:
      "Established production base with vertically integrated facilities covering die-casting, stamping, plating, painting, and assembly. Decades of accumulated expertise in metal buttons, trims, and hardware.",
    tags: ["Buttons", "Metal Trims", "Hardware", "Plating"],
  },
  {
    city: "Vietnam",
    label: "Manufacturing Hub",
    image: locationVietnam,
    description:
      "Expanding production facility supporting growing regional demand with competitive capacity, modern equipment, and alignment with evolving global sourcing strategies.",
    tags: ["Regional Capacity", "Competitive Production", "Growth"],
  },
];
