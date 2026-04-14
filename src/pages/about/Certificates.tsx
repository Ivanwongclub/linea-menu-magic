import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import { CheckCircle } from "lucide-react";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import certIso9001 from "@/assets/certs/iso-9001.png";
import certIso14001 from "@/assets/certs/iso-14001.png";
import certOekoTex from "@/assets/certs/oeko-tex.png";
import certGrs from "@/assets/certs/grs.png";
import certBsci from "@/assets/certs/bsci.png";
import certReach from "@/assets/certs/reach.png";
import certSmeta from "@/assets/certs/smeta.png";
import certHigg from "@/assets/certs/higg-index.png";

const Certificates = () => {
  const { ref: certsRef, isVisible: certsVisible, getDelay: getCertsDelay } = useStaggeredAnimation(8, 100);
  const { ref: standardsRef, isVisible: standardsVisible, getDelay: getStandardsDelay } = useStaggeredAnimation(4, 150);
  const { ref: commitmentRef, isVisible: commitmentVisible } = useScrollAnimation();

  const certificates = [
    {
      logo: certIso9001,
      name: "ISO 9001:2015",
      category: "Quality Management System",
      description: "Internationally recognised quality management system ensuring products and services consistently meet customer requirements.",
      scope: "Buttons, zippers, and metal accessories production",
    },
    {
      logo: certOekoTex,
      name: "OEKO-TEX® Standard 100",
      category: "Eco-safety Certification",
      description: "Certifies that products are harmless to human health, free from harmful substances, and suitable for infants and sensitive skin.",
      scope: "Full range of garment accessories",
    },
    {
      logo: certGrs,
      name: "GRS (Global Recycled Standard)",
      category: "Global Recycled Standard",
      description: "International standard verifying recycled content in products, ensuring traceability and environmental compliance.",
      scope: "Recycled material product lines",
    },
    {
      logo: certIso14001,
      name: "ISO 14001:2015",
      category: "Environmental Management System",
      description: "Demonstrates corporate commitment to environmental protection, including resource conservation and pollution prevention.",
      scope: "Production facilities and operations",
    },
    {
      logo: certBsci,
      name: "BSCI (Business Social Compliance Initiative)",
      category: "Social Responsibility Certification",
      description: "Ensures supply chain compliance with international labour standards and social responsibility requirements.",
      scope: "All production bases",
    },
    {
      logo: certReach,
      name: "REACH Compliance",
      category: "EU Chemical Regulation",
      description: "Product compliance certification meeting EU regulations on registration, evaluation, authorisation and restriction of chemicals.",
      scope: "Products exported to EU markets",
    },
    {
      logo: certSmeta,
      name: "SMETA (Sedex Members Ethical Trade Audit)",
      category: "Ethical Trade Audit",
      description: "A comprehensive social audit methodology covering labour standards, health & safety, environment, and business ethics across our supply chain.",
      scope: "All manufacturing facilities",
    },
    {
      logo: certHigg,
      name: "Higg Index",
      category: "Sustainability Assessment",
      description: "Industry-standard suite of tools measuring environmental, social and labour impacts across the value chain for continuous improvement.",
      scope: "Production operations and supply chain",
    },
  ];

  const standards = [
    {
      title: "Product Safety Standards",
      items: ["Nickel-free release testing", "Lead-free content certification", "Colour fastness testing", "Tensile strength testing"],
    },
    {
      title: "Environmental Compliance",
      items: ["AZO-free dyes", "Formaldehyde-free certification", "RoHS compliant", "Low VOC emissions"],
    },
    {
      title: "Quality Control Standards",
      items: ["AQL 1.5 sampling standard", "100% pre-shipment inspection", "Full traceability system", "Regular third-party audits"],
    },
    {
      title: "Social Responsibility",
      items: ["Fair labour practices", "Safe working environment", "No child labour", "Anti-discrimination policy"],
    },
  ];

  return (
    <>
        <PageBreadcrumb
          segments={[
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: "Certificates" },
          ]}
        />

        {/* Certificates Grid */}
        <section className="py-16 px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10">
              <h2 className="text-2xl font-light text-foreground mb-2">International Certifications</h2>
              <p className="text-sm text-muted-foreground">Our key international certifications and compliance credentials</p>
            </div>
          <div ref={certsRef} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certificates.map((cert, index) => (
              <div 
                key={index}
                className={`p-6 bg-background border border-border hover:border-foreground/20 transition-all duration-500 group ${
                  certsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
                style={getCertsDelay(index)}
              >
                <div className="flex items-center justify-center h-20 mb-5">
                  <img src={cert.logo} alt={cert.name} className="h-16 w-auto object-contain" />
                </div>
                <h3 className="text-lg font-light text-foreground mb-1">{cert.name}</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{cert.category}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{cert.description}</p>
                <div className="pt-4 border-t border-border">
                  <span className="text-xs text-muted-foreground">Scope: {cert.scope}</span>
                </div>
              </div>
            ))}
          </div>
          </div>
        </section>

        {/* Standards Section */}
        <section className="py-16 px-6 lg:px-8 bg-secondary overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10">
              <h2 className="text-2xl font-light text-foreground mb-2">Compliance Standards</h2>
              <p className="text-sm text-muted-foreground">Quality and compliance standards we strictly follow</p>
            </div>
          <div ref={standardsRef} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {standards.map((standard, index) => (
              <div 
                key={index}
                className={`p-6 bg-background border border-border transition-all duration-500 ${
                  standardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
                style={getStandardsDelay(index)}
              >
                <h3 className="text-base font-light text-foreground mb-4 pb-4 border-b border-border">{standard.title}</h3>
                <ul className="space-y-3">
                  {standard.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-foreground/40 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          </div>
        </section>

        {/* Testing & Verification */}
        <section ref={commitmentRef} className="py-16 px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-700 ease-out ${
              commitmentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}>
              <h2 className="text-2xl font-light text-foreground mb-4">Third-party Testing & Verification</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                We partner with multiple internationally renowned testing institutions for regular independent third-party testing and verification. These tests cover physical performance, chemical safety, and environmental compliance, ensuring products meet regulatory requirements across global markets.
              </p>
              <div className="space-y-4">
                {[
                  { abbr: "SGS", name: "SGS Testing Services", desc: "Global leader in testing and certification" },
                  { abbr: "BV", name: "Bureau Veritas", desc: "International inspection and certification group" },
                  { abbr: "ITS", name: "Intertek", desc: "Quality and safety solutions provider" },
                ].map((org) => (
                  <div key={org.abbr} className="flex items-center gap-4 p-4 bg-secondary">
                    <div className="w-12 h-12 flex items-center justify-center bg-background">
                      <span className="text-xs font-medium text-foreground">{org.abbr}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{org.name}</div>
                      <div className="text-xs text-muted-foreground">{org.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={`aspect-square overflow-hidden transition-all duration-700 ease-out ${
              commitmentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
            }`} style={{ transitionDelay: '200ms' }}>
              <img 
                src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop"
                alt="Quality testing laboratory"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Commitment Banner */}
        <section className="py-16 px-6 lg:px-8 bg-secondary border-t border-border overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-light text-foreground mb-4">Our Commitment</h2>
              <p className="text-muted-foreground leading-relaxed">
                WIN-CYC is committed to continuous investment in quality management and certification systems. We believe that rigorous standards and transparent compliance measures are the foundation of client trust. We will continue to expand our certification scope to meet the increasingly stringent requirements of global clients and regulatory bodies.
              </p>
            </div>
          </div>
        </section>
    </>
  );
};

export default Certificates;