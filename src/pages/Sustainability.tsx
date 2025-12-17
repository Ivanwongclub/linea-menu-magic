import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Leaf, Recycle, Award, Factory } from "lucide-react";

const Sustainability = () => {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero */}
        <section className="py-24 px-6 lg:px-8 bg-secondary">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-subtitle mb-4">Sustainability</p>
            <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-6">
              可持續發展
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              永續願景，綠色未來
            </p>
          </div>
        </section>

        {/* Vision */}
        <section className="py-24 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-3xl font-light text-foreground mb-8">
              我們的承諾
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              作為服裝輔料行業的領導者，我們深知企業對環境的責任。
              透過創新技術與永續實踐，我們致力於在保持產品品質的同時，
              將環境影響降至最低。
            </p>
          </div>
        </section>

        {/* Initiatives */}
        <section className="py-24 px-6 lg:px-8 bg-secondary">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-subtitle mb-4">Initiatives</p>
              <h2 className="font-serif text-3xl font-light text-foreground">
                環保行動
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {initiatives.map((initiative) => (
                <div key={initiative.titleEn} className="p-8 bg-background">
                  <initiative.icon className="w-8 h-8 text-foreground mb-6" strokeWidth={1.5} />
                  <h3 className="font-serif text-xl text-foreground mb-2">
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

        {/* Certifications */}
        <section className="py-24 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-subtitle mb-4">Certifications</p>
              <h2 className="font-serif text-3xl font-light text-foreground">
                國際認證
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certifications.map((cert) => (
                <div key={cert.name} className="p-8 border border-border flex items-start space-x-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-secondary flex items-center justify-center">
                    <span className="font-serif text-lg text-foreground">{cert.name}</span>
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
        <section className="py-24 px-6 lg:px-8 bg-foreground text-primary-foreground">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-xs tracking-[0.2em] uppercase text-primary-foreground/60 mb-4">
                  Featured Technology
                </p>
                <h2 className="font-serif text-3xl font-light mb-6">
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
              <div className="aspect-square bg-primary-foreground/10" />
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Sustainability;