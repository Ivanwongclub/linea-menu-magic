import Header from "@/components/layout/Header";
import Footer from "@/components/footer/Footer";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";

const newsItems = [
  {
    id: 1,
    type: "exhibition",
    category: "industry",
    title: "Première Vision Paris 2025",
    subtitle: "全球紡織面料展覽會",
    date: "2025年2月11-13日",
    location: "法國巴黎",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop",
    description: "WIN-CYC將於Première Vision Paris展示最新服裝輔料系列，誠邀業界同仁蒞臨參觀。",
    featured: true,
  },
  {
    id: 2,
    type: "news",
    category: "product",
    title: "WIN-CYC+ 數碼轉型計劃正式啟動",
    subtitle: "引領行業創新",
    date: "2024年12月",
    location: "香港",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&auto=format&fit=crop",
    description: "集團宣布啟動WIN-CYC+數碼轉型計劃，以Speed、Innovation、Digitalization為核心方向。",
    featured: true,
  },
  {
    id: 3,
    type: "exhibition",
    category: "industry",
    title: "Intertextile Shanghai 2025",
    subtitle: "中國國際紡織面料及輔料博覽會",
    date: "2025年3月",
    location: "中國上海",
    image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&auto=format&fit=crop",
    description: "展示環保可持續發展系列產品，體現匠心工藝與創新精神的完美結合。",
    featured: false,
  },
  {
    id: 4,
    type: "news",
    category: "certification",
    title: "環保認證再獲殊榮",
    subtitle: "可持續發展里程碑",
    date: "2024年11月",
    location: "香港",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop",
    description: "WIN-CYC榮獲OEKO-TEX環保認證，進一步鞏固集團在可持續發展領域的領先地位。",
    featured: false,
  },
  {
    id: 5,
    type: "exhibition",
    category: "industry",
    title: "Hong Kong Fashion Week 2025",
    subtitle: "香港時裝週",
    date: "2025年1月",
    location: "香港會議展覽中心",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
    description: "與本地及國際設計師攜手合作，展現服裝輔料在時尚設計中的無限可能。",
    featured: false,
  },
  {
    id: 6,
    type: "news",
    category: "product",
    title: "設計師工作室平台上線",
    subtitle: "數碼化服務升級",
    date: "2024年10月",
    location: "香港",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
    description: "全新Designer Studio平台正式上線，為設計師提供一站式數碼化產品瀏覽及報價服務。",
    featured: false,
  },
  {
    id: 7,
    type: "news",
    category: "partnership",
    title: "與國際時裝品牌簽署戰略合作協議",
    subtitle: "全球業務拓展",
    date: "2024年9月",
    location: "香港",
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&auto=format&fit=crop",
    description: "與多個國際知名時裝品牌建立長期戰略合作夥伴關係，進一步擴大全球業務版圖。",
    featured: false,
  },
  {
    id: 8,
    type: "news",
    category: "certification",
    title: "GRS認證審核順利通過",
    subtitle: "環保承諾",
    date: "2024年8月",
    location: "東莞",
    image: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&auto=format&fit=crop",
    description: "集團生產基地順利通過全球回收標準(GRS)年度審核，持續推動可持續發展。",
    featured: false,
  },
];

type FilterType = "all" | "exhibition" | "news";
type CategoryType = "all" | "industry" | "product" | "certification" | "partnership";

const filterOptions: { key: FilterType; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "exhibition", label: "展覽" },
  { key: "news", label: "新聞" },
];

const categoryOptions: { key: CategoryType; label: string }[] = [
  { key: "all", label: "所有類別" },
  { key: "industry", label: "行業動態" },
  { key: "product", label: "產品發佈" },
  { key: "certification", label: "認證資訊" },
  { key: "partnership", label: "合作夥伴" },
];

