import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Leaf, Recycle, Award, Factory, TreePine, Wind, Droplets, Sun } from "lucide-react";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import { Button } from "@/components/ui/button";

const Sustainability = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: visionRef, isVisible: visionVisible } = useScrollAnimation();
  const { ref: initHeaderRef, isVisible: initHeaderVisible } = useScrollAnimation();
  const { ref: initRef, isVisible: initVisible, getDelay: getInitDelay } = useStaggeredAnimation(4, 150);
  const { ref: greenRef, isVisible: greenVisible } = useScrollAnimation();
  const { ref: certHeaderRef, isVisible: certHeaderVisible } = useScrollAnimation();
  const { ref: certRef, isVisible: certVisible, getDelay: getCertDelay } = useStaggeredAnimation(4, 150);
  const { ref: ecoRef, isVisible: ecoVisible } = useScrollAnimation();

  const initiatives = [
    {
      icon: Recycle,
      titleCn: "再生材料",
      titleEn: "Recycled Materials",
      description: "採用GRS認證的再生聚酯和金屬，減少原材料消耗",
    },
    {
      icon: Factory,
      titleCn: "環保製程",
      titleEn: "Eco-friendly Process",
      description: "引進環保電鍍技術，減少有害化學物質排放",
    },
    {
      icon: Leaf,
      titleCn: "碳足跡管理",
      titleEn: "Carbon Footprint",
      description: "持續監測並降低生產過程中的碳排放",
    },
    {
      icon: Award,
      titleCn: "國際認證",
      titleEn: "Certifications",
      description: "獲得GRS、RCS、OEKO-TEX等國際環保認證",
    },
  ];

  const certifications = [
    {
      name: "GRS",
      fullName: "Global Recycled Standard",
      description: "全球回收標準認證，確保再生材料的可追溯性",
    },
    {
      name: "RCS",
      fullName: "Recycled Claim Standard",
      description: "回收聲明標準，驗證再生成分含量",
    },
    {
      name: "OEKO-TEX",
      fullName: "Standard 100",
      description: "確保產品對人體無害的安全認證",
    },
    {
      name: "ISO 9001",
      fullName: "Quality Management",
      description: "國際品質管理系統認證",
    },
  ];

  const greenVisionItems = [
    { icon: TreePine, title: "綠色供應鏈", desc: "建立可追溯的環保供應商網絡" },
    { icon: Wind, title: "清潔能源", desc: "逐步轉向再生能源供電" },
    { icon: Droplets, title: "水資源保護", desc: "實施閉環水處理系統" },
    { icon: Sun, title: "零碳目標", desc: "2030年實現碳中和承諾" },
  ];

  const greenLifeImages = [
    {
      src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
      alt: "Clean forest environment",
    },
    {
      src: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop",
      alt: "Sustainable living",
    },
    {
      src: "https://images.unsplash.com/photo-1518173946687-a4c036bc4add?w=400&h=300&fit=crop",
      alt: "Clean energy future",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero */}
        <section ref={heroRef} className="py-24 px-6 lg:px-8 bg-secondary overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>Sustainability</p>
            <h1 className={`text-4xl md:text-5xl font-bold text-foreground mb-6 transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '100ms' }}>
              可持續發展
            </h1>
            <p className={`text-lg text-muted-foreground leading-relaxed transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '200ms' }}>
              永續願景，綠色未來
            </p>
          </div>
        </section>

        {/* Vision */}
        <section ref={visionRef} className="py-24 px-6 lg:px-8 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className={`text-3xl font-bold text-foreground mb-8 transition-all duration-700 ease-out ${
              visionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              我們的承諾
            </h2>
            <p className={`text-muted-foreground leading-relaxed text-lg transition-all duration-700 ease-out ${
              visionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '150ms' }}>
              作為服裝輔料行業的領導者，我們深知企業對環境的責任。
              透過創新技術與永續實踐，我們致力於在保持產品品質的同時，
              將環境影響降至最低。
            </p>
          </div>
        </section>

        {/* Initiatives */}
        <section className="py-24 px-6 lg:px-8 bg-secondary overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div ref={initHeaderRef} className="text-center mb-16">
              <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${
                initHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>Initiatives</p>
               <h2 className={`text-3xl font-bold text-foreground transition-all duration-700 ease-out ${
                initHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`} style={{ transitionDelay: '100ms' }}>
                環保行動
              </h2>
            </div>

            <div ref={initRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {initiatives.map((initiative, index) => (
                <div 
                  key={initiative.titleEn} 
                  className={`p-8 bg-background transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1 ${
                    initVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                  }`}
                  style={getInitDelay(index)}
                >
                  <initiative.icon className="w-8 h-8 text-foreground mb-6" strokeWidth={1.5} />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {initiative.titleCn}
                  </h3>
                  <p className="text-xs text-muted-foreground tracking-wide mb-4">
                    {initiative.titleEn}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {initiative.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Green Footprint Banner - Moved from News */}
        <section ref={greenRef} className="py-20 px-6 lg:px-8 bg-secondary overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Content */}
              <div className={`lg:col-span-5 transition-all duration-700 ease-out ${
                greenVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                   <Leaf className="w-5 h-5 text-accent" strokeWidth={1.5} />
                  <span className="text-xs tracking-[0.2em] uppercase text-accent">Green Initiative</span>
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  綠色願景
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  我們相信，每一個微小的改變都能為地球帶來深遠的影響。
                  從材料選擇到生產製程，我們不斷探索更環保的方式，
                  為下一代創造更美好的未來。
                </p>
                
                {/* Green Vision Items */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {greenVisionItems.map((item) => (
                    <div key={item.title} className="flex items-start gap-3 p-3 bg-white/50">
                       <item.icon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Stats */}
                <div className="flex gap-8 mb-6">
                  <div>
                     <p className="text-2xl font-bold text-foreground">30%</p>
                    <p className="text-xs text-muted-foreground">再生材料使用</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">100%</p>
                    <p className="text-xs text-muted-foreground">合規環保標準</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">50+</p>
                    <p className="text-xs text-muted-foreground">環保產品線</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                   <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                    了解環保認證
                  </Button>
                  <Button variant="ghost" className="text-accent hover:bg-secondary">
                    可持續發展報告
                  </Button>
                </div>
              </div>
              
              {/* Images */}
              <div className={`lg:col-span-7 transition-all duration-700 ease-out ${
                greenVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
              }`} style={{ transitionDelay: '200ms' }}>
                <div className="grid grid-cols-3 gap-3">
                  {greenLifeImages.map((image, index) => (
                    <div key={index} className="aspect-[4/3] overflow-hidden">
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-24 px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div ref={certHeaderRef} className="text-center mb-16">
              <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${
                certHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>Certifications</p>
              <h2 className={`text-3xl font-bold text-foreground transition-all duration-700 ease-out ${
                certHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`} style={{ transitionDelay: '100ms' }}>
                國際認證
              </h2>
            </div>

            <div ref={certRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certifications.map((cert, index) => (
                <div 
                  key={cert.name} 
                  className={`p-8 border border-border flex items-start space-x-6 transition-all duration-500 ease-out hover:border-foreground/20 ${
                    certVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                  }`}
                  style={getCertDelay(index)}
                >
                  <div className="flex-shrink-0 w-16 h-16 bg-secondary flex items-center justify-center">
                    <span className="text-lg font-semibold text-foreground">{cert.name}</span>
                  </div>
                  <div>
                    <h3 className="text-foreground font-medium mb-1">{cert.fullName}</h3>
                    <p className="text-sm text-muted-foreground">{cert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Eco-Plating Feature */}
        <section ref={ecoRef} className="py-24 px-6 lg:px-8 bg-foreground text-primary-foreground overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className={`transition-all duration-700 ease-out ${
                ecoVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
              }`}>
                <p className="text-xs tracking-[0.2em] uppercase text-primary-foreground/60 mb-4">
                  Featured Technology
                </p>
                <h2 className="text-3xl font-bold mb-6">
                  環保電鍍技術
                </h2>
                <h3 className="text-xl text-primary-foreground/80 mb-6">
                  Eco-Friendly Electroless Plating
                </h3>
                <div className="space-y-4 text-primary-foreground/70">
                  <p>
                    我們引進先進的環保電鍍技術，相比傳統電鍍方式：
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-primary-foreground/50 rounded-full mr-3" />
                      無需電力，減少能源消耗
                    </li>
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-primary-foreground/50 rounded-full mr-3" />
                      減少有害物質使用
                    </li>
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-primary-foreground/50 rounded-full mr-3" />
                      更均勻的塗層效果
                    </li>
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-primary-foreground/50 rounded-full mr-3" />
                      符合國際環保標準
                    </li>
                  </ul>
                </div>
              </div>
              <div className={`aspect-square bg-primary-foreground/10 transition-all duration-700 ease-out ${
                ecoVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
              }`} style={{ transitionDelay: '200ms' }} />
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Sustainability;