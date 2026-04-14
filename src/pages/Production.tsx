import { useState, Suspense } from "react";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import { Link } from "react-router-dom";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import { ArrowRight, CheckCircle, Box } from "lucide-react";
import ObjGallery from "@/components/production/ObjGallery";
import factoryProductionImg from "@/assets/factory-production.jpg";
import productionHeroImg from "@/assets/production-hero.jpg";
import heritageImg from "@/assets/heritage-craftsmanship.jpg";
import valueQualityImg from "@/assets/value-quality.jpg";
import valueInnovationImg from "@/assets/value-innovation.jpg";
import valuePartnershipImg from "@/assets/value-partnership.jpg";
import milestoneIsoImg from "@/assets/milestone-iso-quality.jpg";
import brassSurface from "@/assets/materials/brass-surface.jpg";
import metalSurface from "@/assets/materials/metal-surface.jpg";
import resinSurface from "@/assets/materials/resin-surface.jpg";
import cottonSurface from "@/assets/materials/cotton-surface.jpg";

// ─── Data ───────────────────────────────────────────────────────────────────

const workflowSteps = [
  {
    number: "01",
    title: "Design & Development",
    body: "From initial concept to production-ready specification. Our development team works directly with clients on 3D prototyping, finish selection, and material sourcing — turning ideas into trim-ready samples.",
    bullets: ["3D Artwork & Prototyping"],
    image: valueInnovationImg,
    showGallery: true,
  },
  {
    number: "02",
    title: "Production",
    body: "Vertically integrated manufacturing across die-casting, stamping, plating, painting, and assembly. ISO 9001-certified quality control at every stage ensures consistency from first sample to full production run.",
    bullets: ["Die-casting & Stamping", "Plating & Surface Treatment", "ISO 9001 Quality Control"],
    image: factoryProductionImg,
  },
  {
    number: "03",
    title: "Service & Delivery",
    body: "Export-ready logistics coordinated from Hong Kong headquarters. Local offices in key markets provide rapid response, sample management, and on-the-ground support throughout the supply chain.",
    bullets: ["Export Logistics from Hong Kong", "Regional Office Support", "Sample Turnaround"],
    image: valuePartnershipImg,
  },
];

const materials = [
  {
    category: "Metal",
    items: [
      { name: "Brass & Bronze", image: brassSurface, desc: "Premium brass alloy — warm golden tone, high corrosion resistance, ideal for decorative hardware." },
      { name: "Zinc Alloy", image: metalSurface, desc: "Versatile die-cast zinc — precise detail reproduction, suitable for snap buttons and zipper pullers." },
      { name: "Stainless Steel", image: metalSurface, desc: "High-strength stainless — polished or brushed finish, maximum durability for buckles and rivets." },
      { name: "Gunmetal", image: metalSurface, desc: "Dark oxidised finish — matte or semi-gloss, popular in contemporary fashion hardware." },
    ],
  },
  {
    category: "Resin & Plastic",
    items: [
      { name: "Polyester Resin", image: resinSurface, desc: "Semi-translucent resin buttons — rich surface depth, wide colour range, lightweight." },
      { name: "Corozo (NUT)", image: resinSurface, desc: "Natural vegetable ivory — sustainable, biodegradable, unique grain pattern on each piece." },
      { name: "Nylon / TPE", image: resinSurface, desc: "Engineering-grade nylon cord ends and toggles — flexible, durable, available in stock colours." },
    ],
  },
  {
    category: "Cotton & Textile",
    items: [
      { name: "Cotton Cord", image: cottonSurface, desc: "Natural braided cotton drawcords — soft hand-feel, OEKO-TEX certified, custom dyeable." },
      { name: "Nylon Webbing", image: cottonSurface, desc: "High-tensile woven nylon webbing — abrasion resistant, ideal for straps and belts." },
      { name: "Woven Labels", image: cottonSurface, desc: "Custom woven brand labels — tight weave, logo detail to 0.5mm, heat-seal or sew-in." },
    ],
  },
];

