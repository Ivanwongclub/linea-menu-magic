import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import { MapPin, Building2, Factory as FactoryIcon, Package, Truck, CheckCircle, ArrowRight } from "lucide-react";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import factoryHero from "@/assets/factory-hero.jpg";
import locationHongkong from "@/assets/location-hongkong.jpg";
import locationShanghai from "@/assets/location-shanghai.jpg";
import locationNewyork from "@/assets/location-newyork.jpg";
import factoryProduction from "@/assets/factory-production.jpg";
import locationVietnam from "@/assets/location-vietnam.jpg";

const offices = [
  {
    city: "Hong Kong",
    label: "Headquarters",
    image: locationHongkong,
    description: "Global coordination hub since 1979. Manages export operations, client relationships, product development strategy, and supply-chain orchestration across all locations.",
    tags: ["Coordination", "Export", "Client Service"],
  },
  {
    city: "Shanghai",
    label: "Sales Office",
    image: locationShanghai,
    description: "Supports domestic and regional market development with dedicated account management, sample showrooms, and rapid customer-response capability.",
    tags: ["Market Development", "Showroom", "Account Management"],
  },
  {
    city: "New York",
    label: "Sales Office",
    image: locationNewyork,
    description: "Serves the Americas market with local business development, trend consultation, and logistics coordination for faster turnaround on Western-hemisphere orders.",
    tags: ["Americas Market", "Business Development", "Logistics"],
  },
];

const factories = [
  {
    city: "China",
    label: "Manufacturing Hub",
    image: factoryProduction,
    description: "Established production base with vertically integrated facilities covering die-casting, stamping, plating, painting, and assembly. Decades of accumulated expertise in metal buttons, trims, and hardware.",
    tags: ["Buttons", "Metal Trims", "Hardware", "Plating"],
  },
  {
    city: "Vietnam",
    label: "Manufacturing Hub",
    image: locationVietnam,
    description: "Expanding production facility supporting growing regional demand with competitive capacity, modern equipment, and alignment with evolving global sourcing strategies.",
    tags: ["Regional Capacity", "Competitive Production", "Growth"],
  },
];

const workflow = [
  { icon: Package, title: "Development", desc: "Concept-to-sample in one workflow — mould design, prototyping, and finish development under one roof." },
  { icon: FactoryIcon, title: "Sampling", desc: "Rapid sample turnaround with dedicated sample lines and in-house tooling for fast iteration." },
  { icon: CheckCircle, title: "Manufacturing", desc: "Vertically integrated production — die-casting, stamping, plating, painting, assembly — with ISO-led quality at every stage." },
  { icon: Truck, title: "Shipment & Service", desc: "Export-ready logistics coordinated from Hong Kong, supported by local offices in key markets for responsive service." },
];

const capabilities = [
  { title: "Buttons & Fasteners", desc: "Metal, polyester, corozo, and combination buttons across all garment categories." },
  { title: "Zippers & Pulls", desc: "Metal and nylon zippers with custom puller design and branded tape options." },
  { title: "Metal Trims & Hardware", desc: "Rivets, eyelets, snaps, hooks, buckles, and decorative hardware for apparel and leather goods." },
  { title: "Branding Trims", desc: "Custom logo plates, labels, hangtags, and branded finishing details." },
];

const Factory = () => {
  const { ref: locRef, isVisible: locVisible, getDelay: getLocDelay } = useStaggeredAnimation(5, 120);
  const { ref: flowRef, isVisible: flowVisible, getDelay: getFlowDelay } = useStaggeredAnimation(4, 100);
  const { ref: capRef, isVisible: capVisible, getDelay: getCapDelay } = useStaggeredAnimation(4, 100);
  const { ref: qualRef, isVisible: qualVisible } = useScrollAnimation();

  return (
    <>
        <PageBreadcrumb
          segments={[
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: "Factory & Offices" },
          ]}
          title="Global Operations"
        />

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="aspect-[21/9] md:aspect-[3/1] w-full overflow-hidden">
            <img src={factoryHero} alt="WinCYC manufacturing facility" className="w-full h-full object-cover" width={1920} height={864} />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
          </div>
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full pb-10 md:pb-14">
              <p className="text-xs uppercase tracking-[0.2em] text-background/70 mb-3">Factory & Offices</p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-background mb-4 max-w-2xl leading-tight">
                A Connected Global Network
              </h1>
              <p className="text-sm md:text-base text-background/80 max-w-xl leading-relaxed">
                Coordinated from Hong Kong · Manufactured in China & Vietnam · Supported by sales offices in Shanghai & New York · One-stop development to shipment since 1979.
              </p>
            </div>
          </div>
        </section>

        {/* Locations — Offices */}
        <section className="py-20 px-6 lg:px-8 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-foreground" strokeWidth={1.5} />
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Offices</p>
            </div>
            <h2 className="text-2xl md:text-3xl font-light text-foreground mb-10">Coordination & Commercial</h2>

            <div ref={locRef} className="grid md:grid-cols-3 gap-8">
              {offices.map((loc, i) => (
                <div
                  key={loc.city}
                  className={`group transition-all duration-700 ease-out ${locVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                  style={getLocDelay(i)}
                >
                  {loc.image ? (
                    <div className="aspect-[4/3] overflow-hidden mb-5">
                      <img src={loc.image} alt={`${loc.city} office`} loading="lazy" width={800} height={600} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-secondary flex items-center justify-center mb-5">
                      <MapPin className="w-8 h-8 text-muted-foreground/40" strokeWidth={1} />
                    </div>
                  )}
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">{loc.label}</p>
                  <h3 className="text-lg font-medium text-foreground mb-2">{loc.city}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{loc.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {loc.tags.map((t) => (
                      <span key={t} className="text-[11px] uppercase tracking-wider text-muted-foreground border border-border px-2.5 py-1">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Locations — Manufacturing */}
        <section className="py-20 px-6 lg:px-8 border-b border-border bg-secondary">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <FactoryIcon className="w-5 h-5 text-foreground" strokeWidth={1.5} />
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Manufacturing</p>
            </div>
            <h2 className="text-2xl md:text-3xl font-light text-foreground mb-10">Production Hubs</h2>

            <div className="grid md:grid-cols-2 gap-8">
              {factories.map((loc, i) => (
                <div
                  key={loc.city}
                  className={`group transition-all duration-700 ease-out ${locVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                  style={getLocDelay(i + 3)}
                >
                  {loc.image ? (
                    <div className="aspect-[16/9] overflow-hidden mb-5">
                      <img src={loc.image} alt={`${loc.city} manufacturing`} loading="lazy" width={800} height={600} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-background flex items-center justify-center mb-5 border border-border">
                      <FactoryIcon className="w-8 h-8 text-muted-foreground/40" strokeWidth={1} />
                    </div>
                  )}
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">{loc.label}</p>
                  <h3 className="text-lg font-medium text-foreground mb-2">{loc.city}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{loc.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {loc.tags.map((t) => (
                      <span key={t} className="text-[11px] uppercase tracking-wider text-muted-foreground border border-border px-2.5 py-1">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="py-20 px-6 lg:px-8 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-light text-foreground mb-3">How the Network Works</h2>
            <p className="text-sm text-muted-foreground mb-12 max-w-lg">From concept to delivery — a single, integrated workflow across all locations.</p>

            <div ref={flowRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
              {workflow.map((step, i) => (
                <div
                  key={step.title}
                  className={`bg-background p-8 relative transition-all duration-700 ease-out ${flowVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  style={getFlowDelay(i)}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-medium text-muted-foreground/60">{String(i + 1).padStart(2, "0")}</span>
                    <step.icon className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-medium text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  {i < workflow.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-4 h-4 text-muted-foreground/40" strokeWidth={1.5} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="py-20 px-6 lg:px-8 border-b border-border bg-foreground text-background">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-light mb-3">Capability Areas</h2>
            <p className="text-sm text-background/60 mb-12 max-w-lg">Vertically integrated production across the full spectrum of garment accessories.</p>

            <div ref={capRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {capabilities.map((cap, i) => (
                <div
                  key={cap.title}
                  className={`border border-background/15 p-6 transition-all duration-700 ease-out ${capVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  style={getCapDelay(i)}
                >
                  <h3 className="text-sm font-medium text-background mb-3">{cap.title}</h3>
                  <p className="text-sm text-background/60 leading-relaxed">{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quality & Compliance */}
        <section ref={qualRef} className="py-20 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className={`grid md:grid-cols-2 gap-16 items-start transition-all duration-700 ease-out ${qualVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <div>
                <h2 className="text-2xl md:text-3xl font-light text-foreground mb-4">Quality & Compliance</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Every WinCYC facility operates under ISO 9001-certified quality management. From incoming raw-material inspection through in-process controls to final outgoing QC, each production batch follows a documented, auditable workflow — ensuring consistent quality across locations and product categories.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Our in-house testing laboratories verify plating adhesion, colour fastness, mechanical durability, and chemical compliance before any shipment leaves the facility. Export documentation, restricted-substance declarations, and customer-specific compliance requirements are managed centrally from Hong Kong.
                </p>
              </div>
              <div className="space-y-6">
                {[
                  { label: "Quality System", value: "ISO 9001 Certified" },
                  { label: "Testing", value: "In-house laboratories at each production hub" },
                  { label: "Compliance", value: "REACH, OEKO-TEX aligned, customer-specific protocols" },
                  { label: "Export Readiness", value: "Centrally managed documentation & logistics" },
                ].map((item) => (
                  <div key={item.label} className="border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
    </>
  );
};

export default Factory;
