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

interface ProductsSidebarProps {
  activeCategory: string | null;
  activeTag: string | null;
  activeFilter: string | null;
  sortBy: string;
  onCategoryClick: (category: string) => void;
  onTagClick: (tag: string) => void;
  onFilterClick: (filter: string) => void;
  onSortChange: (sort: string) => void;
  onClearAll: () => void;
}

export { categoryGroups, specialFilters };

const ProductsSidebar = ({
  activeCategory,
  activeTag,
  activeFilter,
  sortBy,
  onCategoryClick,
  onTagClick,
  onFilterClick,
  onSortChange,
  onClearAll,
}: ProductsSidebarProps) => {
  const hasActiveFilters = activeCategory || activeTag || activeFilter || sortBy !== "featured";

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-4xl font-light tracking-tight text-foreground">Products</h1>
        <p className="text-lg text-muted-foreground mt-1">產品系列</p>
      </div>

      <Separator />

      {/* Category Groups */}
      <nav className="space-y-1">
        {categoryGroups.map((group) => {
          const isGroupActive = activeCategory === group.key;
          const hasActiveChild = group.tags.includes(activeTag || "");
          const isOpen = isGroupActive || hasActiveChild;

          return (
            <Collapsible key={group.key} defaultOpen={isOpen}>
              <CollapsibleTrigger
                className="flex items-center justify-between w-full py-2 group"
                onClick={(e) => {
                  e.preventDefault();
                  onCategoryClick(group.key);
                }}
              >
                <span
                  className={`text-xs tracking-[0.2em] uppercase transition-colors ${
                    isGroupActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {group.name}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-0 mt-1 mb-3 space-y-0.5">
                  {group.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => onTagClick(tag)}
                      className={`block w-full text-left text-sm py-1.5 pl-3 border-l-2 transition-all duration-200 ${
                        activeTag === tag
                          ? "border-foreground text-foreground font-medium"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      <Separator />

      {/* Special Filters */}
      <div>
        <h3 className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">
          Filter By
        </h3>
        <div className="flex flex-wrap gap-2">
          {specialFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => onFilterClick(f.value)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors duration-200 ${
                activeFilter === f.value
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Sort */}
      <div>
        <h3 className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">
          Sort
        </h3>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full border-border bg-transparent text-sm font-light rounded-none">
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
          <Separator />
          <button
            onClick={onClearAll}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Clear All Filters
          </button>
        </>
      )}
    </div>
  );
};

export default ProductsSidebar;
