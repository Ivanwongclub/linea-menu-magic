import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";

// Import product images
import buttonsImage from "@/assets/products/buttons-category.jpg";
import zippersImage from "@/assets/products/zippers-category.jpg";
import laceImage from "@/assets/products/lace-category.jpg";
import hardwareImage from "@/assets/products/hardware-category.jpg";
import otherImage from "@/assets/products/other-category.jpg";

interface Product {
  id: string;
  titleCn: string;
  titleEn: string;
  count: string;
  items: string[];
  image: string;
}

const products: Product[] = [
  {
    id: "buttons",
    titleCn: "鈕扣",
    titleEn: "Buttons",
    count: "48+",
    items: ["Polyester Buttons", "Metal Buttons", "Shell Buttons", "Wood Buttons", "Snap Buttons"],
    image: buttonsImage,
  },
  {
    id: "zippers",
    titleCn: "拉鏈",
    titleEn: "Zippers",
    count: "36+",
    items: ["Metal Zipper", "Nylon Zipper", "Plastic Zipper", "Invisible Zipper", "Water-resistant Zipper"],
    image: zippersImage,
  },
  {
    id: "lace",
    titleCn: "花邊",
    titleEn: "Lace & Trimming",
    count: "52+",
    items: ["Cotton Lace", "Elastic Lace", "Embroidery Lace", "Chemical Lace", "Ribbon"],
    image: laceImage,
  },
  {
    id: "hardware",
    titleCn: "五金配件",
    titleEn: "Metal Hardware",
    count: "64+",
    items: ["Buckles", "D-rings", "Hooks", "Rivets", "Eyelets"],
    image: hardwareImage,
  },
  {
    id: "other",
    titleCn: "其他產品",
    titleEn: "Other Products",
    count: "28+",
    items: ["Labels", "Hangtags", "Packaging", "Elastic Bands", "Drawcords"],
    image: otherImage,
  },
];

const ProductCategory = ({ product, index }: { product: Product; index: number }) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });
  const isEven = index % 2 === 0;

  return (
    <div
      ref={ref}
      id={product.id}
      className={`py-16 ${index !== products.length - 1 ? "border-b border-border" : ""}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className={isEven ? "order-1" : "order-1 lg:order-2"}>
          <span className={`text-xs text-muted-foreground tracking-wider transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {product.count} 款
          </span>
          <h2 className={`text-4xl md:text-5xl font-semibold text-foreground mt-2 mb-2 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '100ms' }}>
            {product.titleCn}
          </h2>
          <p className={`text-muted-foreground tracking-wide mb-6 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '150ms' }}>
            {product.titleEn}
          </p>
          
          <ul className={`grid grid-cols-2 gap-2 mb-8 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '200ms' }}>
            {product.items.map((item) => (
              <li key={item} className="text-sm text-muted-foreground flex items-center">
                <span className="w-1 h-1 bg-muted-foreground rounded-full mr-2" />
                {item}
              </li>
            ))}
          </ul>

          <Link
            to="/contact"
            className={`inline-flex items-center text-sm tracking-wider text-foreground link-elegant transition-all duration-700 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '300ms' }}
          >
            Request Samples
            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
        
        <div className={isEven ? "order-2" : "order-2 lg:order-1"}>
          <div className={`group relative aspect-[4/3] bg-muted overflow-hidden transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`} style={{ transitionDelay: '200ms' }}>
            <img 
              src={product.image} 
              alt={product.titleEn}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

const Products = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero */}
        <section ref={heroRef} className="py-24 px-6 lg:px-8 bg-secondary overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>Our Products</p>
            <h1 className={`text-4xl md:text-5xl font-bold text-foreground mb-6 transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '100ms' }}>
              產品系列
            </h1>
            <p className={`text-lg text-muted-foreground leading-relaxed transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '200ms' }}>
              全方位服裝輔料解決方案
            </p>
          </div>
        </section>

        {/* Product Categories */}
        <section className="py-24 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {products.map((product, index) => (
              <ProductCategory key={product.id} product={product} index={index} />
            ))}
          </div>
        </section>

        {/* CTA */}
        <section ref={ctaRef} className="py-24 px-6 lg:px-8 bg-foreground text-primary-foreground overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className={`text-3xl font-bold mb-6 transition-all duration-700 ease-out ${
              ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              需要定制產品？
            </h2>
            <p className={`text-primary-foreground/70 mb-8 transition-all duration-700 ease-out ${
              ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '100ms' }}>
              我們提供專業的定制服務，滿足您的獨特需求
            </p>
            <Link
              to="/contact"
              className={`inline-block px-12 py-4 bg-accent text-accent-foreground text-xs tracking-[0.2em] uppercase rounded-full transition-all duration-300 hover:bg-accent/90 ${
                ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: '200ms' }}
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