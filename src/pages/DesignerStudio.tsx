import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StudioPreview from "@/components/designer-studio/StudioPreview";
import { Shield, Library, Layers, Share2 } from "lucide-react";
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
        <section className="relative overflow-hidden">
          {/* Art-directed background */}
          <div className="absolute inset-0 bg-secondary" />
          <div
            className="absolute inset-0 opacity-[0.018]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-secondary to-transparent" />

          <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-32 lg:py-44">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
              {/* Left — copy */}
              <div className="max-w-xl">
                <p className="text-[11px] tracking-[0.35em] uppercase text-muted-foreground/60 font-medium mb-10">Designer Studio</p>
                <div className="w-16 h-px bg-foreground/15 mb-12" />
                <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-foreground mb-10 leading-[1.08] tracking-tight">
                  Build review-ready trim concepts with speed and precision.
                </h1>
                <p className="text-base md:text-lg text-muted-foreground/70 leading-relaxed mb-14 max-w-md">
                  A private concept-board workspace for global design teams to place components, develop visual directions, and present clearer decisions before sampling.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <Link to="/designer-studio/dashboard">
                    <Button size="lg" className="tracking-[0.1em] px-14 py-5 h-[3.75rem] text-sm shadow-[0_2px_20px_-4px_hsl(var(--foreground)/0.25)]">
                      Enter Designer Studio
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="outline" size="lg" className="tracking-[0.1em] px-10 h-[3.75rem] text-sm">
                      Request Access
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right — studio preview */}
              <div className="lg:pl-4">
                <StudioPreview />
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="py-36 px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-24">
              <p className="text-[11px] tracking-[0.35em] uppercase text-muted-foreground/60 font-medium mb-8">Capabilities</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-7 tracking-tight">
                Built for high-stakes design review
              </h2>
              <p className="text-muted-foreground/70 max-w-2xl mx-auto leading-relaxed">
                Designer Studio gives global design teams a more structured way to develop trim direction, align internal stakeholders, and present clearer decisions before sampling.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-foreground/10">
              {capabilities.map((cap, i) => (
                <div key={cap.title} className={`p-12 border-b border-foreground/10 ${i < 2 ? 'md:border-r' : ''}`}>
                  <div className="w-12 h-12 border border-foreground/10 flex items-center justify-center mb-10">
                    <cap.icon className="w-5 h-5 text-foreground/70" strokeWidth={1.4} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight leading-snug">
                    {cap.title}
                  </h3>
                  <p className="text-[10px] text-muted-foreground/40 tracking-[0.18em] uppercase mb-6 font-medium">
                    {cap.subtitle}
                  </p>
                  <p className="text-sm text-muted-foreground/70 leading-[1.7]">
                    {cap.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Login Section */}
        <section className="py-36 px-6 lg:px-8 bg-foreground text-primary-foreground">
          <div className="max-w-[22rem] mx-auto text-center">
            <div className="w-16 h-16 border border-primary-foreground/12 flex items-center justify-center mx-auto mb-12">
              <Shield className="w-6 h-6 text-primary-foreground/30" strokeWidth={1.2} />
            </div>
            <p className="text-[10px] tracking-[0.35em] uppercase text-primary-foreground/25 font-medium mb-8">Secure Access</p>
            <h2 className="text-2xl font-semibold mb-5 tracking-tight leading-snug">
              Private access for approved design teams
            </h2>
            <p className="text-primary-foreground/40 mb-12 text-sm leading-relaxed">
              Designer Studio is provided as a controlled workspace for approved partners and brand teams. Request access to enter a secure environment for concept development and presentation.
            </p>

            <div className="space-y-3 mb-12">
              <input
                type="email"
                placeholder="Email"
                className="w-full px-5 py-4 bg-transparent border border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/25 text-sm focus:outline-none focus:border-primary-foreground/40 transition-colors"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-5 py-4 bg-transparent border border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/25 text-sm focus:outline-none focus:border-primary-foreground/40 transition-colors"
              />
              <button className="w-full py-4 bg-primary-foreground text-foreground text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:bg-primary-foreground/90 font-medium">
                Login
              </button>
            </div>

            <div className="w-10 h-px bg-primary-foreground/8 mx-auto mb-7" />
            <p className="text-xs text-primary-foreground/25">
              Need access?
              <Link to="/contact" className="text-primary-foreground/50 ml-1.5 underline underline-offset-4 hover:text-primary-foreground transition-colors">
                Request Access
              </Link>
            </p>
          </div>
        </section>

        {/* Access Steps */}
        <section className="py-36 px-6 lg:px-8 bg-secondary">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[11px] tracking-[0.35em] uppercase text-muted-foreground/60 font-medium mb-8">Onboarding</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-20 tracking-tight">
              How access works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {[
                { step: "01", title: "Request access", desc: "Contact the WIN-CYC team to introduce your brand, design workflow, and use case." },
                { step: "02", title: "Workspace approval", desc: "We review fit, confirm workflow needs, and prepare the appropriate Studio access level." },
                { step: "03", title: "Start building", desc: "Enter Designer Studio to create concept boards, compare directions, and prepare presentations for review." },
              ].map((item) => (
                <div key={item.step} className="text-left">
                  <span className="text-4xl font-bold text-foreground/8 block mb-5 tracking-tight">{item.step}</span>
                  <h3 className="text-foreground font-semibold mb-3 tracking-tight">{item.title}</h3>
                  <p className="text-sm text-muted-foreground/70 leading-[1.7]">{item.desc}</p>
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