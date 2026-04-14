import HeroSection from "@/components/home/HeroSection";
import ProductCategories from "@/components/home/ProductCategories";
import HeritageSection from "@/components/home/HeritageSection";
import MilestoneTeaser from "@/components/home/MilestoneTeaser";
import DesignerCTA from "@/components/home/DesignerCTA";
import SustainabilitySection from "@/components/home/SustainabilitySection";
import ContactSection from "@/components/home/ContactSection";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  return (
    <>
        <HeroSection />
        <ProductCategories />
        <HeritageSection />
        <MilestoneTeaser />
        <Separator className="opacity-50" />
        <SustainabilitySection />
        <DesignerCTA />
        <Separator className="opacity-50" />
        <ContactSection />
    </>
  );
};

export default Index;
