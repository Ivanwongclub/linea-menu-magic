import { Link } from "react-router-dom";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";

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
  { id: "hardware", titleEn: "Metal Hardware", count: "64+", description: "Clasps, Buckles, Rivets", image: hardwareImage },
  { id: "zippers", titleEn: "Zippers", count: "36+", description: "Metal, Nylon, Branded", image: zippersImage },
  { id: "lace", titleEn: "Lace & Trimming", count: "52+", description: "Cotton, Elastic Lace", image: laceImage },
  { id: "other", titleEn: "Other Products", count: "28+", description: "Labels, Packaging", image: otherImage },
];

const CategoryCard = ({
  category,
  minHeight,
  gridVisible,
  delay,
  className = "",
}: {
  category: Category;
  minHeight: string;
  gridVisible: boolean;
  delay: React.CSSProperties;
  className?: string;
}) => (
  <Link
    to={`/products#${category.id}`}
    className={`group relative overflow-hidden rounded-[var(--radius)] transition-all duration-700 ease-out ${
      gridVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
    } ${className}`}
    style={{ ...delay, minHeight }}
  >
    <div className="absolute inset-0">
      <img
        src={category.image}
        alt={category.titleEn}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.04]"
      />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
    <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
      <h3 className="text-lg font-semibold tracking-tight text-white">
        {category.titleEn}
      </h3>
      <span className="text-xs uppercase tracking-[0.1em] text-white/60 mt-1 inline-flex items-center gap-1 transition-all duration-300 group-hover:gap-2">
        Explore <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </span>
    </div>
  </Link>
);

const ProductCategories = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible, getDelay } = useStaggeredAnimation(5, 150);

  return (
    <section className="section-off-white overflow-hidden">
      <div className="section-inner">
        <div
          ref={headerRef}
          className={`mb-16 max-w-[560px] transition-all duration-700 ease-out ${
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          <span className="section-label">Our Products</span>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mt-2">
            Precision-engineered trims for every application
          </h2>
        </div>

        {/* Editorial Grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Tall buttons card spanning 2 rows */}
          <CategoryCard
            category={categories[0]}
            minHeight="520px"
            gridVisible={gridVisible}
            delay={getDelay(0)}
            className="md:row-span-2"
          />

          {/* Right top: Hardware */}
          <CategoryCard
            category={categories[1]}
            minHeight="260px"
            gridVisible={gridVisible}
            delay={getDelay(1)}
          />

          {/* Right bottom: Zippers */}
          <CategoryCard
            category={categories[2]}
            minHeight="260px"
            gridVisible={gridVisible}
            delay={getDelay(2)}
          />

          {/* Bottom row: Lace + Other */}
          <CategoryCard
            category={categories[3]}
            minHeight="300px"
            gridVisible={gridVisible}
            delay={getDelay(3)}
          />
          <CategoryCard
            category={categories[4]}
            minHeight="300px"
            gridVisible={gridVisible}
            delay={getDelay(4)}
          />
        </div>
      </div>
    </section>
  );
};

export default ProductCategories;
