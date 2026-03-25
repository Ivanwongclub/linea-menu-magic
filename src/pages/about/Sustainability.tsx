import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import ContentSection from "../../components/about/ContentSection";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";

const Sustainability = () => {
  const { ref: commitmentRef, isVisible: commitmentVisible } = useScrollAnimation();
  const { ref: goalsRef, isVisible: goalsVisible, getDelay: getGoalsDelay } = useStaggeredAnimation(3, 150);
  const { ref: practicesRef, isVisible: practicesVisible } = useScrollAnimation();
  const { ref: certsRef, isVisible: certsVisible, getDelay: getCertsDelay } = useStaggeredAnimation(4, 100);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <PageBreadcrumb
        segments={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Sustainability" },
        ]}
      />

      <main className="py-8 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
        
          <div ref={commitmentRef} className={`transition-all duration-700 ${commitmentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <ContentSection title="Environmental Commitment">
              <div className="grid md:grid-cols-2 gap-12 mb-16">
                <div className="space-y-6">
                  <h3 className="text-xl font-light text-foreground">Eco-friendly Materials</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We actively adopt recycled and eco-friendly raw materials, including recycled metals, organic cotton, and reclaimed plastics, reducing our environmental impact while maintaining uncompromised product quality.
                  </p>
                </div>
                <div className="space-y-6">
                  <h3 className="text-xl font-light text-foreground">Green Manufacturing</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Our production facilities use energy-efficient equipment and eco-friendly processes, continuously optimising production workflows to reduce energy consumption and waste emissions, achieving our green manufacturing goals.
                  </p>
                </div>
              </div>

              <div ref={goalsRef} className="bg-secondary p-8">
                <h3 className="text-2xl font-light text-foreground mb-6">Environmental Goals</h3>
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { value: "50%", label: "Recycled material usage target (2025)" },
                    { value: "30%", label: "Carbon emission reduction (2030 target)" },
                    { value: "Zero", label: "Production waste to landfill policy" },
                  ].map((goal, index) => (
                    <div 
                      key={index}
                      className={`transition-all duration-500 ${goalsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                      style={getGoalsDelay(index)}
                    >
                      <div className="text-3xl font-bold text-foreground mb-2">{goal.value}</div>
                      <p className="text-sm text-muted-foreground">{goal.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ContentSection>
          </div>

          <div ref={practicesRef} className={`transition-all duration-700 ${practicesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <ContentSection title="Sustainable Practices">
              <div className="space-y-8">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We embed sustainability into every aspect of our business, from raw material sourcing to product delivery, ensuring environmental compliance throughout the entire supply chain.
                </p>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-light text-foreground">Supply Chain Management</h3>
                    <p className="text-muted-foreground">
                      Rigorous supplier vetting ensures raw material sources are legitimate and meet environmental standards, building a transparent and traceable supply chain.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-light text-foreground">Employee Wellbeing</h3>
                    <p className="text-muted-foreground">
                      Providing a safe and healthy working environment, complying with labour regulations, safeguarding employee rights, and promoting sustainable business development.
                    </p>
                  </div>
                </div>
              </div>
            </ContentSection>
          </div>

          <ContentSection title="Certifications & Standards">
            <div className="space-y-8">
              <p className="text-muted-foreground leading-relaxed">
                We hold multiple international certifications, demonstrating our commitment and achievement in sustainable development.
              </p>
              
              <div ref={certsRef} className="grid md:grid-cols-4 gap-8 items-center">
                {[
                  { name: "GRS", desc: "Global Recycled Standard" },
                  { name: "OEKO-TEX", desc: "Eco Textile Certification" },
                  { name: "ISO 14001", desc: "Environmental Management" },
                  { name: "BSCI", desc: "Social Compliance" },
                ].map((cert, index) => (
                  <div 
                    key={cert.name}
                    className={`h-24 bg-secondary flex flex-col items-center justify-center transition-all duration-500 ${
                      certsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={getCertsDelay(index)}
                  >
                    <span className="text-lg font-light text-foreground">{cert.name}</span>
                    <span className="text-xs text-muted-foreground mt-1">{cert.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </ContentSection>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Sustainability;
