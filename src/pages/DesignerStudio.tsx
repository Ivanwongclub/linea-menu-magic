import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Lock, Layers, Zap, Share2, LayoutGrid, Eye, GitBranch } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const DesignerStudio = () => {
  const capabilities = [
    {
      icon: LayoutGrid,
      titleCn: "概念板構建",
      titleEn: "Concept Board Builder",
      description: "從模板或空白畫布開始，快速構建高品質概念板與成衣模擬展示。",
    },
    {
      icon: Layers,
      titleCn: "精準排版工具",
      titleEn: "Precision Layout Tools",
      description: "智能對齊、分組管理與標注系統，讓每一塊板面都達到提案級品質。",
    },
    {
      icon: GitBranch,
      titleCn: "方案變體對比",
      titleEn: "Variant Exploration",
      description: "一鍵衍生設計變體，平行探索多個創意方向，高效比對與迭代。",
    },
    {
      icon: Eye,
      titleCn: "客戶級展示分享",
      titleEn: "Client-Ready Presentations",
      description: "生成私密分享連結，將概念板以專業只讀模式呈現給品牌客戶。",
    },
    {
      icon: Zap,
      titleCn: "輔料組件庫",
      titleEn: "Component Library",
      description: "直接從專屬組件庫中調用產品素材，無需離開工作室即可完成構圖。",
    },
    {
      icon: Share2,
      titleCn: "一鍵匯出",
      titleEn: "One-Click Export",
      description: "將完成的概念板匯出為高解析度圖檔，隨時準備用於內部評審或客戶提案。",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero */}
        <section className="py-32 px-6 lg:px-8 bg-secondary">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-subtitle mb-6 tracking-[0.25em] uppercase">Enterprise Design Workspace</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Designer Studio
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-4 max-w-2xl mx-auto">
              為全球品牌設計團隊打造的輔料概念板工作室
            </p>
            <p className="text-sm text-muted-foreground/70 mb-10 max-w-xl mx-auto">
              從構思到提案，在一個專業工作空間內完成概念板構建、方案比對與客戶展示。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/designer-studio/dashboard">
                <Button size="lg" className="gap-2 tracking-wide">
                  <LayoutGrid className="w-4 h-4" />
                  開啟工作室
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="tracking-wide">
                  預約演示
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="py-24 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-subtitle mb-4 tracking-[0.2em] uppercase">Capabilities</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                提案級工具 · 品牌級標準
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                每一項功能都圍繞真實的品牌設計工作流程設計，幫助團隊更快交付更強的概念方案。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
              {capabilities.map((cap) => (
                <div key={cap.titleEn} className="p-10 bg-background">
                  <cap.icon className="w-8 h-8 text-foreground mb-6" strokeWidth={1.5} />
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {cap.titleCn}
                  </h3>
                  <p className="text-xs text-muted-foreground/60 tracking-wide uppercase mb-4">
                    {cap.titleEn}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Login Section */}
        <section className="py-24 px-6 lg:px-8 bg-foreground text-primary-foreground">
          <div className="max-w-md mx-auto text-center">
            <Lock className="w-10 h-10 text-primary-foreground/50 mx-auto mb-8" strokeWidth={1.5} />
            <h2 className="text-2xl font-semibold mb-4">
              會員登入
            </h2>
            <p className="text-primary-foreground/60 mb-8 text-sm leading-relaxed">
              Designer Studio 僅限受邀品牌設計團隊使用。<br />
              如需開通工作室帳戶，請聯絡我們的客戶團隊。
            </p>

            <div className="space-y-4 mb-8">
              <input
                type="email"
                placeholder="電郵地址 Email"
                className="w-full px-4 py-3 bg-transparent border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 text-sm focus:outline-none focus:border-primary-foreground/60 transition-colors"
              />
              <input
                type="password"
                placeholder="密碼 Password"
                className="w-full px-4 py-3 bg-transparent border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 text-sm focus:outline-none focus:border-primary-foreground/60 transition-colors"
              />
              <button className="w-full py-3 bg-primary-foreground text-foreground text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:bg-primary-foreground/90">
                登入 Login
              </button>
            </div>

            <p className="text-sm text-primary-foreground/40">
              尚未開通？
              <Link to="/contact" className="text-primary-foreground/70 ml-1 underline hover:text-primary-foreground transition-colors">
                聯絡我們
              </Link>
            </p>
          </div>
        </section>

        {/* Access Steps */}
        <section className="py-24 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              如何開通工作室
            </h2>
            <p className="text-muted-foreground mb-12">三個步驟，開始您的專屬設計工作流。</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: "1", title: "聯絡客戶團隊", desc: "填寫表格或直接聯絡我們，說明您的品牌與設計需求" },
                { step: "2", title: "資格確認", desc: "我們將評估合作契合度並確認帳戶開通" },
                { step: "3", title: "進入工作室", desc: "獲得專屬帳戶，立即開始構建概念板" },
              ].map((item) => (
                <div key={item.step}>
                  <div className="w-12 h-12 bg-secondary flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-foreground">{item.step}</span>
                  </div>
                  <h3 className="text-foreground font-medium mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
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

export default DesignerStudio;