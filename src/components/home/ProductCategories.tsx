import { Link } from "react-router-dom";

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
  return (
    <section className="py-24 px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-subtitle mb-4">Collection</p>
          <h2 className="font-serif text-3xl md:text-4xl font-light text-foreground">
            精選系列
          </h2>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.slice(0, 3).map((category) => (
            <Link
              key={category.id}
              to={`/products#${category.id}`}
              className="group relative aspect-[4/3] bg-secondary overflow-hidden card-hover"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <span className="text-xs text-muted-foreground tracking-wider group-hover:text-primary-foreground/80 transition-colors">
                    {category.count} 款
                  </span>
                  <h3 className="font-serif text-2xl text-foreground group-hover:text-primary-foreground mt-2 transition-colors">
                    {category.titleCn}
                  </h3>
                  <p className="text-sm text-muted-foreground group-hover:text-primary-foreground/80 tracking-wide transition-colors">
                    {category.titleEn}
                  </p>
                  <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/60 mt-2 transition-colors">
                    {category.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom Row - 2 items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {categories.slice(3).map((category) => (
            <Link
              key={category.id}
              to={`/products#${category.id}`}
              className="group relative aspect-[16/9] bg-secondary overflow-hidden card-hover"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <span className="text-xs text-muted-foreground tracking-wider group-hover:text-primary-foreground/80 transition-colors">
                    {category.count} 款
                  </span>
                  <h3 className="font-serif text-2xl text-foreground group-hover:text-primary-foreground mt-2 transition-colors">
                    {category.titleCn}
                  </h3>
                  <p className="text-sm text-muted-foreground group-hover:text-primary-foreground/80 tracking-wide transition-colors">
                    {category.titleEn}
                  </p>
                  <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/60 mt-2 transition-colors">
                    {category.description}
                  </p>
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