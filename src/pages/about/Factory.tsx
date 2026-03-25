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
    { value: "45+", label: "Years of Experience" },
    { value: "50,000", label: "sqm Facility" },
    { value: "800+", label: "Skilled Workers" },
    { value: "24/7", label: "Production Capacity" },
  ];

  const facilities = [
    {
      image: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&auto=format&fit=crop",
      title: "Dongguan Manufacturing Hub",
      subtitle: "Main Production Base",
      description: "A modern 35,000 sqm production facility equipped with advanced automated production lines and a rigorous quality control system.",
    },
    {
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop",
      title: "Shenzhen R&D Center",
      subtitle: "Research & Development",
      description: "Focused on product innovation and new material development, featuring advanced testing laboratories and an experienced technical team.",
    },
    {
      image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&auto=format&fit=crop",
      title: "Hong Kong Headquarters",
      subtitle: "Global Operations",
      description: "Responsible for global business operations, client services, and brand strategy, connecting international markets with production bases.",
    },
  ];

  const processes = [
    { icon: Settings, title: "Mould Making", desc: "Precision CNC machining and 3D printing technology" },
    { icon: Cpu, title: "Automated Production", desc: "Smart production lines ensuring efficiency and quality" },
    { icon: Shield, title: "Quality Inspection", desc: "Multi-stage quality control for zero-defect products" },
    { icon: Leaf, title: "Eco-friendly Finishing", desc: "Surface treatment meeting international environmental standards" },
    { icon: Users, title: "Technical Team", desc: "Experienced technicians and engineering professionals" },
    { icon: Zap, title: "Fast Delivery", desc: "Efficient logistics systems for shorter lead times" },
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
          title="Production Facilities"
        />

        {/* Stats Section */}
        <section className="py-16 px-6 lg:px-8 border-b border-border overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className={`transition-all duration-700 ease-out ${
                    statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={getStatsDelay(index)}
                >
                  <div className="text-3xl md:text-4xl font-light text-foreground mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Facilities Section */}
        <ContentSection title="Production Bases" className="px-6 lg:px-8 max-w-7xl mx-auto">
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
        <section className="py-16 px-6 lg:px-8 bg-secondary overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-light text-foreground mb-2">Production Process</h2>
              <p className="text-sm text-muted-foreground">The perfect blend of advanced equipment and traditional craftsmanship</p>
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
          </div>
        </section>

        {/* Equipment Section */}
        <section ref={equipmentRef} className="py-16 px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-700 ease-out ${
              equipmentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}>
              <h2 className="text-2xl font-light text-foreground mb-4">Advanced Equipment</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                We continuously invest in advanced production equipment, including precision mould machining from Japan and Europe, automated plating lines, and state-of-the-art quality inspection instruments. These ensure every product meets world-class standards.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-foreground/40" />FANUC CNC Machining Centers (Japan)</li>
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-foreground/40" />TRUMPF Laser Cutting Systems (Germany)</li>
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-foreground/40" />Stratasys 3D Printing Systems (Switzerland)</li>
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-foreground/40" />Automated Eco-friendly Plating Lines</li>
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
            <h2 className="text-2xl font-light text-foreground mb-4">Quality Commitment</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              WIN-CYC has always upheld a "Quality First" business philosophy. From raw material procurement and manufacturing to final inspection, every stage strictly follows ISO 9001 quality management standards. Our quality control team performs multiple inspections on every batch to ensure the highest quality standards.
            </p>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-light text-foreground">99.8%</div>
                <div className="text-xs text-muted-foreground">Product Pass Rate</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-2xl font-light text-foreground">&lt;0.1%</div>
                <div className="text-xs text-muted-foreground">Client Complaint Rate</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-2xl font-light text-foreground">100%</div>
                <div className="text-xs text-muted-foreground">On-time Delivery Rate</div>
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
