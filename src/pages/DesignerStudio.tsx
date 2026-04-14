import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/products/ProductCard";
import { useProducts } from "@/features/products/hooks/useProducts";
import { useProductTaxonomy } from "@/features/products/hooks/useProductTaxonomy";
import { PRODUCT_FAMILIES } from "@/features/products/taxonomy";

const DesignerStudio = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFamily, setActiveFamily] = useState<string | null>(null);

  const filters = useMemo(() => ({
    search: searchQuery || undefined,
    family: activeFamily || undefined,
  }), [searchQuery, activeFamily]);

  const { products, loading } = useProducts(filters);
  const { categories } = useProductTaxonomy();

  // Build family chips from taxonomy
  const familyChips = useMemo(() => {
    return PRODUCT_FAMILIES.map((f) => ({
      slug: f.slug,
      name: f.name,
      count: categories.filter((c) => f.categorySlugs.includes(c.slug)).length,
    }));
  }, [categories]);

  return (
    <>
      {/* Minimal header bar */}
      <section className="py-12 px-6 lg:px-10 border-b border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
              Designer Studio
            </h1>
            <p className="text-sm text-foreground max-w-md">
              Browse the full component library. Enter the studio to build review-ready trim concepts.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link to="/designer-studio/dashboard">
              <Button size="sm" className="tracking-[0.1em] text-xs px-6">
                Enter Studio
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="sm" className="tracking-[0.1em] text-xs px-6">
                Request Access
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Product Library */}
      <section className="py-12 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          {/* Search + family filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <Input
                placeholder="Search components…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFamily(null)}
                className={`px-3 py-1.5 text-[11px] tracking-[0.08em] uppercase border transition-colors ${
                  !activeFamily
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
                }`}
              >
                All
              </button>
              {familyChips.map((f) => (
                <button
                  key={f.slug}
                  onClick={() => setActiveFamily(f.slug === activeFamily ? null : f.slug)}
                  className={`px-3 py-1.5 text-[11px] tracking-[0.08em] uppercase border transition-colors ${
                    activeFamily === f.slug
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square bg-secondary animate-pulse rounded-[var(--radius)]" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground/50 text-sm">
              No components found.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product, i) => (
                <Link key={product.id} to={`/products/${product.slug}`}>
                  <ProductCard
                    product={product}
                    viewMode="grid"
                    index={i}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA + Onboarding */}
      <section className="py-20 px-6 lg:px-10 bg-foreground text-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-4 tracking-tight">
            Ready to build review-ready concepts?
          </h2>
          <p className="text-background/40 text-sm mb-10 max-w-md mx-auto leading-relaxed">
            Request access to enter a secure workspace for concept development, component placement, and team presentation.
          </p>
          <Link to="/contact">
            <Button
              variant="outline-inverse"
              size="lg"
              className="tracking-[0.1em] text-xs px-10 mb-16"
            >
              Request Access
            </Button>
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            {[
              { step: "01", title: "Request access", desc: "Contact the team to introduce your brand and design workflow." },
              { step: "02", title: "Workspace approval", desc: "We review fit, confirm needs, and prepare the appropriate access level." },
              { step: "03", title: "Start building", desc: "Create concept boards, compare directions, and prepare presentations." },
            ].map((item) => (
              <div key={item.step}>
                <span className="text-3xl font-bold text-background/8 block mb-3 tracking-tight">
                  {item.step}
                </span>
                <h3 className="text-background font-semibold mb-2 tracking-tight text-sm">
                  {item.title}
                </h3>
                <p className="text-xs text-background/40 leading-[1.7]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default DesignerStudio;
