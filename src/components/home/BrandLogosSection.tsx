import { useI18n } from "@/features/i18n/I18nProvider";

interface Brand {
  name: string;
  src: string;
  wide?: boolean;
}

const brands: Brand[] = [
  { name: "Ralph Lauren", src: "/images/brands/ralph-lauren.webp" },
  { name: "Adidas", src: "/images/brands/adidas.webp" },
  { name: "Puma", src: "/images/brands/puma.webp" },
  { name: "Tommy Hilfiger", src: "/images/brands/tommy-hilfiger.webp", wide: true },
  { name: "Michael Kors", src: "/images/brands/michael-kors.webp" },
  { name: "Calvin Klein", src: "/images/brands/calvin-klein.webp", wide: true },
];

const BrandLogosSection = () => {
  const { t } = useI18n();

  return (
    <section className="bg-background border-t border-border py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-8">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground text-center mb-12">
          {t("home.brands.title")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:justify-between items-center gap-12">
          {brands.map((brand) => (
            <div key={brand.name} className="flex items-center justify-center">
              <img
                src={brand.src}
                alt={brand.name}
                loading="lazy"
                decoding="async"
                className={`${
                  brand.wide ? "h-5 md:h-6" : "h-7 md:h-8"
                } w-auto opacity-50 hover:opacity-100 transition-opacity duration-300`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandLogosSection;
