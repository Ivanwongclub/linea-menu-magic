import { Link } from "react-router-dom";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import LetterReveal from "@/components/ui/LetterReveal";

import buttonsImage from "@/assets/products/buttons-category.jpg";
import zippersImage from "@/assets/products/zippers-category.jpg";
import laceImage from "@/assets/products/lace-category.jpg";
import hardwareImage from "@/assets/products/hardware-category.jpg";
import otherImage from "@/assets/products/other-category.jpg";

interface Category {
  id: string;
  titleEn: string;
  count: string;
  description: string;
  image: string;
}

const categories: Category[] = [
  { id: "buttons", titleEn: "Buttons", count: "48+", description: "Polyester, Metal, Resin", image: buttonsImage },
  { id: "zippers", titleEn: "Zippers", count: "36+", description: "Metal, Nylon, Branded", image: zippersImage },
  { id: "lace", titleEn: "Lace & Trimming", count: "52+", description: "Cotton, Elastic Lace", image: laceImage },
  { id: "hardware", titleEn: "Metal Hardware", count: "64+", description: "Clasps, Buckles, Rivets", image: hardwareImage },
  { id: "other", titleEn: "Other Products", count: "28+", description: "Labels, Packaging", image: otherImage },
];

const ProductCategories = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible, getDelay } = useStaggeredAnimation(5, 150);

  return (
    <section className="section-off-white overflow-hidden">
      <div className="section-inner">
        <div
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ease-out ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <span className="section-label">Collection</span>
          <LetterReveal
            text="Our Products"
            as="h2"
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground font-serif-display"
            isVisible={headerVisible}
            startDelay={200}
            letterDelay={45}
          />
        </div>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.slice(0, 3).map((category, index) => (
            <Link
              key={category.id}
              to={`/products#${category.id}`}
              className={`group relative aspect-[4/3] bg-white border border-border hover:border-foreground overflow-hidden rounded-[var(--radius)] transition-all duration-700 ease-out ${
                gridVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
              }`}
              style={getDelay(index)}
            >
              <div className="absolute inset-0">
                <img src={category.image} alt={category.titleEn} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/85 group-hover:via-black/50" />
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <span className="text-xs uppercase tracking-widest text-white/60">{category.count} styles</span>
                  <h3 className="text-2xl font-semibold text-white mt-2">{category.titleEn}</h3>
                  <p className="text-xs text-white/60 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300">{category.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {categories.slice(3).map((category, index) => (
            <Link
              key={category.id}
              to={`/products#${category.id}`}
              className={`group relative aspect-[16/9] bg-white border border-border hover:border-foreground overflow-hidden rounded-[var(--radius)] transition-all duration-700 ease-out ${
                gridVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
              }`}
              style={getDelay(index + 3)}
            >
              <div className="absolute inset-0">
                <img src={category.image} alt={category.titleEn} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/85 group-hover:via-black/50" />
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <span className="text-xs uppercase tracking-widest text-white/60">{category.count} styles</span>
                  <h3 className="text-2xl font-semibold text-white mt-2">{category.titleEn}</h3>
                  <p className="text-xs text-white/60 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300">{category.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductCategories;