const capabilities = [
  { title: "Buttons & Fasteners", desc: "Metal, polyester, corozo, and combination buttons across all garment categories." },
  { title: "Zippers & Pulls", desc: "Metal and nylon zippers with custom puller design and branded tape options." },
  { title: "Metal Trims & Hardware", desc: "Rivets, eyelets, snaps, hooks, buckles, and decorative hardware for apparel and leather goods." },
  { title: "Branding Trims", desc: "Custom logo plates, labels, hangtags, and branded finishing details." },
  { title: "Soft Trims", desc: "Cotton drawcords, woven webbing, cord ends and toggles for sportswear and outerwear." },
  { title: "Sustainable Options", desc: "GRS-certified recycled metal, OEKO-TEX cotton, and bio-based resin alternatives." },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Production() {
  const { ref: workflowRef, isVisible: workflowVisible, getDelay: getWfDelay } = useStaggeredAnimation(3, 150);
  const { ref: materialsRef, isVisible: materialsVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: capRef, isVisible: capVisible, getDelay: getCapDelay } = useStaggeredAnimation(6, 80);
  const { ref: qualRef, isVisible: qualVisible } = useScrollAnimation({ threshold: 0.2 });
  const [activeCategory, setActiveCategory] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  return (
    <>
      <PageBreadcrumb
        segments={[
          { label: "Home", href: "/" },
          { label: "Production" },
        ]}
      />
        {/* ── SECTION 1: Full-bleed hero ──────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="aspect-[21/9] md:aspect-[3/1] w-full overflow-hidden">
            <img src={productionHeroImg} alt="Precision garment hardware — brass buttons, snap fasteners, buckles" className="w-full h-full object-cover" width={1920} height={640} fetchPriority="high" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
          </div>
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full pb-10 md:pb-14">
              <p className="text-xs uppercase tracking-[0.2em] text-white/80 mb-3 drop-shadow-sm">How We Work</p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-4 max-w-2xl leading-tight drop-shadow-md">
                From Idea to<br />Finished Trim
              </h1>
              <p className="text-sm md:text-base text-white/90 max-w-xl leading-relaxed drop-shadow-sm">
                In-house design · precision manufacturing · global delivery — since 1979.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: Workflow steps ─────────────────────────────────── */}
        <section className="section-off-white">
          <div className="section-inner">
            <div ref={workflowRef} className="space-y-20 lg:space-y-28">
              {workflowSteps.map((step, i) => (
                <div
                  key={step.number}
                   className={`flex flex-col ${i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} gap-10 lg:gap-16 items-center transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
                     workflowVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={getWfDelay(i)}
                >
                  {/* Image */}
                  <div className="lg:w-1/2 w-full">
                    <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius)]">
                      <img src={step.image} alt={step.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="lg:w-1/2 w-full relative">
                    <span className="text-[80px] lg:text-[120px] font-bold text-foreground/[0.04] leading-none absolute -top-4 -left-2 select-none pointer-events-none">
                      {step.number}
                    </span>
                    <h2 className="text-[24px] lg:text-[28px] font-semibold text-foreground relative">
                      {step.title}
                    </h2>
                    <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                    <ul className="mt-6 space-y-2">
                      {step.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-[14px] text-foreground/80">
                          <CheckCircle size={16} className="text-foreground/40 flex-shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>

                    {/* 3D Gallery trigger — only on Design & Development step */}
                    {(step as any).showGallery && (
                      <button
                        onClick={() => setGalleryOpen(true)}
                        className="group mt-6 inline-flex items-center gap-3 px-5 py-3 border border-foreground/20 hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-300 text-[13px] font-medium tracking-wide"
                      >
                        <Box size={16} />
                        View 3D Prototypes
                        <span className="text-[11px] opacity-50 ml-1">
                          4 models
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 3: Materials ──────────────────────────────────────── */}
        <section className="section-light">
          <div className="section-inner">
            <div
              ref={materialsRef}
              className={`transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${materialsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-10">
                <div>
                  <span className="section-label block mb-4">Materials</span>
                  <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-foreground leading-tight">
                    Our Materials
                  </h2>
                </div>
                <p className="text-[15px] text-muted-foreground max-w-md leading-relaxed">
                  Every material is selected for functionality, aesthetic quality, and compliance with international standards — including GRS, OEKO-TEX, and REACH.
                </p>
              </div>

              {/* Category tabs */}
              <div className="flex border-b border-border mb-8">
                {materials.map((cat, i) => (
                  <button
                    key={cat.category}
                    onClick={() => setActiveCategory(i)}
                    className={`px-6 py-3 text-sm font-medium tracking-wide transition-colors duration-150 border-b-2 -mb-px ${
                      activeCategory === i
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat.category}
                  </button>
                ))}
              </div>

              {/* Material cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {materials[activeCategory].items.map((mat) => (
                  <div key={mat.name} className="group border border-border rounded-[var(--radius)] overflow-hidden hover-card hover-img-zoom hover:border-foreground/20 transition-[border-color] duration-200">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={mat.image} alt={mat.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-[15px] font-semibold text-foreground">{mat.name}</h3>
                      <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{mat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: Quality & Certifications ──────────────────────── */}
        <section className="section-off-white">
          <div className="section-inner">
            <div
              ref={qualRef}
               className={`flex flex-col lg:flex-row gap-12 lg:gap-16 items-center transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
                 qualVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <div className="lg:w-1/2">
                <span className="section-label block mb-4">Quality</span>
                <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold text-foreground leading-tight">
                  ISO 9001<br />Certified
                </h2>
                <p className="mt-6 text-[15px] text-muted-foreground leading-relaxed">
                  Every WIN-CYC facility operates under ISO 9001-certified quality management. From incoming raw-material inspection through in-process controls to final outgoing QC, each production batch follows a documented, auditable workflow.
                </p>
                <p className="mt-4 text-[15px] text-muted-foreground leading-relaxed">
                  Our in-house testing laboratories verify plating adhesion, colour fastness, mechanical durability, and chemical compliance — including restricted-substance declarations for EU and US regulated markets.
                </p>
                <div className="flex flex-wrap gap-2 mt-6">
                  {["ISO 9001", "OEKO-TEX", "GRS", "REACH"].map((cert) => (
                    <span key={cert} className="px-4 py-2 text-[12px] font-medium tracking-wide uppercase border border-foreground/20 text-foreground/70">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius)]">
                  <img src={milestoneIsoImg} alt="ISO 9001 Quality Management" className="w-full h-full object-cover" loading="lazy" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: Product capabilities grid ─────────────────────── */}
        <section className="section-inverse">
          <div className="section-inner">
            <span className="section-label block mb-4 text-white/50">Capabilities</span>
            <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-white leading-tight mb-12">
              What We Produce
            </h2>
            <div ref={capRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {capabilities.map((cap, i) => (
                <div
                  key={cap.title}
                  className={`border border-white/10 p-6 rounded-[var(--radius)] hover:border-white/25 transition-all duration-300 ${
                    capVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  }`}
                  style={getCapDelay(i)}
                >
                  <h3 className="text-[16px] font-semibold text-white mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-[14px] text-white/60 leading-relaxed">{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 6: CTA ───────────────────────────────────────────── */}
        <section className="section-light">
          <div className="section-inner text-center">
            <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-foreground">
              Ready to Start?
            </h2>
            <p className="mt-4 text-[16px] text-muted-foreground max-w-lg mx-auto">
              Submit a request or speak to our team about your next trim programme.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background text-[14px] font-medium hover:bg-foreground/90 transition-colors"
              >
                Contact Us
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground text-[14px] font-medium hover:bg-secondary transition-colors"
              >
                Browse Products
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* 3D Gallery popup */}
        {galleryOpen && (
          <ObjGallery
            open={galleryOpen}
            onClose={() => setGalleryOpen(false)}
          />
        )}
    </>
  );
}
