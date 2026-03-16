import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import ContentSection from "../../components/about/ContentSection";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";

const Sustainability = () => {
  const { ref: commitmentRef, isVisible: commitmentVisible } = useScrollAnimation();
  const { ref: goalsRef, isVisible: goalsVisible, getDelay: getGoalsDelay } = useStaggeredAnimation(3, 150);
  const { ref: practicesRef, isVisible: practicesVisible } = useScrollAnimation();
  const { ref: certsRef, isVisible: certsVisible, getDelay: getCertsDelay } = useStaggeredAnimation(4, 100);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <PageBreadcrumb
            segments={[
              { label: "Home", href: "/" },
              { label: "About", href: "/about" },
              { label: "Sustainability" },
            ]}
            title="可持續發展"
          />
        
          <div ref={commitmentRef} className={`transition-all duration-700 ${commitmentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <ContentSection title="環保承諾">
              <div className="grid md:grid-cols-2 gap-12 mb-16">
                <div className="space-y-6">
                  <h3 className="text-xl font-light text-foreground">環保材料</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    我們積極採用再生材料與環保原料，包括再生金屬、有機棉、回收塑料等，減少對環境的影響，同時確保產品品質不受影響。
                  </p>
                </div>
                <div className="space-y-6">
                  <h3 className="text-xl font-light text-foreground">綠色生產</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    生產設施採用節能設備與環保工藝，持續優化生產流程，減少能源消耗與廢棄物排放，實現綠色製造目標。
                  </p>
                </div>
              </div>

              <div ref={goalsRef} className="bg-secondary p-8">
                <h3 className="text-2xl font-light text-foreground mb-6">環保目標</h3>
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { value: "50%", label: "再生材料使用比例（2025年目標）" },
                    { value: "30%", label: "碳排放減少（2030年目標）" },
                    { value: "Zero", label: "生產廢棄物填埋政策" },
                  ].map((goal, index) => (
                    <div 
                      key={index}
                      className={`transition-all duration-500 ${goalsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                      style={getGoalsDelay(index)}
                    >
                      <div className="text-3xl font-bold text-foreground mb-2">{goal.value}</div>
                      <p className="text-sm text-muted-foreground">{goal.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ContentSection>
          </div>

          <div ref={practicesRef} className={`transition-all duration-700 ${practicesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <ContentSection title="可持續實踐">
              <div className="space-y-8">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  我們將可持續發展理念融入業務的每個環節，從原材料採購到產品交付，確保整個供應鏈的環保合規。
                </p>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-light text-foreground">供應鏈管理</h3>
                    <p className="text-muted-foreground">
                      嚴格篩選供應商，確保原材料來源合法、符合環保標準，建立透明可追溯的供應鏈體系。
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-light text-foreground">員工福祉</h3>
                    <p className="text-muted-foreground">
                      提供安全健康的工作環境，遵守勞動法規，保障員工權益，促進可持續的企業發展。
                    </p>
                  </div>
                </div>
              </div>
            </ContentSection>
          </div>

          <ContentSection title="認證與標準">
            <div className="space-y-8">
              <p className="text-muted-foreground leading-relaxed">
                我們通過多項國際認證，證明我們對可持續發展的承諾與實踐成果。
              </p>
              
              <div ref={certsRef} className="grid md:grid-cols-4 gap-8 items-center">
                {[
                  { name: "GRS", desc: "全球回收標準" },
                  { name: "OEKO-TEX", desc: "生態紡織品認證" },
                  { name: "ISO 14001", desc: "環境管理體系" },
                  { name: "BSCI", desc: "商業社會責任" },
                ].map((cert, index) => (
                  <div 
                    key={cert.name}
                    className={`h-24 bg-secondary flex flex-col items-center justify-center transition-all duration-500 ${
                      certsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={getCertsDelay(index)}
                  >
                    <span className="text-lg font-light text-foreground">{cert.name}</span>
                    <span className="text-xs text-muted-foreground mt-1">{cert.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </ContentSection>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Sustainability;
