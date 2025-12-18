import Header from "@/components/layout/Header";
import Footer from "@/components/footer/Footer";
import { ArrowRight, Calendar, MapPin, Leaf, Recycle, TreePine, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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

const greenLifeImages = [
  {
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&fit=crop",
    title: "自然共生",
    description: "與大自然和諧相處",
  },
  {
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop",
    title: "清新空氣",
    description: "呼吸更純淨的空氣",
  },
  {
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&auto=format&fit=crop",
    title: "綠色城市",
    description: "打造宜居的生活環境",
  },
  {
    image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=600&auto=format&fit=crop",
    title: "永續森林",
    description: "守護地球的綠色屏障",
  },
];

const News = () => {
  const featuredItems = newsItems.filter((item) => item.featured);
  const regularItems = newsItems.filter((item) => !item.featured);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-light text-foreground mb-4 tracking-tight">
            最新動態
          </h1>
          <p className="text-lg text-muted-foreground font-light max-w-2xl">
            展覽資訊 · 企業新聞 · 行業動態
          </p>
        </div>
      </section>

      {/* Green Footprint Banner */}
      <section className="relative py-20 px-6 bg-white overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-sage/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-sage/30 to-transparent" />
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full border border-green-mist/40 opacity-60" />
        <div className="absolute bottom-10 left-10 w-24 h-24 rounded-full border border-green-sage/30 opacity-40" />
        
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 border border-green-sage/30 rounded-full">
                <Leaf className="w-4 h-4 text-green-forest" />
                <span className="text-sm text-green-forest tracking-wide">Green Initiative</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-foreground leading-tight">
                綠色足跡
                <span className="block text-green-forest mt-2">永續未來</span>
              </h2>
              
              <p className="text-muted-foreground leading-relaxed max-w-lg">
                我們致力於減少碳足跡，採用環保材料與可持續生產流程。
                每一個選擇，都是為了更美好的明天。
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="outline" 
                  className="border-green-forest text-green-forest hover:bg-green-forest hover:text-white transition-all duration-300 rounded-none px-6"
                >
                  <Recycle className="w-4 h-4 mr-2" />
                  了解環保認證
                </Button>
                <Button 
                  variant="outline" 
                  className="border-green-sage text-green-sage hover:bg-green-sage hover:text-white transition-all duration-300 rounded-none px-6"
                >
                  <TreePine className="w-4 h-4 mr-2" />
                  可持續發展報告
                </Button>
              </div>
              
              {/* Stats */}
              <div className="flex gap-12 pt-6 border-t border-green-mist/30">
                <div>
                  <p className="text-3xl font-serif text-green-forest">30%</p>
                  <p className="text-sm text-muted-foreground mt-1">碳排放減少</p>
                </div>
                <div>
                  <p className="text-3xl font-serif text-green-forest">100%</p>
                  <p className="text-sm text-muted-foreground mt-1">可回收包裝</p>
                </div>
                <div>
                  <p className="text-3xl font-serif text-green-forest">50+</p>
                  <p className="text-sm text-muted-foreground mt-1">環保產品線</p>
                </div>
              </div>
            </div>
            
            {/* Image Grid */}
            <div className="grid grid-cols-2 gap-4">
              {greenLifeImages.map((item, index) => (
                <div 
                  key={index}
                  className={`relative overflow-hidden group ${index === 0 ? 'row-span-2' : ''}`}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                      index === 0 ? 'h-full' : 'h-48'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-deep/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-white font-light text-sm">{item.title}</p>
                    <p className="text-white/70 text-xs">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Green Vision Section */}
      <section className="py-16 px-6 bg-green-light/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-serif font-light text-foreground mb-4">
              邁向更美好的生活
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              當我們共同努力減少碳足跡，世界將會變得更加美好
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Wind, title: "清新空氣", desc: "減少污染物排放" },
              { icon: TreePine, title: "綠色森林", desc: "保護自然生態" },
              { icon: Recycle, title: "循環經濟", desc: "資源永續利用" },
              { icon: Leaf, title: "健康生活", desc: "與自然和諧共處" },
            ].map((item, index) => (
              <div 
                key={index}
                className="bg-white p-8 text-center group hover:shadow-lg transition-all duration-500"
              >
                <div className="w-16 h-16 mx-auto mb-4 border border-green-sage/30 rounded-full flex items-center justify-center group-hover:border-green-forest group-hover:bg-green-forest transition-all duration-300">
                  <item.icon className="w-6 h-6 text-green-sage group-hover:text-white transition-colors duration-300" />
                </div>
                <h4 className="font-light text-foreground mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-10">
            <Link to="/sustainability">
              <Button 
                className="bg-green-forest hover:bg-green-deep text-white rounded-none px-8 py-3 transition-all duration-300"
              >
                探索我們的綠色承諾
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              焦點消息
            </h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredItems.map((item) => (
              <article
                key={item.id}
                className="group relative overflow-hidden bg-white border border-border hover:border-green-sage/40 transition-all duration-500"
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
                    <span className="text-xs font-medium uppercase tracking-widest text-green-forest">
                      {item.type === "exhibition" ? "展覽" : "新聞"}
                    </span>
                    <span className="w-8 h-px bg-green-mist" />
                  </div>
                  <h3 className="text-2xl font-serif font-light text-foreground mb-2 group-hover:text-green-forest transition-colors duration-300">
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
                      <Calendar className="w-3.5 h-3.5" />
                      {item.date}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
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
      <section className="py-16 px-6 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              更多消息
            </h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularItems.map((item) => (
              <article
                key={item.id}
                className="group bg-white border border-border hover:border-green-sage/40 transition-all duration-500"
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
                  </div>
                  <h3 className="text-lg font-serif font-light text-foreground mb-2 group-hover:text-green-forest transition-colors duration-300 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
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

      {/* CTA Section */}
      <section className="py-20 px-6 bg-white border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-light text-foreground mb-4">
            訂閱最新資訊
          </h2>
          <p className="text-muted-foreground mb-8 font-light">
            獲取展覽預告、產品發布及行業動態
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-3 bg-green-forest text-white hover:bg-green-deep transition-colors duration-300 text-sm"
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
