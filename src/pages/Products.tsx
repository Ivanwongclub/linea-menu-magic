import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import ProductsSidebar, { categoryGroups } from "@/components/products/ProductsSidebar";

import buttonsImage from "@/assets/products/buttons-category.jpg";
import zippersImage from "@/assets/products/zippers-category.jpg";
import laceImage from "@/assets/products/lace-category.jpg";
import hardwareImage from "@/assets/products/hardware-category.jpg";
import otherImage from "@/assets/products/other-category.jpg";
import metalButton from "@/assets/products/metal-button.jpg";
import resinButtons from "@/assets/products/resin-buttons.jpg";
import snapButton from "@/assets/products/snap-button.jpg";
import brandButton from "@/assets/products/brand-button.jpg";
import engravedButton from "@/assets/products/engraved-button.jpg";
import metalZipper from "@/assets/products/metal-zipper.jpg";
import nylonZipper from "@/assets/products/nylon-zipper.jpg";
import brandedZipper from "@/assets/products/branded-zipper.jpg";
import cottonLace from "@/assets/products/cotton-lace.jpg";
import metalClasp from "@/assets/products/metal-clasp.jpg";
import beltBuckle from "@/assets/products/belt-buckle.jpg";
import wovenLabel from "@/assets/products/woven-label.jpg";

interface ProductItem {
  id: string;
  name: string;
  tag: string;
  category: "fasteners" | "closures" | "trims" | "labeling";
  image: string;
  isNew?: boolean;
  isSeasonal?: boolean;
  isBestSeller?: boolean;
}

