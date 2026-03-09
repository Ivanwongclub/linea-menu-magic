import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import aboutHeritageImage from "@/assets/about-heritage.jpg";
import aboutShowroomImage from "@/assets/about-showroom.jpg";

const About = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: storyRef, isVisible: storyVisible } = useScrollAnimation();
  const { ref: valuesHeaderRef, isVisible: valuesHeaderVisible } = useScrollAnimation();
  const { ref: valuesRef, isVisible: valuesVisible, getDelay: getValuesDelay } = useStaggeredAnimation(3, 150);
  const { ref: timelineHeaderRef, isVisible: timelineHeaderVisible } = useScrollAnimation();
  const { ref: timelineRef, isVisible: timelineVisible, getDelay: getTimelineDelay } = useStaggeredAnimation(6, 100);

  const milestones = [
    { year: "1979", event: "公司於香港創立", eventEn: "Founded in Hong Kong" },
    { year: "1995", event: "拓展中國大陸生產基地", eventEn: "Expanded to mainland China" },
    { year: "2005", event: "獲得ISO 9001認證", eventEn: "Achieved ISO 9001 certification" },
    { year: "2015", event: "取得OEKO-TEX認證", eventEn: "Obtained OEKO-TEX certification" },
    { year: "2020", event: "GRS及RCS認證通過", eventEn: "GRS & RCS certified" },
    { year: "2024", event: "持續創新，服務全球客戶", eventEn: "Continuous innovation" },
  ];

  const values = [
    { title: "品質至上", desc: "堅持國際品質標準，每一件產品都經過嚴格檢測" },
    { title: "創新設計", desc: "緊貼時尚潮流，持續研發創新款式與材料" },
    { title: "永續發展", desc: "實踐環保責任，推動可持續生產方式" },
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
            }`}>About Us</p>
            <h1 className={`text-4xl md:text-5xl font-bold text-foreground mb-6 transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '100ms' }}>
              關於我們
            </h1>
            <p className={`text-lg text-muted-foreground leading-relaxed transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '200ms' }}>
              四十五年的匠心傳承，造就卓越品質
            </p>
          </div>
        </section>

        {/* Story */}
        <section ref={storyRef} className="py-24 px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className={`text-3xl font-bold text-foreground mb-6 transition-all duration-700 ease-out ${
                  storyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}>
                  品牌故事
                </h2>
                <div className={`space-y-6 text-muted-foreground leading-relaxed transition-all duration-700 ease-out ${
                  storyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`} style={{ transitionDelay: '150ms' }}>
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
              <div className={`aspect-[4/5] bg-muted overflow-hidden transition-all duration-700 ease-out ${
                storyVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
              }`} style={{ transitionDelay: '300ms' }}>
                <img 
                  src={aboutHeritageImage} 
                  alt="WIN-CYC heritage craftsmanship" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-24 px-6 lg:px-8 bg-secondary overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div ref={valuesHeaderRef} className="text-center mb-16">
              <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${
                valuesHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>Our Values</p>
               <h2 className={`text-3xl font-bold text-foreground transition-all duration-700 ease-out ${
                valuesHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`} style={{ transitionDelay: '100ms' }}>
                核心價值
              </h2>
            </div>

            <div ref={valuesRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <div 
                  key={value.title}
                  className={`p-8 bg-background text-center transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1 ${
                    valuesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                  }`}
                  style={getValuesDelay(index)}
                >
                  <h3 className="font-serif text-xl text-foreground mb-4">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-24 px-6 lg:px-8 overflow-hidden">
          <div className="max-w-4xl mx-auto">
            <div ref={timelineHeaderRef} className="text-center mb-16">
              <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${
                timelineHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>Milestones</p>
              <h2 className={`font-serif text-3xl font-light text-foreground transition-all duration-700 ease-out ${
                timelineHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`} style={{ transitionDelay: '100ms' }}>
                發展歷程
              </h2>
            </div>

            <div ref={timelineRef} className="space-y-8">
              {milestones.map((milestone, index) => (
                <div 
                  key={index} 
                  className={`flex items-start space-x-8 group transition-all duration-500 ease-out ${
                    timelineVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                  }`}
                  style={getTimelineDelay(index)}
                >
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