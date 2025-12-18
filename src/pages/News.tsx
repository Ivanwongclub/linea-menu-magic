import Header from "@/components/layout/Header";
import Footer from "@/components/footer/Footer";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

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

const News = () => {
  const featuredItems = newsItems.filter((item) => item.featured);
  const regularItems = newsItems.filter((item) => !item.featured);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4 tracking-tight">
            最新動態
          </h1>
          <p className="text-lg text-muted-foreground font-light max-w-2xl">
            展覽資訊 · 企業新聞 · 行業動態
          </p>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-8">
            焦點消息
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredItems.map((item) => (
              <article
                key={item.id}
                className="group relative overflow-hidden bg-card border border-border hover:border-primary/20 transition-all duration-500"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-xs font-medium uppercase tracking-widest text-primary">
                      {item.type === "exhibition" ? "展覽" : "新聞"}
                    </span>
                    <span className="w-8 h-px bg-border" />
                  </div>
                  <h3 className="text-2xl font-light text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {item.subtitle}
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed mb-6">
                    {item.description}
                  </p>
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

      {/* Regular News Grid */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-8">
            更多消息
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularItems.map((item) => (
              <article
                key={item.id}
                className="group bg-background border border-border hover:border-primary/20 transition-all duration-500"
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
                    <span className="text-xs font-medium uppercase tracking-widest text-primary">
                      {item.type === "exhibition" ? "展覽" : "新聞"}
                    </span>
                  </div>
                  <h3 className="text-lg font-light text-foreground mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
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

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-light text-foreground mb-4">
            訂閱最新資訊
          </h2>
          <p className="text-muted-foreground mb-8 font-light">
            獲取展覽預告、產品發布及行業動態
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300 text-sm"
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
