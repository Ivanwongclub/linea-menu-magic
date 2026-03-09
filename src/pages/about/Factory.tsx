import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import ContentSection from "../../components/about/ContentSection";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import { Settings, Cpu, Users, Shield, Leaf, Zap } from "lucide-react";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";

const Factory = () => {
  const { ref: statsRef, isVisible: statsVisible, getDelay: getStatsDelay } = useStaggeredAnimation(4, 100);
  const { ref: facilitiesRef, isVisible: facilitiesVisible, getDelay: getFacilitiesDelay } = useStaggeredAnimation(3, 150);
  const { ref: processRef, isVisible: processVisible, getDelay: getProcessDelay } = useStaggeredAnimation(6, 100);
  const { ref: equipmentRef, isVisible: equipmentVisible } = useScrollAnimation();

  const stats = [
    { value: "45+", label: "年生產經驗", sublabel: "Years of Experience" },
    { value: "50,000", label: "平方米廠房", sublabel: "sqm Facility" },
    { value: "800+", label: "專業員工", sublabel: "Skilled Workers" },
    { value: "24/7", label: "生產能力", sublabel: "Production Capacity" },
  ];

  const facilities = [
    {
      image: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&auto=format&fit=crop",
      title: "東莞生產基地",
      subtitle: "Dongguan Manufacturing Hub",
      description: "佔地35,000平方米的現代化生產設施，配備先進自動化生產線及嚴格品質控制系統。",
    },
    {
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop",
      title: "深圳研發中心",
      subtitle: "Shenzhen R&D Center",
      description: "專注產品創新及新材料研發，擁有先進測試實驗室及經驗豐富的技術團隊。",
    },
    {
      image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&auto=format&fit=crop",
      title: "香港總部",
      subtitle: "Hong Kong Headquarters",
      description: "負責全球業務營運、客戶服務及品牌策略，連接國際市場與生產基地。",
    },
  ];

  const processes = [
    { icon: Settings, title: "模具製造", desc: "精密CNC加工及3D打印技術" },
    { icon: Cpu, title: "自動化生產", desc: "智能化生產線確保效率與品質" },
    { icon: Shield, title: "品質檢測", desc: "多重品質把關確保零缺陷" },
    { icon: Leaf, title: "環保處理", desc: "符合國際環保標準的表面處理" },
    { icon: Users, title: "技術團隊", desc: "資深技師及工程師團隊" },
    { icon: Zap, title: "快速交付", desc: "高效物流系統縮短交期" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="w-full">
        <PageBreadcrumb
          segments={[
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: "Factory" },
          ]}
          title="生產設施"
        />

        {/* Stats Section */}
        <section className="py-16 px-6 border-b border-border overflow-hidden">
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className={`text-center transition-all duration-700 ease-out ${
                  statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={getStatsDelay(index)}
              >
                <div className="text-3xl md:text-4xl font-light text-foreground mb-2">{stat.value}</div>
                <div className="text-sm text-foreground font-medium">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Facilities Section */}
        <ContentSection title="生產基地" className="px-6">
          <div ref={facilitiesRef} className="grid md:grid-cols-3 gap-6">
            {facilities.map((facility, index) => (
              <div 
                key={index}
                className={`group transition-all duration-700 ease-out ${
                  facilitiesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
                style={getFacilitiesDelay(index)}
              >
                <div className="aspect-[4/3] overflow-hidden mb-4">
                  <img 
                    src={facility.image}
                    alt={facility.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h3 className="text-lg font-light text-foreground mb-1">{facility.title}</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{facility.subtitle}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{facility.description}</p>
              </div>
            ))}
          </div>
        </ContentSection>

        {/* Production Process */}
        <section className="py-16 px-6 bg-secondary overflow-hidden">
          <div className="mb-8">
            <h2 className="text-2xl font-light text-foreground mb-2">生產工藝</h2>
            <p className="text-sm text-muted-foreground">先進設備與傳統工藝的完美結合</p>
          </div>
          <div ref={processRef} className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {processes.map((process, index) => (
              <div 
                key={index}
                className={`p-6 bg-background border border-border hover:border-foreground/20 transition-all duration-500 ${
                  processVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
                style={getProcessDelay(index)}
              >
                <process.icon className="w-6 h-6 text-foreground/70 mb-4" strokeWidth={1.5} />
                <h3 className="text-base font-light text-foreground mb-2">{process.title}</h3>
                <p className="text-sm text-muted-foreground">{process.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Equipment Section */}
        <section ref={equipmentRef} className="py-16 px-6 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-700 ease-out ${
              equipmentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}>
              <h2 className="text-2xl font-light text-foreground mb-4">先進生產設備</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                我們持續投資先進生產設備，包括日本及歐洲進口的精密模具加工機器、自動化電鍍生產線、以及最新的品質檢測儀器。這些設備確保每件產品都能達到國際一流水準。
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-foreground/40" />日本FANUC CNC加工中心</li>
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-foreground/40" />德國TRUMPF激光切割機</li>
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-foreground/40" />瑞士Stratasys 3D打印系統</li>
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-foreground/40" />自動化環保電鍍生產線</li>
              </ul>
            </div>
            <div className={`aspect-[4/3] overflow-hidden transition-all duration-700 ease-out ${
              equipmentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
            }`} style={{ transitionDelay: '200ms' }}>
              <img 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop"
                alt="Advanced manufacturing equipment"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Quality Commitment */}
        <section className="py-16 px-6 bg-secondary border-t border-border overflow-hidden">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-light text-foreground mb-4">品質承諾</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              WIN-CYC始終堅持「品質至上」的經營理念。從原材料採購、生產製造到成品檢驗，每個環節都嚴格遵循ISO 9001品質管理體系標準。我們的品質控制團隊對每批產品進行多重檢測，確保交付給客戶的每件產品都達到最高品質標準。
            </p>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-light text-foreground">99.8%</div>
                <div className="text-xs text-muted-foreground">產品合格率</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-2xl font-light text-foreground">&lt;0.1%</div>
                <div className="text-xs text-muted-foreground">客戶投訴率</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-2xl font-light text-foreground">100%</div>
                <div className="text-xs text-muted-foreground">交期達成率</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Factory;
