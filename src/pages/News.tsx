import Header from "@/components/layout/Header";
import Footer from "@/components/footer/Footer";
import { ArrowRight, Calendar, MapPin, Leaf, Recycle, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

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
    description: "WIN-CYC榮獲OEKO-TEX®環保認證，進一步鞏固集團在可持續發展領域的領先地位。",
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

// Animated counter hook
const useCountUp = (end: number, duration: number = 2000, startOnView: boolean = true) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted, startOnView]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration, hasStarted]);

  return { count, ref };
};

const News = () => {
  const featuredItems = newsItems.filter((item) => item.featured);
  const regularItems = newsItems.filter((item) => !item.featured);
  
  const bottlesCounter = useCountUp(12500000, 2500);
  const co2Counter = useCountUp(875, 2500);
  const partnersCounter = useCountUp(156, 2000);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section - More Elegant */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-transparent" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-2xl" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-12 h-px bg-primary" />
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-primary">
              News & Events
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light text-foreground mb-6 tracking-tight">
            最新動態
          </h1>
          <p className="text-xl text-muted-foreground font-light max-w-2xl leading-relaxed">
            展覽資訊 · 企業新聞 · 行業動態
          </p>
        </div>
      </section>

      {/* Sustainability Impact Counter */}
      <section className="py-20 px-6 bg-gradient-to-br from-emerald-950/90 via-emerald-900/80 to-teal-900/70 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border border-white/20 rounded-full" />
          <div className="absolute bottom-20 right-20 w-48 h-48 border border-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 border border-white/15 rounded-full" />
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <Leaf className="w-4 h-4 text-emerald-300" />
              <span className="text-xs font-medium uppercase tracking-widest text-emerald-200">
                Environmental Impact
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
              可持續發展 · 守護地球
            </h2>
            <p className="text-emerald-200/80 font-light max-w-2xl mx-auto">
              我們致力於減少環境足跡，每一個產品都承載著對地球的承諾
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Bottles Counter */}
            <div ref={bottlesCounter.ref} className="text-center group">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-emerald-400/20 rounded-full group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-2 bg-emerald-400/10 rounded-full" />
                <Recycle className="w-8 h-8 text-emerald-300 relative z-10" />
              </div>
              <div className="text-5xl md:text-6xl font-extralight text-white mb-2 tabular-nums">
                {bottlesCounter.count.toLocaleString()}+
              </div>
              <div className="text-sm text-emerald-200/90 font-medium uppercase tracking-widest mb-2">
                Global Bottles
              </div>
              <div className="text-emerald-300/70 font-light">
                再生塑料瓶轉化為環保輔料
              </div>
              <div className="text-xs text-emerald-400/60 mt-2">
                Kept from landfill since 2020
              </div>
            </div>
            
            {/* CO2 Counter */}
            <div className="text-center group">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-teal-400/20 rounded-full group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-2 bg-teal-400/10 rounded-full" />
                <Globe className="w-8 h-8 text-teal-300 relative z-10" />
              </div>
              <div className="text-5xl md:text-6xl font-extralight text-white mb-2 tabular-nums">
                {co2Counter.count.toLocaleString()}
              </div>
              <div className="text-sm text-emerald-200/90 font-medium uppercase tracking-widest mb-2">
                Tonnes CO₂
              </div>
              <div className="text-emerald-300/70 font-light">
                減少碳排放量
              </div>
              <div className="text-xs text-emerald-400/60 mt-2">
                Carbon footprint reduced
              </div>
            </div>
            
            {/* Partners Counter */}
            <div className="text-center group">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-cyan-400/20 rounded-full group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-2 bg-cyan-400/10 rounded-full" />
                <Leaf className="w-8 h-8 text-cyan-300 relative z-10" />
              </div>
              <div className="text-5xl md:text-6xl font-extralight text-white mb-2 tabular-nums">
                {partnersCounter.count.toLocaleString()}+
              </div>
              <div className="text-sm text-emerald-200/90 font-medium uppercase tracking-widest mb-2">
                Eco Partners
              </div>
              <div className="text-emerald-300/70 font-light">
                環保品牌合作夥伴
              </div>
              <div className="text-xs text-emerald-400/60 mt-2">
                Committed to sustainability
              </div>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <Link
              to="/sustainability"
              className="inline-flex items-center gap-2 px-6 py-3 border border-emerald-400/30 text-emerald-200 hover:bg-emerald-400/10 transition-all duration-300 text-sm group"
            >
              <span>了解更多可持續發展計劃</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <span className="w-8 h-px bg-primary" />
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em]">
              焦點消息
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {featuredItems.map((item, index) => (
              <article
                key={item.id}
                className="group relative overflow-hidden bg-card border border-border hover:border-primary/30 transition-all duration-500"
              >
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="p-8 md:p-10">
                  <div className="flex items-center gap-4 mb-5">
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary px-3 py-1 bg-primary/5 border border-primary/10">
                      {item.type === "exhibition" ? "展覽" : "新聞"}
                    </span>
                    <span className="w-8 h-px bg-border" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-light text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 font-medium">
                    {item.subtitle}
                  </p>
                  <p className="text-sm text-foreground/70 leading-relaxed mb-6">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-6 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Calendar size={14} className="text-primary/60" />
                      {item.date}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin size={14} className="text-primary/60" />
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
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <span className="w-8 h-px bg-primary" />
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em]">
              更多消息
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularItems.map((item) => (
              <article
                key={item.id}
                className="group bg-background border border-border hover:border-primary/30 transition-all duration-500 hover:-translate-y-1"
              >
                <div className="aspect-[16/9] overflow-hidden relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary">
                      {item.type === "exhibition" ? "展覽" : "新聞"}
                    </span>
                    <span className="w-4 h-px bg-border" />
                  </div>
                  <h3 className="text-lg font-light text-foreground mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-primary/60" />
                      {item.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-primary/60" />
                      {item.location}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl md:text-4xl font-light text-foreground mb-5">
            訂閱最新資訊
          </h2>
          <p className="text-muted-foreground mb-10 font-light text-lg">
            獲取展覽預告、產品發布及行業動態
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 text-sm group"
          >
            <span>聯絡我們</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default News;