const News = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeCategory, setActiveCategory] = useState<CategoryType>("all");
  
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: filterRef, isVisible: filterVisible } = useScrollAnimation();
  const { ref: featuredHeaderRef, isVisible: featuredHeaderVisible } = useScrollAnimation();
  const { ref: featuredRef, isVisible: featuredVisible, getDelay: getFeaturedDelay } = useStaggeredAnimation(2, 150);
  const { ref: regularHeaderRef, isVisible: regularHeaderVisible } = useScrollAnimation();
  const { ref: regularRef, isVisible: regularVisible, getDelay: getRegularDelay } = useStaggeredAnimation(8, 100);
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  const filteredItems = newsItems.filter((item) => {
    const typeMatch = activeFilter === "all" || item.type === activeFilter;
    const categoryMatch = activeCategory === "all" || item.category === activeCategory;
    return typeMatch && categoryMatch;
  });

  const filteredFeaturedItems = filteredItems.filter((item) => item.featured);
  const filteredRegularItems = filteredItems.filter((item) => !item.featured);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section - Same style as About page */}
        <section ref={heroRef} className="py-24 px-6 lg:px-8 bg-secondary overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>News & Events</p>
            <h1 className={`font-serif text-4xl md:text-5xl font-light text-foreground mb-6 transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '100ms' }}>
              最新動態
            </h1>
            <p className={`text-lg text-muted-foreground leading-relaxed transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '200ms' }}>
              展覽資訊 · 企業新聞 · 行業動態
            </p>
          </div>
        </section>

        {/* Sticky Category Filter Bar */}
        <div ref={filterRef} className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className={`flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-700 ease-out ${
              filterVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-2">類型</span>
                {filterOptions.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`px-3 py-1.5 text-sm transition-all duration-300 ${
                      activeFilter === filter.key
                        ? "bg-foreground text-background"
                        : "bg-transparent text-foreground hover:bg-secondary border border-border"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              
              {/* Category Filter */}
              <div className="flex items-center gap-2 sm:ml-6">
                <span className="text-xs text-muted-foreground mr-2">分類</span>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((category) => (
                    <button
                      key={category.key}
                      onClick={() => setActiveCategory(category.key)}
                      className={`px-3 py-1.5 text-sm transition-all duration-300 ${
                        activeCategory === category.key
                          ? "bg-foreground text-background"
                          : "bg-transparent text-foreground hover:bg-secondary border border-border"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Section */}
        {filteredFeaturedItems.length > 0 && (
          <section className="py-16 px-6 lg:px-8 overflow-hidden">
            <div className="max-w-7xl mx-auto">
              <div ref={featuredHeaderRef} className="flex items-center gap-4 mb-8">
                <h2 className={`text-xs font-medium text-muted-foreground uppercase tracking-widest transition-all duration-700 ease-out ${
                  featuredHeaderVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                }`}>
                  焦點消息
                </h2>
                <div className={`flex-1 h-px bg-border transition-all duration-700 ease-out ${
                  featuredHeaderVisible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                }`} style={{ transformOrigin: 'left', transitionDelay: '200ms' }} />
              </div>
              
              <div ref={featuredRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredFeaturedItems.map((item, index) => (
                  <article
                    key={item.id}
                    className={`group relative overflow-hidden bg-background border border-border hover:border-foreground/20 transition-all duration-500 ${
                      featuredVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                    }`}
                    style={getFeaturedDelay(index)}
                  >
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-medium uppercase tracking-widest text-foreground/70">
                          {item.type === "exhibition" ? "展覽" : "新聞"}
                        </span>
                        <span className="w-6 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">
                          {categoryOptions.find(c => c.key === item.category)?.label}
                        </span>
                      </div>
                      <h3 className="text-xl font-serif font-light text-foreground mb-1 group-hover:text-foreground/80 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {item.subtitle}
                      </p>
                      <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {item.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Regular News Grid */}
        {filteredRegularItems.length > 0 && (
          <section className="py-16 px-6 lg:px-8 bg-secondary overflow-hidden">
            <div className="max-w-7xl mx-auto">
              <div ref={regularHeaderRef} className="flex items-center gap-4 mb-8">
                <h2 className={`text-xs font-medium text-muted-foreground uppercase tracking-widest transition-all duration-700 ease-out ${
                  regularHeaderVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                }`}>
                  更多消息
                </h2>
                <div className={`flex-1 h-px bg-border transition-all duration-700 ease-out ${
                  regularHeaderVisible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                }`} style={{ transformOrigin: 'left', transitionDelay: '200ms' }} />
              </div>
              
              <div ref={regularRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredRegularItems.map((item, index) => (
                  <article
                    key={item.id}
                    className={`group bg-background border border-border hover:border-foreground/20 transition-all duration-500 ${
                      regularVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                    }`}
                    style={getRegularDelay(index)}
                  >
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-foreground/70">
                          {item.type === "exhibition" ? "展覽" : "新聞"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {categoryOptions.find(c => c.key === item.category)?.label}
                        </span>
                      </div>
                      <h3 className="text-sm font-serif font-light text-foreground mt-1 mb-2 group-hover:text-foreground/80 transition-colors duration-300 line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {item.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {item.location}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <section className="py-24 px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
              <p className="text-muted-foreground">暫無符合條件的內容</p>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section ref={ctaRef} className="py-16 px-6 lg:px-8 border-t border-border overflow-hidden">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className={`text-xl md:text-2xl font-serif font-light text-foreground mb-2 transition-all duration-700 ease-out ${
              ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              訂閱最新資訊
            </h2>
            <p className={`text-sm text-muted-foreground mb-6 font-light transition-all duration-700 ease-out ${
              ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '100ms' }}>
              獲取展覽預告、產品發布及行業動態
            </p>
            <Link
              to="/contact"
              className={`inline-flex items-center gap-2 px-6 py-2.5 bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 text-sm ${
                ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: '200ms' }}
            >
              <span>聯絡我們</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default News;