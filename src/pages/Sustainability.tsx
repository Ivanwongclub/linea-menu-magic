import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Leaf, Recycle, Award, Factory, TreePine, Wind, Droplets, Sun } from "lucide-react";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import { Button } from "@/components/ui/button";
import LetterReveal from "@/components/ui/LetterReveal";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";

const Sustainability = () => {
  const { ref: visionRef, isVisible: visionVisible } = useScrollAnimation();
  const { ref: initHeaderRef, isVisible: initHeaderVisible } = useScrollAnimation();
  const { ref: initRef, isVisible: initVisible, getDelay: getInitDelay } = useStaggeredAnimation(4, 150);
  const { ref: greenRef, isVisible: greenVisible } = useScrollAnimation();
  const { ref: certHeaderRef, isVisible: certHeaderVisible } = useScrollAnimation();
  const { ref: certRef, isVisible: certVisible, getDelay: getCertDelay } = useStaggeredAnimation(4, 150);
  const { ref: ecoRef, isVisible: ecoVisible } = useScrollAnimation();

  const initiatives = [
    {
      icon: Recycle,
      title: "Recycled Materials",
      description: "Using GRS-certified recycled polyester and metals to reduce raw material consumption.",
    },
    {
      icon: Factory,
      title: "Eco-friendly Process",
      description: "Adopting eco-friendly plating technology to reduce harmful chemical emissions.",
    },
    {
      icon: Leaf,
      title: "Carbon Footprint",
      description: "Continuously monitoring and reducing carbon emissions across production processes.",
    },
    {
      icon: Award,
      title: "Certifications",
      description: "Holding GRS, RCS, OEKO-TEX and other international environmental certifications.",
    },
  ];

  const certifications = [
    {
      name: "GRS",
      fullName: "Global Recycled Standard",
      description: "Certification ensuring traceability of recycled materials throughout the supply chain.",
    },
    {
      name: "RCS",
      fullName: "Recycled Claim Standard",
      description: "Verifies recycled content composition in products.",
    },
    {
      name: "OEKO-TEX",
      fullName: "Standard 100",
      description: "Safety certification ensuring products are harmless to human health.",
    },
    {
      name: "ISO 9001",
      fullName: "Quality Management",
      description: "International quality management system certification.",
    },
  ];

  const greenVisionItems = [
    { icon: TreePine, title: "Green Supply Chain", desc: "Building a traceable eco-friendly supplier network" },
    { icon: Wind, title: "Clean Energy", desc: "Transitioning to renewable energy sources" },
    { icon: Droplets, title: "Water Conservation", desc: "Implementing closed-loop water treatment systems" },
    { icon: Sun, title: "Carbon Neutral", desc: "Committed to carbon neutrality by 2030" },
  ];

  const greenLifeImages = [
    {
      src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
      alt: "Clean forest environment",
    },
    {
      src: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop",
      alt: "Sustainable living",
    },
    {
      src: "https://images.unsplash.com/photo-1518173946687-a4c036bc4add?w=400&h=300&fit=crop",
      alt: "Clean energy future",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <PageBreadcrumb
          segments={[
            { label: "Home", href: "/" },
            { label: "Sustainability" },
          ]}
          title="Sustainability"
        />

        {/* Vision */}
        <section ref={visionRef} className="py-24 px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl">
              <div className="flex items-start gap-4 mb-8">
                <span className={`w-1 bg-foreground self-stretch min-h-[3rem] transition-all duration-700 ${visionVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '200ms' }} />
                <div className="text-5xl md:text-6xl lg:text-7xl text-foreground leading-[0.9]">
                  <LetterReveal text="Our" as="span" className="font-light block" isVisible={visionVisible} startDelay={100} letterDelay={60} />
                  <LetterReveal text="Promise" as="span" className="font-bold block" isVisible={visionVisible} startDelay={350} letterDelay={80} />
                </div>
              </div>
              <p className={`text-muted-foreground leading-relaxed text-lg transition-all duration-700 ease-out ${
                visionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`} style={{ transitionDelay: '600ms' }}>
                As a leader in the garment accessories industry, we understand our responsibility to the environment. Through innovative technology and sustainable practices, we are committed to minimising our environmental footprint while maintaining the highest product quality.
              </p>
            </div>
          </div>
        </section>

        {/* Initiatives */}
        <section className="py-24 px-6 lg:px-8 bg-secondary overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div ref={initHeaderRef} className="text-center mb-16">
              <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${
                initHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>Initiatives</p>
              <LetterReveal
                text="Green Action"
                as="h2"
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground"
                isVisible={initHeaderVisible}
                startDelay={100}
                letterDelay={80}
              />
            </div>

            <div ref={initRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {initiatives.map((initiative, index) => (
                <div 
                  key={initiative.title} 
                  className={`p-8 bg-background rounded-lg transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1 ${
                    initVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                  }`}
                  style={getInitDelay(index)}
                >
                  <initiative.icon className="w-8 h-8 text-foreground mb-6" strokeWidth={1.5} />
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    {initiative.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {initiative.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Green Footprint Banner */}
        <section ref={greenRef} className="py-20 px-6 lg:px-8 bg-secondary overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className={`lg:col-span-5 transition-all duration-700 ease-out ${
                greenVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <Leaf className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                  <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Green Initiative</span>
                </div>
                <LetterReveal
                  text="Green Vision"
                  as="h2"
                  className="text-4xl md:text-5xl font-bold text-foreground mb-4"
                  isVisible={greenVisible}
                  startDelay={100}
                  letterDelay={70}
                />
                <p className="text-muted-foreground leading-relaxed mb-6">
                  We believe that every small change can make a profound impact on our planet. From material selection to production processes, we continuously explore more environmentally responsible methods to create a better future for the next generation.
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {greenVisionItems.map((item) => (
                    <div key={item.title} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                      <item.icon className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-8 mb-6">
                  <div>
                    <p className="text-2xl font-bold text-foreground">30%</p>
                    <p className="text-xs text-muted-foreground">Recycled materials used</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">100%</p>
                    <p className="text-xs text-muted-foreground">Environmental compliance</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">50+</p>
                    <p className="text-xs text-muted-foreground">Eco product lines</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline">
                    View Certifications
                  </Button>
                  <Button variant="ghost">
                    Sustainability Report
                  </Button>
                </div>
              </div>
              
              <div className={`lg:col-span-7 transition-all duration-700 ease-out ${
                greenVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
              }`} style={{ transitionDelay: '200ms' }}>
                <div className="grid grid-cols-3 gap-3">
                  {greenLifeImages.map((image, index) => (
                    <div key={index} className="aspect-[4/3] overflow-hidden rounded-lg">
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-24 px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div ref={certHeaderRef} className="text-center mb-16">
              <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${
                certHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>Certifications</p>
              <LetterReveal
                text="International Standards"
                as="h2"
                className="text-5xl md:text-6xl lg:text-7xl font-light text-foreground italic"
                isVisible={certHeaderVisible}
                startDelay={100}
                letterDelay={80}
              />
            </div>

            <div ref={certRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certifications.map((cert, index) => (
                <div 
                  key={cert.name} 
                  className={`p-8 border border-border rounded-lg flex items-start space-x-6 transition-all duration-500 ease-out hover:border-foreground/20 ${
                    certVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                  }`}
                  style={getCertDelay(index)}
                >
                  <div className="flex-shrink-0 w-16 h-16 bg-secondary flex items-center justify-center rounded-lg">
                    <span className="text-lg font-semibold text-foreground">{cert.name}</span>
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
        <section ref={ecoRef} className="py-24 px-6 lg:px-8 bg-foreground text-primary-foreground overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className={`transition-all duration-700 ease-out ${
                ecoVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
              }`}>
                <p className="text-xs tracking-[0.2em] uppercase text-primary-foreground/60 mb-4">
                  Featured Technology
                </p>
                <LetterReveal
                  text="Eco-Plating"
                  as="h2"
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 uppercase tracking-[0.05em]"
                  isVisible={ecoVisible}
                  startDelay={100}
                  letterDelay={60}
                />
                <h3 className={`text-xl text-primary-foreground/80 mb-6 transition-all duration-700 ease-out ${ecoVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '500ms' }}>
                  Eco-Friendly Electroless Plating
                </h3>
                <div className={`space-y-4 text-primary-foreground/70 transition-all duration-700 ease-out ${ecoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '600ms' }}>
                  <p>
                    We have introduced advanced eco-friendly plating technology. Compared to traditional plating methods:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-primary-foreground/50 rounded-full mr-3" />
                      No electricity required, reducing energy consumption
                    </li>
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-primary-foreground/50 rounded-full mr-3" />
                      Reduced use of harmful substances
                    </li>
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-primary-foreground/50 rounded-full mr-3" />
                      More uniform coating finish
                    </li>
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-primary-foreground/50 rounded-full mr-3" />
                      Meets international environmental standards
                    </li>
                  </ul>
                </div>
              </div>
              <div className={`aspect-square bg-primary-foreground/10 rounded-lg transition-all duration-700 ease-out ${
                ecoVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
              }`} style={{ transitionDelay: '200ms' }} />
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Sustainability;
