import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const About = () => {
  const milestones = [
    { year: "1979", event: "公司於香港創立", eventEn: "Founded in Hong Kong" },
    { year: "1995", event: "拓展中國大陸生產基地", eventEn: "Expanded to mainland China" },
    { year: "2005", event: "獲得ISO 9001認證", eventEn: "Achieved ISO 9001 certification" },
    { year: "2015", event: "取得OEKO-TEX認證", eventEn: "Obtained OEKO-TEX certification" },
    { year: "2020", event: "GRS及RCS認證通過", eventEn: "GRS & RCS certified" },
    { year: "2024", event: "持續創新，服務全球客戶", eventEn: "Continuous innovation" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero */}
        <section className="py-24 px-6 lg:px-8 bg-secondary">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-subtitle mb-4">About Us</p>
            <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-6">
              關於我們
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              四十五年的匠心傳承，造就卓越品質
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-24 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="font-serif text-3xl font-light text-foreground mb-6">
                  品牌故事
                </h2>
                <div className="space-y-6 text-muted-foreground leading-relaxed">
                  <p>
                    WIN-CYC GROUP LIMITED（雲傑震業集團有限公司）自1979年創立以來，
                    一直專注於服裝輔料的研發、製造與供應。
                  </p>
                  <p>
                    從一家香港小型工廠起步，我們憑藉對品質的堅持與對創新的追求，
                    逐步發展成為服務全球知名品牌的國際供應商。
                  </p>
                  <p>
                    我們相信，每一個細節都能成就完美。無論是一顆精緻的鈕扣，
                    還是一條流暢的拉鏈，都承載著我們對工藝的敬意與對美的追求。
                  </p>
                </div>
              </div>
              <div className="aspect-[4/5] bg-muted" />
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-24 px-6 lg:px-8 bg-secondary">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-subtitle mb-4">Our Values</p>
              <h2 className="font-serif text-3xl font-light text-foreground">
                核心價值
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-background text-center">
                <h3 className="font-serif text-xl text-foreground mb-4">品質至上</h3>
                <p className="text-sm text-muted-foreground">
                  堅持國際品質標準，每一件產品都經過嚴格檢測
                </p>
              </div>
              <div className="p-8 bg-background text-center">
                <h3 className="font-serif text-xl text-foreground mb-4">創新設計</h3>
                <p className="text-sm text-muted-foreground">
                  緊貼時尚潮流，持續研發創新款式與材料
                </p>
              </div>
              <div className="p-8 bg-background text-center">
                <h3 className="font-serif text-xl text-foreground mb-4">永續發展</h3>
                <p className="text-sm text-muted-foreground">
                  實踐環保責任，推動可持續生產方式
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-24 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-subtitle mb-4">Milestones</p>
              <h2 className="font-serif text-3xl font-light text-foreground">
                發展歷程
              </h2>
            </div>

            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-8 group">
                  <div className="flex-shrink-0 w-20 text-right">
                    <span className="font-serif text-2xl text-foreground">{milestone.year}</span>
                  </div>
                  <div className="flex-shrink-0 w-px h-16 bg-border group-last:hidden" />
                  <div className="pt-1">
                    <p className="text-foreground">{milestone.event}</p>
                    <p className="text-sm text-muted-foreground">{milestone.eventEn}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;