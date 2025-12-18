import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import AboutSidebar from "../../components/about/AboutSidebar";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import { Award, Shield, Leaf, CheckCircle, FileCheck, Globe } from "lucide-react";

const Certificates = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: certsRef, isVisible: certsVisible, getDelay: getCertsDelay } = useStaggeredAnimation(6, 100);
  const { ref: standardsRef, isVisible: standardsVisible, getDelay: getStandardsDelay } = useStaggeredAnimation(4, 150);
  const { ref: commitmentRef, isVisible: commitmentVisible } = useScrollAnimation();

  const certificates = [
    {
      icon: Shield,
      name: "ISO 9001:2015",
      category: "品質管理系統",
      description: "國際標準化組織認證的品質管理體系，確保產品及服務持續滿足客戶需求。",
      validUntil: "2027年",
      scope: "鈕扣、拉鏈、金屬配件生產",
    },
    {
      icon: Leaf,
      name: "OEKO-TEX® Standard 100",
      category: "環保安全認證",
      description: "證明產品對人體健康無害，不含有害物質，適用於嬰幼兒及敏感肌膚。",
      validUntil: "2025年",
      scope: "全系列服裝輔料產品",
    },
    {
      icon: Globe,
      name: "GRS (Global Recycled Standard)",
      category: "全球回收標準",
      description: "驗證產品含有再生材料的國際標準，確保可追溯性及環保合規性。",
      validUntil: "2025年",
      scope: "再生材料產品線",
    },
    {
      icon: FileCheck,
      name: "ISO 14001:2015",
      category: "環境管理系統",
      description: "證明企業在環境保護方面的承諾，包括資源節約及污染防治措施。",
      validUntil: "2026年",
      scope: "生產設施及營運流程",
    },
    {
      icon: Award,
      name: "BSCI (Business Social Compliance Initiative)",
      category: "社會責任認證",
      description: "確保供應鏈符合國際勞工標準及社會責任要求。",
      validUntil: "2025年",
      scope: "所有生產基地",
    },
    {
      icon: CheckCircle,
      name: "REACH Compliance",
      category: "歐盟化學品法規",
      description: "符合歐盟化學品註冊、評估、許可和限制法規的產品合規認證。",
      validUntil: "持續更新",
      scope: "出口歐盟市場產品",
    },
  ];

  const standards = [
    {
      title: "產品安全標準",
      items: ["無鎳釋放測試", "無鉛成分認證", "色牢度測試", "拉力強度測試"],
    },
    {
      title: "環保合規標準",
      items: ["無偶氮染料", "無甲醛認證", "RoHS合規", "低VOC排放"],
    },
    {
      title: "品質控制標準",
      items: ["AQL 1.5抽樣標準", "100%出貨前檢驗", "可追溯性系統", "定期第三方審核"],
    },
    {
      title: "社會責任標準",
      items: ["公平勞工待遇", "安全工作環境", "禁止童工", "反歧視政策"],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>
        
        <main className="w-full lg:w-[70vw] lg:ml-auto">
          {/* Hero Section */}
          <section ref={heroRef} className="py-24 px-6 bg-secondary overflow-hidden">
            <div className="max-w-3xl">
              <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${
                heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>Quality Assurance</p>
              <h1 className={`font-serif text-4xl md:text-5xl font-light text-foreground mb-6 transition-all duration-700 ease-out ${
                heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`} style={{ transitionDelay: '100ms' }}>
                認證與標準
              </h1>
              <p className={`text-lg text-muted-foreground leading-relaxed transition-all duration-700 ease-out ${
                heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`} style={{ transitionDelay: '200ms' }}>
                品質保證 · 環保合規 · 社會責任 · 國際認可
              </p>
            </div>
          </section>

          {/* Certificates Grid */}
          <section className="py-16 px-6 overflow-hidden">
            <div className="mb-10">
              <h2 className="text-2xl font-light text-foreground mb-2">國際認證</h2>
              <p className="text-sm text-muted-foreground">我們持有的主要國際認證與合規證書</p>
            </div>
            <div ref={certsRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert, index) => (
                <div 
                  key={index}
                  className={`p-6 bg-background border border-border hover:border-foreground/20 transition-all duration-500 group ${
                    certsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                  }`}
                  style={getCertsDelay(index)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <cert.icon className="w-8 h-8 text-foreground/60 group-hover:text-foreground/80 transition-colors duration-300" strokeWidth={1.5} />
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1">有效至 {cert.validUntil}</span>
                  </div>
                  <h3 className="text-lg font-light text-foreground mb-1">{cert.name}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{cert.category}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{cert.description}</p>
                  <div className="pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">適用範圍：{cert.scope}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Standards Section */}
          <section className="py-16 px-6 bg-secondary overflow-hidden">
            <div className="mb-10">
              <h2 className="text-2xl font-light text-foreground mb-2">合規標準</h2>
              <p className="text-sm text-muted-foreground">我們嚴格遵循的品質與合規標準體系</p>
            </div>
            <div ref={standardsRef} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {standards.map((standard, index) => (
                <div 
                  key={index}
                  className={`p-6 bg-background border border-border transition-all duration-500 ${
                    standardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                  }`}
                  style={getStandardsDelay(index)}
                >
                  <h3 className="text-base font-light text-foreground mb-4 pb-4 border-b border-border">{standard.title}</h3>
                  <ul className="space-y-3">
                    {standard.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-foreground/40 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Testing & Verification */}
          <section ref={commitmentRef} className="py-16 px-6 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className={`transition-all duration-700 ease-out ${
                commitmentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
              }`}>
                <h2 className="text-2xl font-light text-foreground mb-4">第三方測試與驗證</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  我們與多家國際知名測試機構合作，定期對產品進行獨立第三方測試及驗證。這些測試涵蓋物理性能、化學安全、環保合規等多個範疇，確保產品符合全球各市場的監管要求。
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-secondary">
                    <div className="w-12 h-12 flex items-center justify-center bg-background">
                      <span className="text-xs font-medium text-foreground">SGS</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">SGS Testing Services</div>
                      <div className="text-xs text-muted-foreground">全球領先的測試認證機構</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-secondary">
                    <div className="w-12 h-12 flex items-center justify-center bg-background">
                      <span className="text-xs font-medium text-foreground">BV</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Bureau Veritas</div>
                      <div className="text-xs text-muted-foreground">國際檢驗認證集團</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-secondary">
                    <div className="w-12 h-12 flex items-center justify-center bg-background">
                      <span className="text-xs font-medium text-foreground">ITS</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Intertek</div>
                      <div className="text-xs text-muted-foreground">質量與安全解決方案提供商</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`aspect-square overflow-hidden transition-all duration-700 ease-out ${
                commitmentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
              }`} style={{ transitionDelay: '200ms' }}>
                <img 
                  src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop"
                  alt="Quality testing laboratory"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </section>

          {/* Commitment Banner */}
          <section className="py-16 px-6 bg-secondary border-t border-border overflow-hidden">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-light text-foreground mb-4">我們的承諾</h2>
              <p className="text-muted-foreground leading-relaxed">
                WIN-CYC承諾持續投資於品質管理及認證體系的完善。我們相信，嚴格的標準與透明的合規措施是建立客戶信任的基石。未來，我們將繼續擴展認證範圍，以滿足全球客戶及監管機構日益嚴格的要求。
              </p>
            </div>
          </section>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default Certificates;