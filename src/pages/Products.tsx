import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import { Link } from "react-router-dom";

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

const tags = [
  "All",
  "Beads",
  "Badges",
  "Buttons",
  "Buckles",
  "Cord Ends",
  "Cord Stoppers",
  "Drawcords",
  "Eyelets",
  "Hook & Eyes",
  "Jeans Buttons",
  "Rivets",
  "Shank Buttons",
  "Snap Buttons",
  "Straps & Webbings",
  "Zipper Pullers",
  "Toggles",
  "Cotton Lace",
  "Labels",
  "Hangtags",
] as const;

interface ProductItem {
  id: string;
  name: string;
  tag: string;
  image: string;
}

const products: ProductItem[] = [
  { id: "metal-button", name: "Metal Buttons", tag: "Buttons", image: metalButton },
  { id: "resin-button", name: "Resin Buttons", tag: "Buttons", image: resinButtons },
  { id: "snap-button", name: "Snap Buttons", tag: "Snap Buttons", image: snapButton },
  { id: "brand-button", name: "Brand Buttons", tag: "Buttons", image: brandButton },
  { id: "engraved-button", name: "Engraved Buttons", tag: "Buttons", image: engravedButton },
  { id: "jeans-button", name: "Jeans Buttons", tag: "Jeans Buttons", image: buttonsImage },
  { id: "shank-button", name: "Shank Buttons", tag: "Shank Buttons", image: buttonsImage },
  { id: "metal-zipper", name: "Metal Zipper", tag: "Zipper Pullers", image: metalZipper },
  { id: "nylon-zipper", name: "Nylon Zipper", tag: "Zipper Pullers", image: nylonZipper },
  { id: "branded-zipper", name: "Branded Zipper", tag: "Zipper Pullers", image: brandedZipper },
  { id: "cotton-lace", name: "Cotton Lace", tag: "Cotton Lace", image: cottonLace },
  { id: "metal-clasp", name: "Metal Clasp", tag: "Buckles", image: metalClasp },
  { id: "belt-buckle", name: "Belt Buckle", tag: "Buckles", image: beltBuckle },
  { id: "woven-label", name: "Woven Label", tag: "Labels", image: wovenLabel },
  { id: "hangtag-1", name: "Custom Hangtag", tag: "Hangtags", image: otherImage },
  { id: "eyelet-1", name: "Metal Eyelets", tag: "Eyelets", image: hardwareImage },
  { id: "rivet-1", name: "Brass Rivets", tag: "Rivets", image: hardwareImage },
  { id: "toggle-1", name: "Cord Toggles", tag: "Toggles", image: hardwareImage },
  { id: "cord-end-1", name: "Metal Cord Ends", tag: "Cord Ends", image: hardwareImage },
  { id: "cord-stopper-1", name: "Cord Stoppers", tag: "Cord Stoppers", image: hardwareImage },
  { id: "drawcord-1", name: "Woven Drawcords", tag: "Drawcords", image: laceImage },
  { id: "hook-eye-1", name: "Hook & Eyes", tag: "Hook & Eyes", image: hardwareImage },
  { id: "strap-1", name: "Nylon Webbing", tag: "Straps & Webbings", image: laceImage },
  { id: "badge-1", name: "Woven Badges", tag: "Badges", image: otherImage },
  { id: "bead-1", name: "Decorative Beads", tag: "Beads", image: otherImage },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = searchParams.get("tag") || "All";

  const filtered = activeTag === "All"
    ? products
    : products.filter((p) => p.tag === activeTag);

  const handleTagClick = (tag: string) => {
    if (tag === "All") {
      setSearchParams({});
    } else {
      setSearchParams({ tag });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <PageBreadcrumb
          segments={[
            { label: "Home", href: "/" },
            { label: "Products" },
          ]}
          title="產品系列"
        />

        <section className="px-6 lg:px-8 pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-12">
              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-52 shrink-0">
                <div className="sticky top-32">
                  <h3 className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">
                    Category
                  </h3>
                  <nav className="space-y-2">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className={`block text-sm transition-colors duration-200 ${
                          activeTag === tag
                            ? "text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Mobile Tag Chips */}
              <div className="lg:hidden w-full mb-6 -mt-2 overflow-x-auto">
                <div className="flex gap-2 pb-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        activeTag === tag
                          ? "bg-foreground text-background border-foreground"
                          : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              <div className="flex-1 min-w-0">
                {/* Mobile tag chips rendered above on mobile, grid always here */}
                <p className="text-sm text-muted-foreground mb-6">
                  {filtered.length} {filtered.length === 1 ? "item" : "items"}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {filtered.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className="group"
                    >
                      <div className="aspect-square overflow-hidden bg-muted/10 mb-2">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <p className="text-sm text-foreground">{product.name}</p>
                    </Link>
                  ))}
                </div>

                {filtered.length === 0 && (
                  <div className="text-center py-20 text-muted-foreground text-sm">
                    No products found for "{activeTag}"
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