const products: ProductItem[] = [
  { id: "metal-button", name: "Metal Buttons", tag: "Buttons", category: "fasteners", image: metalButton, isBestSeller: true },
  { id: "resin-button", name: "Resin Buttons", tag: "Buttons", category: "fasteners", image: resinButtons },
  { id: "snap-button", name: "Snap Buttons", tag: "Snap Buttons", category: "fasteners", image: snapButton, isNew: true },
  { id: "brand-button", name: "Brand Buttons", tag: "Buttons", category: "fasteners", image: brandButton },
  { id: "engraved-button", name: "Engraved Buttons", tag: "Buttons", category: "fasteners", image: engravedButton, isSeasonal: true },
  { id: "jeans-button", name: "Jeans Buttons", tag: "Jeans Buttons", category: "fasteners", image: buttonsImage },
  { id: "shank-button", name: "Shank Buttons", tag: "Shank Buttons", category: "fasteners", image: buttonsImage, isNew: true },
  { id: "rivet-1", name: "Brass Rivets", tag: "Rivets", category: "fasteners", image: hardwareImage, isBestSeller: true },
  { id: "hook-eye-1", name: "Hook & Eyes", tag: "Hook & Eyes", category: "fasteners", image: hardwareImage },
  { id: "eyelet-1", name: "Metal Eyelets", tag: "Eyelets", category: "fasteners", image: hardwareImage, isSeasonal: true },
  { id: "metal-zipper", name: "Metal Zipper", tag: "Zipper Pullers", category: "closures", image: metalZipper, isBestSeller: true },
  { id: "nylon-zipper", name: "Nylon Zipper", tag: "Zipper Pullers", category: "closures", image: nylonZipper },
  { id: "branded-zipper", name: "Branded Zipper", tag: "Zipper Pullers", category: "closures", image: brandedZipper, isNew: true },
  { id: "metal-clasp", name: "Metal Clasp", tag: "Buckles", category: "closures", image: metalClasp },
  { id: "belt-buckle", name: "Belt Buckle", tag: "Buckles", category: "closures", image: beltBuckle, isSeasonal: true },
  { id: "cord-end-1", name: "Metal Cord Ends", tag: "Cord Ends", category: "closures", image: hardwareImage },
  { id: "cord-stopper-1", name: "Cord Stoppers", tag: "Cord Stoppers", category: "closures", image: hardwareImage, isNew: true },
  { id: "toggle-1", name: "Cord Toggles", tag: "Toggles", category: "closures", image: hardwareImage },
  { id: "cotton-lace", name: "Cotton Lace", tag: "Cotton Lace", category: "trims", image: cottonLace, isBestSeller: true },
  { id: "drawcord-1", name: "Woven Drawcords", tag: "Drawcords", category: "trims", image: laceImage },
  { id: "strap-1", name: "Nylon Webbing", tag: "Straps & Webbings", category: "trims", image: laceImage, isSeasonal: true },
  { id: "bead-1", name: "Decorative Beads", tag: "Beads", category: "trims", image: otherImage },
  { id: "badge-1", name: "Woven Badges", tag: "Badges", category: "trims", image: otherImage, isNew: true },
  { id: "woven-label", name: "Woven Label", tag: "Labels", category: "labeling", image: wovenLabel, isBestSeller: true },
  { id: "hangtag-1", name: "Custom Hangtag", tag: "Hangtags", category: "labeling", image: otherImage },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");
  const activeTag = searchParams.get("tag");
  const activeFilter = searchParams.get("filter");
  const sortBy = searchParams.get("sort") || "featured";

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null) next.delete(k);
      else next.set(k, v);
    });
    setSearchParams(next);
  };

  const handleCategoryClick = (category: string) => {
    if (activeCategory === category) {
      updateParams({ category: null, tag: null });
    } else {
      updateParams({ category, tag: null });
    }
  };

  const handleTagClick = (tag: string) => {
    if (activeTag === tag) {
      updateParams({ tag: null });
    } else {
      // auto-set parent category
      const parent = categoryGroups.find((g) => g.tags.includes(tag));
      updateParams({ tag, category: parent?.key || null });
    }
  };

  const handleFilterClick = (filter: string) => {
    updateParams({ filter: activeFilter === filter ? null : filter });
  };

  const handleSortChange = (sort: string) => {
    updateParams({ sort: sort === "featured" ? null : sort });
  };

  const handleClearAll = () => {
    setSearchParams({});
  };

  // Filter chain
  let filtered = [...products];

  if (activeTag) {
    filtered = filtered.filter((p) => p.tag === activeTag);
  } else if (activeCategory) {
    filtered = filtered.filter((p) => p.category === activeCategory);
  }

  if (activeFilter === "new") filtered = filtered.filter((p) => p.isNew);
  if (activeFilter === "seasonal") filtered = filtered.filter((p) => p.isSeasonal);
  if (activeFilter === "best") filtered = filtered.filter((p) => p.isBestSeller);

  // Sort
  if (sortBy === "newest") filtered = filtered.filter((p) => p.isNew).concat(filtered.filter((p) => !p.isNew));
  if (sortBy === "name-asc") filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === "name-desc") filtered.sort((a, b) => b.name.localeCompare(a.name));

  const sidebarProps = {
    activeCategory,
    activeTag,
    activeFilter,
    sortBy,
    onCategoryClick: handleCategoryClick,
    onTagClick: handleTagClick,
    onFilterClick: handleFilterClick,
    onSortChange: handleSortChange,
    onClearAll: handleClearAll,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-8">
        <section className="px-6 lg:px-8 pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-16">
              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-32">
                  <ProductsSidebar {...sidebarProps} />
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* Mobile: Title + Filter trigger */}
                <div className="lg:hidden mb-8">
                  <h1 className="text-3xl font-light tracking-tight text-foreground">Products</h1>
                  <p className="text-base text-muted-foreground mt-1 mb-4">產品系列</p>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-none border-border text-xs tracking-wider uppercase gap-2">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Filters & Categories
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 overflow-y-auto">
                      <SheetTitle className="sr-only">Filters</SheetTitle>
                      <div className="mt-4">
                        <ProductsSidebar {...sidebarProps} />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Item count */}
                <p className="text-sm text-muted-foreground mb-6">
                  {filtered.length} {filtered.length === 1 ? "item" : "items"}
                </p>

                {/* Product Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
                  {filtered.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className="group"
                    >
                      <div className="aspect-square overflow-hidden bg-muted/10 mb-3 relative">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {product.isNew && (
                          <span className="absolute top-3 left-3 bg-foreground text-background text-[10px] tracking-[0.15em] uppercase px-2 py-1">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{product.tag}</p>
                    </Link>
                  ))}
                </div>

                {filtered.length === 0 && (
                  <div className="text-center py-20 text-muted-foreground text-sm">
                    No products match the current filters.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 lg:px-8 bg-foreground text-primary-foreground overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">需要定制產品？</h2>
            <p className="text-primary-foreground/70 mb-8">
              我們提供專業的定制服務，滿足您的獨特需求
            </p>
            <Link
              to="/contact"
              className="inline-block px-12 py-4 bg-accent text-accent-foreground text-xs tracking-[0.2em] uppercase rounded-full transition-all duration-300 hover:bg-accent/90"
            >
              聯絡我們
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
