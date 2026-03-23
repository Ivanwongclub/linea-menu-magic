import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Lock, Shield, Library, Layers, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const DesignerStudio = () => {
  const capabilities = [
    {
      icon: Library,
      title: "Controlled component workflow",
      subtitle: "Better source material, less friction",
      description: "Build from a structured component library so teams can compare options, place assets consistently, and reduce ad hoc review rounds.",
    },
    {
      icon: Layers,
      title: "Faster concept alignment",
      subtitle: "Clearer boards for internal review",
      description: "Turn placement ideas, annotations, and variants into concept boards that are easier for design, development, and merchandising teams to evaluate together.",
    },
    {
      icon: Share2,
      title: "Stronger pre-sample decisions",
      subtitle: "Present direction with more confidence",
      description: "Share review-ready boards that clarify trim intent, visual hierarchy, and rationale before the work moves into sampling and execution.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero */}
        <section className="py-40 lg:py-48 px-6 lg:px-8 bg-secondary">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-medium mb-8">Designer Studio</p>
            <div className="w-12 h-px bg-foreground/20 mx-auto mb-10" />
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-foreground mb-8 leading-[1.1] tracking-tight">
              Build review-ready trim concepts with speed and precision.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-14 max-w-2xl mx-auto">
              A private concept-board workspace for global design teams to place components, develop visual directions, and present clearer decisions before sampling.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/designer-studio/dashboard">
                <Button size="lg" className="tracking-[0.08em] px-12 py-4 h-14 text-sm">
                  Enter Designer Studio
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="tracking-[0.08em]">
                  Request Access
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="py-32 px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-medium mb-6">Capabilities</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 tracking-tight">
                Built for high-stakes design review
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Designer Studio gives global design teams a more structured way to develop trim direction, align internal stakeholders, and present clearer decisions before sampling.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-border">
              {capabilities.map((cap, i) => (
                <div key={cap.title} className={`p-10 border-b border-border ${i < 2 ? 'md:border-r' : ''}`}>
                  <cap.icon className="w-8 h-8 text-foreground mb-8" strokeWidth={1.2} />
                  <h3 className="text-lg font-semibold text-foreground mb-1 tracking-tight">
                    {cap.title}
                  </h3>
                  <p className="text-[10px] text-muted-foreground/50 tracking-[0.15em] uppercase mb-5">
                    {cap.subtitle}
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
        <section className="py-32 px-6 lg:px-8 bg-foreground text-primary-foreground">
          <div className="max-w-sm mx-auto text-center">
            <div className="w-14 h-14 border border-primary-foreground/20 flex items-center justify-center mx-auto mb-10">
              <Shield className="w-6 h-6 text-primary-foreground/40" strokeWidth={1.2} />
            </div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-primary-foreground/30 font-medium mb-6">Secure Access</p>
            <h2 className="text-2xl font-semibold mb-4 tracking-tight">
              Private access for approved design teams
            </h2>
            <p className="text-primary-foreground/50 mb-10 text-sm leading-relaxed">
              Designer Studio is provided as a controlled workspace for approved partners and brand teams. Request access to enter a secure environment for concept development and presentation.
            </p>

            <div className="space-y-3 mb-10">
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3.5 bg-transparent border border-primary-foreground/15 text-primary-foreground placeholder:text-primary-foreground/30 text-sm focus:outline-none focus:border-primary-foreground/50 transition-colors"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3.5 bg-transparent border border-primary-foreground/15 text-primary-foreground placeholder:text-primary-foreground/30 text-sm focus:outline-none focus:border-primary-foreground/50 transition-colors"
              />
              <button className="w-full py-3.5 bg-primary-foreground text-foreground text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:bg-primary-foreground/90 font-medium">
                Login
              </button>
            </div>

            <div className="w-8 h-px bg-primary-foreground/10 mx-auto mb-6" />
            <p className="text-xs text-primary-foreground/30">
              Need access?
              <Link to="/contact" className="text-primary-foreground/60 ml-1 underline hover:text-primary-foreground transition-colors">
                Request Access
              </Link>
            </p>
          </div>
        </section>

        {/* Access Steps */}
        <section className="py-32 px-6 lg:px-8 bg-secondary">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-medium mb-6">Onboarding</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-16 tracking-tight">
              How access works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { step: "01", title: "Request access", desc: "Contact the WIN-CYC team to introduce your brand, design workflow, and use case." },
                { step: "02", title: "Workspace approval", desc: "We review fit, confirm workflow needs, and prepare the appropriate Studio access level." },
                { step: "03", title: "Start building", desc: "Enter Designer Studio to create concept boards, compare directions, and prepare presentations for review." },
              ].map((item) => (
                <div key={item.step} className="text-left">
                  <span className="text-3xl font-bold text-foreground/10 block mb-4">{item.step}</span>
                  <h3 className="text-foreground font-semibold mb-2 tracking-tight">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
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
