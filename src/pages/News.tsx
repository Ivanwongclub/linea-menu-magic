import Header from "@/components/layout/Header";
import Footer from "@/components/footer/Footer";
import { ArrowRight, Calendar, MapPin, Leaf, Recycle, TreeDeciduous } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

type NewsCategory = "all" | "exhibition" | "news" | "sustainability";

const newsItems = [
  {
    id: 1,
    type: "exhibition" as const,
    category: "exhibition" as NewsCategory,
    title: "Première Vision Paris 2025",
    subtitle: "全球紡織面料展覽會",
    date: "2025年2月11-13日",
    location: "法國巴黎",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop",
    description: "WIN-CYC將於Première Vision Paris展示最新環保服裝輔料系列，誠邀業界同仁蒞臨參觀。",
    featured: true,
    tags: ["國際展覽", "環保系列"],
  },
  {
    id: 2,
    type: "sustainability" as const,
    category: "sustainability" as NewsCategory,
    title: "環保認證再獲殊榮",
    subtitle: "OEKO-TEX® 認證",
    date: "2024年12月",
    location: "香港",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop",
    description: "WIN-CYC榮獲OEKO-TEX®環保認證，進一步鞏固集團在可持續發展領域的領先地位。",
    featured: true,
    tags: ["環保認證", "可持續發展"],
  },
  {
    id: 3,
    type: "news" as const,
    category: "news" as NewsCategory,
    title: "WIN-CYC+ 數碼轉型計劃正式啟動",
    subtitle: "引領行業創新",
    date: "2024年12月",
    location: "香港",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&auto=format&fit=crop",
    description: "集團宣布啟動WIN-CYC+數碼轉型計劃，以Speed、Innovation、Digitalization為核心方向。",
    featured: false,
    tags: ["數碼轉型", "創新"],
  },
  {
    id: 4,
    type: "exhibition" as const,
    category: "exhibition" as NewsCategory,
    title: "Intertextile Shanghai 2025",
    subtitle: "中國國際紡織面料及輔料博覽會",
    date: "2025年3月",
    location: "中國上海",
    image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&auto=format&fit=crop",
    description: "展示環保可持續發展系列產品，體現匠心工藝與創新精神的完美結合。",
    featured: false,
    tags: ["國際展覽", "環保系列"],
  },
  {
    id: 5,
    type: "sustainability" as const,
    category: "sustainability" as NewsCategory,
    title: "再生物料研發突破",
    subtitle: "循環經濟實踐",
    date: "2024年11月",
    location: "香港",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop",
    description: "研發團隊成功開發出採用100%再生物料的環保鈕扣系列，為時尚產業注入綠色動力。",
    featured: false,
    tags: ["再生物料", "研發創新"],
  },
  {
    id: 6,
    type: "exhibition" as const,
    category: "exhibition" as NewsCategory,
    title: "Hong Kong Fashion Week 2025",
    subtitle: "香港時裝週",
    date: "2025年1月",
    location: "香港會議展覽中心",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
    description: "與本地及國際設計師攜手合作，展現服裝輔料在時尚設計中的無限可能。",
    featured: false,
    tags: ["本地展覽", "時裝設計"],
  },
  {
    id: 7,
    type: "news" as const,
    category: "news" as NewsCategory,
    title: "設計師工作室平台上線",
    subtitle: "數碼化服務升級",
    date: "2024年10月",
    location: "香港",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
    description: "全新Designer Studio平台正式上線，為設計師提供一站式數碼化產品瀏覽及報價服務。",
    featured: false,
    tags: ["平台上線", "數碼服務"],
  },
  {
    id: 8,
    type: "sustainability" as const,
    category: "sustainability" as NewsCategory,
    title: "碳中和承諾2030",
    subtitle: "企業社會責任",
    date: "2024年9月",
    location: "香港",
    image: "https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=800&auto=format&fit=crop",
    description: "WIN-CYC正式宣布2030年碳中和目標，承諾於生產流程中全面採用可再生能源。",
    featured: false,
    tags: ["碳中和", "企業責任"],
  },
];

const filterTags: { key: NewsCategory; label: string; icon?: React.ReactNode }[] = [
  { key: "all", label: "全部" },
  { key: "sustainability", label: "可持續發展", icon: <Leaf size={14} /> },
  { key: "exhibition", label: "展覽活動", icon: <TreeDeciduous size={14} /> },
  { key: "news", label: "企業新聞", icon: <Recycle size={14} /> },
];

