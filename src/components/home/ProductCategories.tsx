import { Link } from "react-router-dom";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";

interface Category {
  id: string;
  titleCn: string;
  titleEn: string;
  count: string;
  description: string;
}

const categories: Category[] = [
  {
    id: "buttons",
    titleCn: "鈕扣",
    titleEn: "Buttons",
    count: "48+",
    description: "Polyester Buttons, Metal Buttons",
  },
  {
    id: "zippers",
    titleCn: "拉鏈",
    titleEn: "Zippers",
    count: "36+",
    description: "Metal Zipper, Nylon Zipper",
  },
  {
    id: "lace",
    titleCn: "花邊",
    titleEn: "Lace & Trimming",
    count: "52+",
    description: "Cotton Lace, Elastic Lace",
  },
  {
    id: "hardware",
    titleCn: "五金配件",
    titleEn: "Metal Hardware",
    count: "64+",
    description: "Various Metal Components",
  },
  {
    id: "other",
    titleCn: "其他產品",
    titleEn: "Other Products",
    count: "28+",
    description: "Additional Offerings",
  },
];

const ProductCategories = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible, getDelay } = useStaggeredAnimation(5, 150);

  return (
    <section className="py-24 px-6 lg:px-8 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ease-out ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <p className="text-subtitle mb-4">Collection</p>
          <h2 className="font-serif text-3xl md:text-4xl font-light text-foreground">
            精選系列
          </h2>
        </div>

        {/* Categories Grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.slice(0, 3).map((category, index) => (
            <Link
              key={category.id}
              to={`/products#${category.id}`}
              className={`group relative aspect-[4/3] bg-secondary overflow-hidden transition-all duration-700 ease-out ${
                gridVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
              }`}
              style={getDelay(index)}
            >
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Animated border */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-foreground/20 transition-colors duration-500" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <span className="text-xs text-muted-foreground tracking-wider group-hover:text-primary-foreground/80 transition-colors duration-300">
                    {category.count} 款
                  </span>
                  <h3 className="font-serif text-2xl text-foreground group-hover:text-primary-foreground mt-2 transition-colors duration-300">
                    {category.titleCn}
                  </h3>
                  <p className="text-sm text-muted-foreground group-hover:text-primary-foreground/80 tracking-wide transition-colors duration-300">
                    {category.titleEn}
                  </p>
                  <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/60 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    {category.description}
                  </p>
                </div>
              </div>

              {/* Corner accent */}
              <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-foreground/0 group-hover:border-primary-foreground/30 transition-colors duration-500" />
            </Link>
          ))}
        </div>

        {/* Bottom Row - 2 items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {categories.slice(3).map((category, index) => (
            <Link
              key={category.id}
              to={`/products#${category.id}`}
              className={`group relative aspect-[16/9] bg-secondary overflow-hidden transition-all duration-700 ease-out ${
                gridVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
              }`}
              style={getDelay(index + 3)}
            >
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Animated border */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-foreground/20 transition-colors duration-500" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <span className="text-xs text-muted-foreground tracking-wider group-hover:text-primary-foreground/80 transition-colors duration-300">
                    {category.count} 款
                  </span>
                  <h3 className="font-serif text-2xl text-foreground group-hover:text-primary-foreground mt-2 transition-colors duration-300">
                    {category.titleCn}
                  </h3>
                  <p className="text-sm text-muted-foreground group-hover:text-primary-foreground/80 tracking-wide transition-colors duration-300">
                    {category.titleEn}
                  </p>
                  <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/60 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    {category.description}
                  </p>
                </div>
              </div>

              {/* Corner accent */}
              <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-foreground/0 group-hover:border-primary-foreground/30 transition-colors duration-500" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductCategories;