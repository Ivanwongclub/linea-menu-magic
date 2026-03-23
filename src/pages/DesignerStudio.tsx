import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Lock, Library, Layers, Share2 } from "lucide-react";
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
        <section className="py-32 px-6 lg:px-8 bg-secondary">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-subtitle mb-6 tracking-[0.25em] uppercase">Designer Studio</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              Build review-ready trim concepts with speed and precision.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
              A private concept-board workspace for global design teams to place components, develop visual directions, and present clearer decisions before sampling.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/designer-studio/dashboard">
                <Button size="lg" className="tracking-wide">
                  Enter Designer Studio
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="tracking-wide">
                  Request Access
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="py-24 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Built for fast-moving design teams
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Designer Studio helps teams turn references, components, and placement ideas into structured concept boards that are easier to review, refine, and share across stakeholders.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {capabilities.map((cap) => (
                <div key={cap.title} className="p-8 border border-border">
                  <cap.icon className="w-10 h-10 text-foreground mb-6" strokeWidth={1.5} />
                  <h3 className="text-xl font-semibold text-foreground mb-1">
                    {cap.title}
                  </h3>
                  <p className="text-xs text-muted-foreground/60 tracking-wide uppercase mb-4">
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
        <section className="py-24 px-6 lg:px-8 bg-foreground text-primary-foreground">
          <div className="max-w-md mx-auto text-center">
            <Lock className="w-10 h-10 text-primary-foreground/50 mx-auto mb-8" strokeWidth={1.5} />
            <h2 className="text-2xl font-semibold mb-4">
              Private access for approved design teams
            </h2>
            <p className="text-primary-foreground/60 mb-8 text-sm leading-relaxed">
              Designer Studio is provided as a controlled workspace for approved partners and brand teams. Request access to enter a secure environment for concept development and presentation.
            </p>

            <div className="space-y-4 mb-8">
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3 bg-transparent border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 text-sm focus:outline-none focus:border-primary-foreground/60 transition-colors"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 bg-transparent border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 text-sm focus:outline-none focus:border-primary-foreground/60 transition-colors"
              />
              <button className="w-full py-3 bg-primary-foreground text-foreground text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:bg-primary-foreground/90">
                Login
              </button>
            </div>

            <p className="text-sm text-primary-foreground/40">
              Need access?
              <Link to="/contact" className="text-primary-foreground/70 ml-1 underline hover:text-primary-foreground transition-colors">
                Request Access
              </Link>
            </p>
          </div>
        </section>

        {/* Access Steps */}
        <section className="py-24 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-12">
              How access works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: "1", title: "Request access", desc: "Contact the WIN-CYC team to introduce your brand, design workflow, and use case." },
                { step: "2", title: "Workspace approval", desc: "We review fit, confirm workflow needs, and prepare the appropriate Studio access level." },
                { step: "3", title: "Start building", desc: "Enter Designer Studio to create concept boards, compare directions, and prepare presentations for review." },
              ].map((item) => (
                <div key={item.step}>
                  <div className="w-12 h-12 bg-secondary flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-foreground">{item.step}</span>
                  </div>
                  <h3 className="text-foreground font-medium mb-2">{item.title}</h3>
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
