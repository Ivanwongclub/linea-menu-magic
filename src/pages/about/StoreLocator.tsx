import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import { Button } from "../../components/ui/button";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import { MapPin, Phone, Clock, Mail } from "lucide-react";

const StoreLocator = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: locationsRef, isVisible: locationsVisible, getDelay } = useStaggeredAnimation(3, 150);
  const { ref: contactRef, isVisible: contactVisible } = useScrollAnimation();

  const offices = [
    {
      name: "香港總部",
      nameEn: "Hong Kong Headquarters",
      address: "香港九龍觀塘偉業街123號企業中心18樓",
      addressEn: "18/F, Enterprise Centre, 123 Wai Yip Street, Kwun Tong, Kowloon, Hong Kong",
      phone: "+852 2345 6789",
      email: "info@wincyc.com",
      hours: "週一至週五: 9:00-18:00",
    },
    {
      name: "深圳辦事處",
      nameEn: "Shenzhen Office",
      address: "深圳市福田區華強北路1000號科技大廈12樓",
      addressEn: "12/F, Tech Tower, 1000 Huaqiang North Road, Futian District, Shenzhen",
      phone: "+86 755 8888 9999",
      email: "shenzhen@wincyc.com",
      hours: "週一至週五: 9:00-18:00",
    },
    {
      name: "東莞生產基地",
      nameEn: "Dongguan Factory",
      address: "東莞市虎門鎮工業區南路88號",
      addressEn: "88 South Industrial Road, Humen Town, Dongguan",
      phone: "+86 769 8765 4321",
      email: "factory@wincyc.com",
      hours: "週一至週六: 8:00-17:30",
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div ref={headerRef} className={`transition-all duration-700 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <PageHeader 
              title="聯絡據點" 
              subtitle="歡迎蒞臨參觀，了解更多產品與服務"
            />
          </div>

          <div ref={locationsRef}>
            <ContentSection title="辦事處及工廠">
              <div className="grid gap-8">
                {offices.map((office, index) => (
                  <div 
                    key={index} 
                    className={`bg-background border border-border p-8 transition-all duration-500 hover:shadow-lg ${
                      locationsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                    }`}
                    style={getDelay(index)}
                  >
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-light text-foreground">{office.name}</h3>
                          <p className="text-sm text-muted-foreground">{office.nameEn}</p>
                        </div>
                        <div className="space-y-3 text-muted-foreground">
                          <div className="flex items-start gap-3">
                            <MapPin size={18} className="mt-1 flex-shrink-0" />
                            <div>
                              <p>{office.address}</p>
                              <p className="text-sm">{office.addressEn}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone size={18} className="flex-shrink-0" />
                            <p>{office.phone}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Mail size={18} className="flex-shrink-0" />
                            <p>{office.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock size={18} className="flex-shrink-0" />
                            <p>{office.hours}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center md:justify-end">
                        <Button variant="outline" className="rounded-none">
                          查看地圖
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ContentSection>
          </div>

          <div ref={contactRef} className={`transition-all duration-700 ${contactVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <ContentSection title="預約參觀">
              <div className="bg-secondary p-8">
                <h3 className="text-xl font-light text-foreground mb-4">歡迎預約參觀工廠</h3>
                <p className="text-muted-foreground mb-6">
                  如您希望深入了解我們的生產設施與品質管理流程，歡迎預約參觀我們的東莞生產基地。
                  我們的專業團隊將為您提供詳細的介紹與產品展示。
                </p>
                <Button className="rounded-none bg-brand-red-accent hover:bg-foreground text-white">
                  預約參觀
                </Button>
              </div>
            </ContentSection>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default StoreLocator;