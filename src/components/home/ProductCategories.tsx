import { Link } from "react-router-dom";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";

// Import product images
import buttonsImage from "@/assets/products/buttons-category.jpg";
import zippersImage from "@/assets/products/zippers-category.jpg";
import laceImage from "@/assets/products/lace-category.jpg";
import hardwareImage from "@/assets/products/hardware-category.jpg";
import otherImage from "@/assets/products/other-category.jpg";

interface Category {
  id: string;
  titleCn: string;
  titleEn: string;
  count: string;
  description: string;
  image: string;
}

const categories: Category[] = [
  {
    id: "buttons",
    titleCn: "鈕扣",
    titleEn: "Buttons",
    count: "48+",
    description: "Polyester Buttons, Metal Buttons",
    image: buttonsImage,
  },
  {
    id: "zippers",
    titleCn: "拉鏈",
    titleEn: "Zippers",
    count: "36+",
    description: "Metal Zipper, Nylon Zipper",
    image: zippersImage,
  },
  {
    id: "lace",
    titleCn: "花邊",
    titleEn: "Lace & Trimming",
    count: "52+",
    description: "Cotton Lace, Elastic Lace",
    image: laceImage,
  },
  {
    id: "hardware",
    titleCn: "五金配件",
    titleEn: "Metal Hardware",
    count: "64+",
    description: "Various Metal Components",
    image: hardwareImage,
  },
  {
    id: "other",
    titleCn: "其他產品",
    titleEn: "Other Products",
    count: "28+",
    description: "Additional Offerings",
    image: otherImage,
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
              {/* Background Image */}
              <div className="absolute inset-0">
                <img 
                  src={category.image} 
                  alt={category.titleEn}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
              </div>

              {/* Gradient Overlay - becomes darker on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent transition-opacity duration-500 group-hover:from-foreground/85 group-hover:via-foreground/50" />
              
              {/* Elegant shine effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              </div>
              
              {/* Animated border */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary-foreground/20 transition-colors duration-500" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <span className="text-xs text-primary-foreground/80 tracking-wider transition-colors duration-300">
                    {category.count} 款
                  </span>
                  <h3 className="font-serif text-2xl text-primary-foreground mt-2 transition-colors duration-300">
                    {category.titleCn}
                  </h3>
                  <p className="text-sm text-primary-foreground/80 tracking-wide transition-colors duration-300">
                    {category.titleEn}
                  </p>
                  <p className="text-xs text-primary-foreground/60 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    {category.description}
                  </p>
                </div>
              </div>

              {/* Corner accent */}
              <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-primary-foreground/20 group-hover:border-primary-foreground/40 transition-colors duration-500" />
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
              {/* Background Image */}
              <div className="absolute inset-0">
                <img 
                  src={category.image} 
                  alt={category.titleEn}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
              </div>

              {/* Gradient Overlay - becomes darker on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent transition-opacity duration-500 group-hover:from-foreground/85 group-hover:via-foreground/50" />
              
              {/* Elegant shine effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              </div>
              
              {/* Animated border */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary-foreground/20 transition-colors duration-500" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <span className="text-xs text-primary-foreground/80 tracking-wider transition-colors duration-300">
                    {category.count} 款
                  </span>
                  <h3 className="font-serif text-2xl text-primary-foreground mt-2 transition-colors duration-300">
                    {category.titleCn}
                  </h3>
                  <p className="text-sm text-primary-foreground/80 tracking-wide transition-colors duration-300">
                    {category.titleEn}
                  </p>
                  <p className="text-xs text-primary-foreground/60 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    {category.description}
                  </p>
                </div>
              </div>

              {/* Corner accent */}
              <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-primary-foreground/20 group-hover:border-primary-foreground/40 transition-colors duration-500" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductCategories;
