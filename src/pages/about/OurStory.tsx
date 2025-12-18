import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import ImageTextBlock from "../../components/about/ImageTextBlock";
import AboutSidebar from "../../components/about/AboutSidebar";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const OurStory = () => {
  const { ref: section1Ref, isVisible: section1Visible } = useScrollAnimation();
  const { ref: section2Ref, isVisible: section2Visible } = useScrollAnimation();
  const { ref: section3Ref, isVisible: section3Visible } = useScrollAnimation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <PageHeader 
            title="我們的故事" 
            subtitle="四十五年匠心傳承，服務全球品牌"
          />
          
          <div ref={section1Ref} className={`transition-all duration-700 ${section1Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <ContentSection>
              <ImageTextBlock
                image="/founders.png"
                imageAlt="WIN-CYC 創辦人"
                title="創業初心"
                content="WIN-CYC GROUP LIMITED（雲傑震業集團有限公司）於1979年在香港創立。創辦人憑藉對服裝輔料行業的熱忱與專業，從一家小型工廠起步，致力於為服裝品牌提供優質的鈕扣、拉鏈及配件產品。"
                imagePosition="left"
              />
            </ContentSection>
          </div>

          <div ref={section2Ref} className={`transition-all duration-700 ${section2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '150ms' }}>
            <ContentSection title="傳承與發展">
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-xl font-light text-foreground">傳統工藝</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    我們堅持傳統工藝與現代技術的結合，每一件產品都經過嚴格的品質控制。從原材料採購到成品出廠，每個環節都體現我們對品質的執著追求。
                  </p>
                </div>
                <div className="space-y-6">
                  <h3 className="text-xl font-light text-foreground">可持續發展</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    我們相信企業發展與環境保護可以並行。通過採用環保材料、優化生產流程，我們致力於減少對環境的影響，為可持續時尚產業貢獻力量。
                  </p>
                </div>
              </div>
            </ContentSection>
          </div>

          <div ref={section3Ref} className={`transition-all duration-700 ${section3Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '300ms' }}>
            <ContentSection title="核心價值">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-foreground">品質至上</h3>
                  <p className="text-muted-foreground">
                    堅持國際品質標準，確保每一件產品都經過嚴格檢測與認證。
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-foreground">客戶為本</h3>
                  <p className="text-muted-foreground">
                    深入了解客戶需求，提供專業的產品建議與定制服務。
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-foreground">創新精神</h3>
                  <p className="text-muted-foreground">
                    持續研發新款式與材料，緊貼時尚潮流與市場需求。
                  </p>
                </div>
              </div>
            </ContentSection>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default OurStory;