import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface CategoryGroup {
  name: string;
  key: string;
  tags: string[];
}

const categoryGroups: CategoryGroup[] = [
  {
    name: "Fasteners",
    key: "fasteners",
    tags: ["Buttons", "Jeans Buttons", "Shank Buttons", "Snap Buttons", "Rivets", "Hook & Eyes", "Eyelets"],
  },
  {
    name: "Closures",
    key: "closures",
    tags: ["Zipper Pullers", "Buckles", "Cord Ends", "Cord Stoppers", "Toggles"],
  },
  {
    name: "Trims",
    key: "trims",
    tags: ["Cotton Lace", "Drawcords", "Straps & Webbings", "Beads", "Badges"],
  },
  {
    name: "Labeling",
    key: "labeling",
    tags: ["Labels", "Hangtags"],
  },
];

const specialFilters = [
  { label: "New Arrivals", value: "new" },
  { label: "Seasonal", value: "seasonal" },
  { label: "Best Sellers", value: "best" },
] as const;

interface ProductItem {
  id: string;
  name: string;
  tag: string;
  category: string;
  isNew?: boolean;
  isSeasonal?: boolean;
  isBestSeller?: boolean;
}

interface ProductsSidebarProps {
  activeCategory: string | null;
  activeTag: string | null;
  activeFilters: string[];
  sortBy: string;
  products: ProductItem[];
  onCategoryClick: (category: string) => void;
  onTagClick: (tag: string) => void;
  onFilterToggle: (filter: string) => void;
  onSortChange: (sort: string) => void;
  onClearAll: () => void;
}

export { categoryGroups, specialFilters };

function countByCategory(products: ProductItem[], categoryKey: string): number {
  return products.filter((p) => p.category === categoryKey).length;
}

function countByTag(products: ProductItem[], tag: string): number {
  return products.filter((p) => p.tag === tag).length;
}

const ProductsSidebar = ({
  activeCategory,
  activeTag,
  activeFilters,
  sortBy,
  products,
  onCategoryClick,
  onTagClick,
  onFilterToggle,
  onSortChange,
  onClearAll,
}: ProductsSidebarProps) => {
  const hasActiveFilters = activeCategory || activeTag || activeFilters.length > 0 || sortBy !== "featured";

  return (
    <div className="space-y-6 bg-transparent text-sidebar-foreground p-6 rounded-sm">
      {/* Category Groups */}
      <nav className="space-y-1">
        {categoryGroups.map((group) => {
          const isGroupActive = activeCategory === group.key;
          const hasActiveChild = group.tags.includes(activeTag || "");
          const isOpen = isGroupActive || hasActiveChild;
          const groupCount = countByCategory(products, group.key);

          return (
            <Collapsible key={group.key} defaultOpen={isOpen}>
              <CollapsibleTrigger
                className="flex items-center justify-between w-full py-2.5 group"
                onClick={(e) => {
                  e.preventDefault();
                  onCategoryClick(group.key);
                }}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`text-sm tracking-[0.2em] uppercase transition-colors ${
                      isGroupActive
                        ? "text-sidebar-primary font-medium"
                        : "text-muted-foreground group-hover:text-sidebar-foreground"
                    }`}
                  >
                    {group.name}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    ({groupCount})
                  </span>
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-0 mt-1 mb-3 space-y-0.5">
                  {group.tags.map((tag) => {
                    const tagCount = countByTag(products, tag);
                    return (
                      <button
                         key={tag}
                        onClick={() => onTagClick(tag)}
                        className={`flex items-center justify-between w-full text-left text-base py-2 pl-3 pr-1 border-l-2 transition-all duration-200 ${
                          activeTag === tag
                            ? "border-sidebar-primary text-sidebar-foreground font-medium"
                            : "border-transparent text-muted-foreground hover:text-sidebar-foreground hover:border-muted-foreground/40"
                        }`}
                      >
                        <span>{tag}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {tagCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Special Filters — multi-select */}
      <div>
        <h3 className="text-base tracking-[0.2em] uppercase text-muted-foreground mb-4 font-medium">
          Filter By
        </h3>
        <div className="flex flex-wrap gap-2">
          {specialFilters.map((f) => {
            const isActive = activeFilters.includes(f.value);
            return (
              <button
                key={f.value}
                onClick={() => onFilterToggle(f.value)}
                className={`px-3 py-2 text-sm rounded-full border transition-colors duration-200 ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary"
                    : "bg-transparent text-muted-foreground border-sidebar-border hover:border-sidebar-foreground hover:text-sidebar-foreground"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Sort */}
      <div>
        <h3 className="text-base tracking-[0.2em] uppercase text-muted-foreground mb-3 font-medium">
          Sort
        </h3>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full border-sidebar-border bg-transparent text-sm font-light rounded-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none bg-background">
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="name-asc">Name A–Z</SelectItem>
            <SelectItem value="name-desc">Name Z–A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <>
          <Separator className="bg-sidebar-border" />
          <button
            onClick={onClearAll}
            className="text-xs text-muted-foreground hover:text-sidebar-foreground underline underline-offset-4 transition-colors"
          >
            Clear All Filters
          </button>
        </>
      )}
    </div>
  );
};

export default ProductsSidebar;