const News = () => {
  const [activeFilter, setActiveFilter] = useState<NewsCategory>("all");
  
  const filteredItems = activeFilter === "all" 
    ? newsItems 
    : newsItems.filter(item => item.category === activeFilter);
  
  const featuredItems = filteredItems.filter((item) => item.featured);
  const regularItems = filteredItems.filter((item) => !item.featured);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section with Green Theme */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        {/* Subtle green gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-eco-subtle via-background to-background opacity-60" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-eco/5 blur-3xl" />
        <div className="absolute bottom-10 left-20 w-48 h-48 rounded-full bg-eco-sage/10 blur-2xl" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-eco/10 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-eco" />
            </div>
            <span className="text-sm tracking-widest uppercase text-eco font-medium">
              Green Footprint
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-foreground mb-6 tracking-tight">
            最新動態
          </h1>
          <p className="text-lg text-muted-foreground font-light max-w-2xl leading-relaxed">
            關注可持續發展 · 展覽資訊 · 企業新聞
          </p>
          
          {/* Eco stats bar */}
          <div className="mt-12 flex flex-wrap gap-8 md:gap-16 pt-8 border-t border-eco/20">
            <div className="flex items-center gap-3">
              <Recycle className="w-5 h-5 text-eco-muted" />
              <div>
                <p className="text-2xl font-light text-foreground">85%</p>
                <p className="text-xs text-muted-foreground">可回收物料</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TreeDeciduous className="w-5 h-5 text-eco-muted" />
              <div>
                <p className="text-2xl font-light text-foreground">2030</p>
                <p className="text-xs text-muted-foreground">碳中和目標</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Leaf className="w-5 h-5 text-eco-muted" />
              <div>
                <p className="text-2xl font-light text-foreground">100+</p>
                <p className="text-xs text-muted-foreground">環保產品系列</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tags */}
      <section className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-y border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {filterTags.map((tag) => (
              <button
                key={tag.key}
                onClick={() => setActiveFilter(tag.key)}
                className={`
                  flex items-center gap-2 px-5 py-2.5 text-sm whitespace-nowrap transition-all duration-300 rounded-full border
                  ${activeFilter === tag.key 
                    ? "bg-eco text-white border-eco shadow-md" 
                    : "bg-transparent text-muted-foreground border-border hover:border-eco/50 hover:text-eco"
                  }
                `}
              >
                {tag.icon}
                <span>{tag.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Section */}
      {featuredItems.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-8 bg-eco rounded-full" />
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                焦點消息
              </h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredItems.map((item) => (
                <article
                  key={item.id}
                  className="group relative overflow-hidden bg-card border border-border hover:border-eco/30 transition-all duration-500 rounded-lg"
                >
                  {/* Green corner accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-eco/10 to-transparent z-10" />
                  
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                    
                    {/* Category badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-eco/90 text-white text-xs rounded-full backdrop-blur-sm">
                      {item.category === "sustainability" && <Leaf size={12} />}
                      {item.category === "exhibition" && <TreeDeciduous size={12} />}
                      {item.category === "news" && <Recycle size={12} />}
                      <span>
                        {item.category === "exhibition" ? "展覽" : item.category === "sustainability" ? "可持續" : "新聞"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <h3 className="text-2xl font-serif font-light text-foreground mb-2 group-hover:text-eco transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {item.subtitle}
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-6">
                      {item.description}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {item.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="px-3 py-1 text-xs bg-eco-subtle text-eco-forest rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Calendar size={14} />
                        {item.date}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin size={14} />
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
      {regularItems.length > 0 && (
        <section className="py-16 px-6 bg-gradient-to-b from-background via-eco-subtle/30 to-background">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-8 bg-eco-muted rounded-full" />
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                更多消息
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularItems.map((item, index) => (
                <article
                  key={item.id}
                  className="group bg-background border border-border hover:border-eco/30 transition-all duration-500 rounded-lg overflow-hidden hover-lift"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="aspect-[16/9] overflow-hidden relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    
                    {/* Category badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-background/90 text-foreground text-xs rounded-full backdrop-blur-sm border border-eco/20">
                      {item.category === "sustainability" && <Leaf size={10} className="text-eco" />}
                      {item.category === "exhibition" && <TreeDeciduous size={10} className="text-eco" />}
                      {item.category === "news" && <Recycle size={10} className="text-eco" />}
                      <span className="text-muted-foreground">
                        {item.category === "exhibition" ? "展覽" : item.category === "sustainability" ? "可持續" : "新聞"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-serif font-light text-foreground mb-2 group-hover:text-eco transition-colors duration-300 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {item.description}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span 
                          key={tag}
                          className="px-2 py-0.5 text-[10px] bg-eco-subtle text-eco-forest rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {item.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} />
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
        <section className="py-24 px-6">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-eco-subtle flex items-center justify-center">
              <Leaf className="w-8 h-8 text-eco-muted" />
            </div>
            <h3 className="text-xl font-serif text-foreground mb-2">暫無相關消息</h3>
            <p className="text-muted-foreground text-sm">請嘗試選擇其他分類</p>
          </div>
        </section>
      )}

      {/* CTA Section with Green Theme */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-eco-forest via-eco to-eco-forest opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAyMGMtNC40MTggMC04LTMuNTgyLTgtOHMzLjU4Mi04IDgtOCA4IDMuNTgyIDggOC0zLjU4MiA4LTggOHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="w-12 h-12 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-light text-white mb-4">
            共同創造可持續未來
          </h2>
          <p className="text-white/80 mb-8 font-light max-w-lg mx-auto">
            訂閱我們的通訊，獲取最新環保產品資訊、展覽預告及可持續發展動態
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-eco-forest hover:bg-white/90 transition-all duration-300 text-sm font-medium rounded-full shadow-lg hover:shadow-xl"
          >
            <span>聯絡我們</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default News;