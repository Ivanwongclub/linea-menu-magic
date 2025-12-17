import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import ProductCategories from "@/components/home/ProductCategories";
import HeritageSection from "@/components/home/HeritageSection";
import DesignerCTA from "@/components/home/DesignerCTA";
import SustainabilitySection from "@/components/home/SustainabilitySection";
import ContactSection from "@/components/home/ContactSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <HeroSection />
        <ProductCategories />
        <HeritageSection />
        <SustainabilitySection />
        <DesignerCTA />
        <ContactSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;