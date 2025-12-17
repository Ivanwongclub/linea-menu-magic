import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  titleCn: string;
  titleEn: string;
  count: string;
  items: string[];
}

const products: Product[] = [
  {
    id: "buttons",
    titleCn: "鈕扣",
    titleEn: "Buttons",
    count: "48+",
    items: ["Polyester Buttons", "Metal Buttons", "Shell Buttons", "Wood Buttons", "Snap Buttons"],
  },
  {
    id: "zippers",
    titleCn: "拉鏈",
    titleEn: "Zippers",
    count: "36+",
    items: ["Metal Zipper", "Nylon Zipper", "Plastic Zipper", "Invisible Zipper", "Water-resistant Zipper"],
  },
  {
    id: "lace",
    titleCn: "花邊",
    titleEn: "Lace & Trimming",
    count: "52+",
    items: ["Cotton Lace", "Elastic Lace", "Embroidery Lace", "Chemical Lace", "Ribbon"],
  },
  {
    id: "hardware",
    titleCn: "五金配件",
    titleEn: "Metal Hardware",
    count: "64+",
    items: ["Buckles", "D-rings", "Hooks", "Rivets", "Eyelets"],
  },
  {
    id: "other",
    titleCn: "其他產品",
    titleEn: "Other Products",
    count: "28+",
    items: ["Labels", "Hangtags", "Packaging", "Elastic Bands", "Drawcords"],
  },
];

const Products = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero */}
        <section className="py-24 px-6 lg:px-8 bg-secondary">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-subtitle mb-4">Our Products</p>
            <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-6">
              產品系列
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              全方位服裝輔料解決方案
            </p>
          </div>
        </section>

        {/* Product Categories */}
        <section className="py-24 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {products.map((product, index) => (
              <div
                key={product.id}
                id={product.id}
                className={`py-16 ${index !== products.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className={index % 2 === 0 ? "order-1" : "order-1 lg:order-2"}>
                    <span className="text-xs text-muted-foreground tracking-wider">
                      {product.count} 款
                    </span>
                    <h2 className="font-serif text-3xl text-foreground mt-2 mb-2">
                      {product.titleCn}
                    </h2>
                    <p className="text-muted-foreground tracking-wide mb-6">
                      {product.titleEn}
                    </p>
                    
                    <ul className="grid grid-cols-2 gap-2 mb-8">
                      {product.items.map((item) => (
                        <li key={item} className="text-sm text-muted-foreground flex items-center">
                          <span className="w-1 h-1 bg-muted-foreground rounded-full mr-2" />
                          {item}
                        </li>
                      ))}
                    </ul>

                    <Link
                      to="/contact"
                      className="inline-flex items-center text-sm tracking-wider text-foreground link-elegant"
                    >
                      Request Samples
                      <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                  
                  <div className={index % 2 === 0 ? "order-2" : "order-2 lg:order-1"}>
                    <div className="aspect-[4/3] bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 lg:px-8 bg-foreground text-primary-foreground">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-3xl font-light mb-6">
              需要定制產品？
            </h2>
            <p className="text-primary-foreground/70 mb-8">
              我們提供專業的定制服務，滿足您的獨特需求
            </p>
            <Link
              to="/contact"
              className="inline-block px-12 py-4 border border-primary-foreground text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:bg-primary-foreground hover:text-foreground"
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