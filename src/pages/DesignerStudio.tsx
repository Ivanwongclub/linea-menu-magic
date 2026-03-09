import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Lock, Library, Zap, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const DesignerStudio = () => {
  const features = [
    {
      icon: Library,
      titleCn: "完整輔料庫",
      titleEn: "Complete Trim Library",
      description: "瀏覽我們所有產品系列的高清圖片與詳細規格",
    },
    {
      icon: Zap,
      titleCn: "快速搜索",
      titleEn: "Quick Search",
      description: "依材質、顏色、尺寸等條件快速篩選所需輔料",
    },
    {
      icon: Users,
      titleCn: "專屬服務",
      titleEn: "Dedicated Support",
      description: "獲得專業團隊的一對一設計諮詢與技術支援",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero */}
        <section className="py-24 px-6 lg:px-8 bg-secondary">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-subtitle mb-4">Exclusive Access</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              設計師工作室
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Designer Studio
            </p>
            
            {/* Dashboard Link */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/designer-studio/dashboard">
                <Button className="gap-2">
                  <Library className="w-4 h-4" />
                  進入工作室
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-6">
                專為設計師打造
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                登入專屬工作室，探索我們完整的輔料資料庫，優化您的設計工作流程。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {features.map((feature) => (
                <div key={feature.titleEn} className="p-8 border border-border text-center">
                  <feature.icon className="w-10 h-10 text-foreground mx-auto mb-6" strokeWidth={1.5} />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.titleCn}
                  </h3>
                  <p className="text-xs text-muted-foreground tracking-wide mb-4">
                    {feature.titleEn}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Login Section */}
        <section className="py-24 px-6 lg:px-8 bg-foreground text-primary-foreground">
          <div className="max-w-md mx-auto text-center">
            <Lock className="w-12 h-12 text-primary-foreground/60 mx-auto mb-8" strokeWidth={1.5} />
            <h2 className="text-2xl font-semibold mb-4">
              會員登入
            </h2>
            <p className="text-primary-foreground/70 mb-8">
              Designer Studio 僅供註冊會員使用。
              如需開通帳戶，請聯絡我們的客戶服務團隊。
            </p>

            {/* Login Form Placeholder */}
            <div className="space-y-4 mb-8">
              <input
                type="email"
                placeholder="電郵地址 Email"
                className="w-full px-4 py-3 bg-transparent border border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/50 text-sm focus:outline-none focus:border-primary-foreground"
              />
              <input
                type="password"
                placeholder="密碼 Password"
                className="w-full px-4 py-3 bg-transparent border border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/50 text-sm focus:outline-none focus:border-primary-foreground"
              />
              <button className="w-full py-3 bg-primary-foreground text-foreground text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:bg-primary-foreground/90">
                登入 Login
              </button>
            </div>

            <p className="text-sm text-primary-foreground/50">
              還沒有帳戶？
              <Link to="/contact" className="text-primary-foreground ml-1 underline">
                聯絡我們
              </Link>
            </p>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-24 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-3xl font-light text-foreground mb-8">
              如何獲得存取權限？
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="w-12 h-12 bg-secondary flex items-center justify-center mx-auto mb-4">
                  <span className="font-serif text-xl text-foreground">1</span>
                </div>
                <h3 className="text-foreground mb-2">聯絡我們</h3>
                <p className="text-sm text-muted-foreground">
                  填寫聯絡表格或直接電郵我們的團隊
                </p>
              </div>
              <div>
                <div className="w-12 h-12 bg-secondary flex items-center justify-center mx-auto mb-4">
                  <span className="font-serif text-xl text-foreground">2</span>
                </div>
                <h3 className="text-foreground mb-2">資格審核</h3>
                <p className="text-sm text-muted-foreground">
                  我們將審核您的申請並確認合作意向
                </p>
              </div>
              <div>
                <div className="w-12 h-12 bg-secondary flex items-center justify-center mx-auto mb-4">
                  <span className="font-serif text-xl text-foreground">3</span>
                </div>
                <h3 className="text-foreground mb-2">開通帳戶</h3>
                <p className="text-sm text-muted-foreground">
                  獲得專屬帳戶，開始探索輔料庫
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default DesignerStudio;