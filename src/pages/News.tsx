import Header from "@/components/layout/Header";
import Footer from "@/components/footer/Footer";
import { ArrowRight, Calendar, MapPin, Leaf, Recycle, TreePine, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const newsItems = [
  {
    id: 1,
    type: "exhibition",
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
    title: "設計師工作室平台上線",
    subtitle: "數碼化服務升級",
    date: "2024年10月",
    location: "香港",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
    description: "全新Designer Studio平台正式上線，為設計師提供一站式數碼化產品瀏覽及報價服務。",
    featured: false,
  },
];

const greenLifeImages = [
  {
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&fit=crop",
    title: "自然共生",
  },
  {
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop",
    title: "清新空氣",
  },
  {
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&auto=format&fit=crop",
    title: "綠色城市",
  },
];

type FilterType = "all" | "exhibition" | "news";

const News = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  
  const filteredFeaturedItems = newsItems.filter(
    (item) => item.featured && (activeFilter === "all" || item.type === activeFilter)
  );
  const filteredRegularItems = newsItems.filter(
    (item) => !item.featured && (activeFilter === "all" || item.type === activeFilter)
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section - Compact */}
      <section className="pt-20 pb-8 px-6 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-serif font-light text-foreground mb-2 tracking-tight">
            最新動態
          </h1>
          <p className="text-base text-muted-foreground font-light">
            展覽資訊 · 企業新聞 · 行業動態
          </p>
        </div>
      </section>

      {/* Sticky Category Filter Bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2">
            {[
              { key: "all" as FilterType, label: "全部" },
              { key: "exhibition" as FilterType, label: "展覽" },
              { key: "news" as FilterType, label: "新聞" },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-1.5 text-sm transition-all duration-300 ${
                  activeFilter === filter.key
                    ? "bg-green-forest text-white"
                    : "bg-transparent text-foreground hover:bg-green-light/50 border border-border"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Green Footprint Banner - Optimized */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Text Content - 5 columns */}
            <div className="lg:col-span-5 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-green-sage/30 rounded-full">
                <Leaf className="w-3.5 h-3.5 text-green-forest" />
                <span className="text-xs text-green-forest tracking-wide">Green Initiative</span>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-serif font-light text-foreground leading-tight">
                綠色足跡
                <span className="block text-green-forest mt-1">永續未來</span>
              </h2>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                我們致力於減少碳足跡，採用環保材料與可持續生產流程。每一個選擇，都是為了更美好的明天。
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-green-forest text-green-forest hover:bg-green-forest hover:text-white transition-all duration-300 rounded-none text-xs h-9"
                >
                  <Recycle className="w-3.5 h-3.5 mr-1.5" />
                  了解環保認證
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-green-sage text-green-sage hover:bg-green-sage hover:text-white transition-all duration-300 rounded-none text-xs h-9"
                >
                  <TreePine className="w-3.5 h-3.5 mr-1.5" />
                  可持續發展報告
                </Button>
              </div>
              
              {/* Stats - Compact */}
              <div className="flex gap-8 pt-4 border-t border-green-mist/30">
                <div>
                  <p className="text-2xl font-serif text-green-forest">30%</p>
                  <p className="text-xs text-muted-foreground">碳排放減少</p>
                </div>
                <div>
                  <p className="text-2xl font-serif text-green-forest">100%</p>
                  <p className="text-xs text-muted-foreground">可回收包裝</p>
                </div>
                <div>
                  <p className="text-2xl font-serif text-green-forest">50+</p>
                  <p className="text-xs text-muted-foreground">環保產品線</p>
                </div>
              </div>
            </div>
            
            {/* Image Grid - 7 columns, aligned */}
            <div className="lg:col-span-7 grid grid-cols-3 gap-2">
              {greenLifeImages.map((item, index) => (
                <div 
                  key={index}
                  className="relative overflow-hidden group aspect-[4/5]"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-deep/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-white font-light text-xs">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Green Vision Section - Compact */}
      <section className="py-10 px-6 bg-green-light/40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-xl font-serif font-light text-foreground mb-1">
                邁向更美好的生活
              </h3>
              <p className="text-sm text-muted-foreground">
                當我們共同努力減少碳足跡，世界將會變得更加美好
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Wind, title: "清新空氣" },
                { icon: TreePine, title: "綠色森林" },
                { icon: Recycle, title: "循環經濟" },
                { icon: Leaf, title: "健康生活" },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 bg-white px-4 py-2 group hover:bg-green-forest transition-all duration-300"
                >
                  <item.icon className="w-4 h-4 text-green-forest group-hover:text-white transition-colors duration-300" />
                  <span className="text-sm text-foreground group-hover:text-white transition-colors duration-300">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              焦點消息
            </h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredFeaturedItems.map((item) => (
              <article
                key={item.id}
                className="group relative overflow-hidden bg-white border border-border hover:border-green-sage/40 transition-all duration-500"
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
                    <span className="text-xs font-medium uppercase tracking-widest text-green-forest">
                      {item.type === "exhibition" ? "展覽" : "新聞"}
                    </span>
                    <span className="w-6 h-px bg-green-mist" />
                  </div>
                  <h3 className="text-xl font-serif font-light text-foreground mb-1 group-hover:text-green-forest transition-colors duration-300">
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

      {/* Regular News Grid */}
      <section className="py-12 px-6 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              更多消息
            </h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredRegularItems.map((item) => (
              <article
                key={item.id}
                className="group bg-white border border-border hover:border-green-sage/40 transition-all duration-500"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-green-forest">
                    {item.type === "exhibition" ? "展覽" : "新聞"}
                  </span>
                  <h3 className="text-sm font-serif font-light text-foreground mt-1 mb-2 group-hover:text-green-forest transition-colors duration-300 line-clamp-2">
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

      {/* CTA Section - Compact */}
      <section className="py-12 px-6 bg-white border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl md:text-2xl font-serif font-light text-foreground mb-2">
            訂閱最新資訊
          </h2>
          <p className="text-sm text-muted-foreground mb-6 font-light">
            獲取展覽預告、產品發布及行業動態
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-forest text-white hover:bg-green-deep transition-colors duration-300 text-sm"
          >
            <span>聯絡我們</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default News;
