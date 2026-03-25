import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import ContentSection from "../../components/about/ContentSection";
import ImageTextBlock from "../../components/about/ImageTextBlock";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";

const OurStory = () => {
  const { ref: section1Ref, isVisible: section1Visible } = useScrollAnimation();
  const { ref: section2Ref, isVisible: section2Visible } = useScrollAnimation();
  const { ref: section3Ref, isVisible: section3Visible } = useScrollAnimation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <PageBreadcrumb
            segments={[
              { label: "Home", href: "/" },
              { label: "About", href: "/about" },
              { label: "Our Story" },
            ]}
            title="Our Story"
          />
          
          <div ref={section1Ref} className={`transition-all duration-700 ${section1Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <ContentSection>
              <ImageTextBlock
                image="/founders.png"
                imageAlt="WIN-CYC Founders"
                title="The Beginning"
                content="WIN-CYC GROUP LIMITED was founded in Hong Kong in 1979. Driven by passion and expertise in the garment accessories industry, our founders started from a small factory with the mission to provide premium buttons, zippers, and accessories to fashion brands worldwide."
                imagePosition="left"
              />
            </ContentSection>
          </div>

          <div ref={section2Ref} className={`transition-all duration-700 ${section2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '150ms' }}>
            <ContentSection title="Heritage & Growth">
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-xl font-light text-foreground">Traditional Craftsmanship</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We insist on combining traditional craftsmanship with modern technology. Every product undergoes strict quality control. From raw material procurement to finished goods, each step reflects our unwavering pursuit of quality.
                  </p>
                </div>
                <div className="space-y-6">
                  <h3 className="text-xl font-light text-foreground">Sustainable Development</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We believe that business growth and environmental protection can go hand in hand. Through the adoption of eco-friendly materials and optimised production processes, we are committed to minimising our environmental impact and contributing to the sustainable fashion industry.
                  </p>
                </div>
              </div>
            </ContentSection>
          </div>

          <div ref={section3Ref} className={`transition-all duration-700 ${section3Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '300ms' }}>
            <ContentSection title="Core Values">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-foreground">Quality First</h3>
                  <p className="text-muted-foreground">
                    Adhering to international quality standards, ensuring every product passes rigorous testing and certification.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-foreground">Client Focus</h3>
                  <p className="text-muted-foreground">
                    Understanding client needs in depth, providing expert product recommendations and customisation services.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-foreground">Innovation</h3>
                  <p className="text-muted-foreground">
                    Continuously developing new styles and materials, keeping pace with fashion trends and market demands.
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
