import { lazy, Suspense, useState, useEffect } from "react";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import { Link } from "react-router-dom";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import { ArrowRight, CheckCircle, Box, Images, ChevronLeft, ChevronRight } from "lucide-react";
import brassSurface from "@/assets/materials/brass-surface.jpg";
import metalSurface from "@/assets/materials/metal-surface.jpg";
import resinSurface from "@/assets/materials/resin-surface.jpg";
import cottonSurface from "@/assets/materials/cotton-surface.jpg";
import sustainabilityForestImg from "@/assets/sustainability-forest.jpg";
import sustainabilityRecycledImg from "@/assets/sustainability-recycled-metal.jpg";
import sustainabilityEcoImg from "@/assets/sustainability-eco-process.jpg";
import sustainabilityNatureImg from "@/assets/sustainability-nature.jpg";
import certGrs from "@/assets/certs/grs.png";
import certOekoTex from "@/assets/certs/oeko-tex.png";
import certHigg from "@/assets/certs/higg-index.png";
import certSmeta from "@/assets/certs/smeta.png";
import valueInnovationImg from "@/assets/value-innovation.jpg";
import valuePartnershipImg from "@/assets/value-partnership.jpg";
import factoryProductionImg from "@/assets/factory-production.jpg";

const ObjGallery = lazy(() => import("@/components/production/ObjGallery"));
const PrintGallery = lazy(() => import("@/components/production/PrintGallery"));

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
    body: "From rapid 3D-printed prototypes to full production runs — our facility combines digital fabrication with vertically integrated manufacturing to move from concept to finished trim faster than traditional methods.",
    bullets: ["3D Printing"],
    image: factoryProductionImg,
    showPrintGallery: true,
  },
  {
    number: "03",
    title: "Service & Delivery",
    body: "Local offices in key markets provide rapid response, sample management, and on-the-ground support throughout the supply chain.",
    bullets: ["Regional Office Support", "Sample Turnaround"],
    image: valuePartnershipImg,
    showStudioLink: true,
  },
];

// ── Material categories for tab filtering ────────────────────────────────────
type MaterialCategory = "All" | "Organic" | "Synthetic" | "Metal";

interface Material {
  id: string;
  name: string;
  subtitle: string;
  body: string;
  image: string;
  category: MaterialCategory;
}

const MATERIAL_TABS: MaterialCategory[] = ["All", "Organic", "Synthetic", "Metal"];

const MATERIALS: Material[] = [
  {
    id: "brass",
    name: "Brass & Zinc Alloy",
    subtitle: "Metal · Die-cast & stamped",
    body: "Zinc alloy and sheet brass are our essential metal materials. With state-of-the-art tool design we realise an incredible variety of trims with specific shapes and extraordinary surfaces. From high-gloss finishes to vintage effects — we offer a wide range of electroplating colours and custom metal finishes.",
    image: brassSurface,
    category: "Metal",
  },
  {
    id: "cotton",
    name: "Cotton & Woven Trims",
    subtitle: "Organic · OEKO-TEX certified",
    body: "Natural braided cotton drawcords, woven webbing, and textile labels. Soft hand-feel, naturally dyeable, and certified under OEKO-TEX Standard 100. Our cotton trims are particularly popular for responsible fashion brands seeking natural-fibre alternatives to synthetic cords and straps.",
    image: cottonSurface,
    category: "Organic",
  },
  {
    id: "resin",
    name: "Polyester Resin",
    subtitle: "Synthetic · Wide colour range",
    body: "Characterised by a very fine and elegant pattern with harmonious colour appearance. With a wide range of solid colours you can find your desired style. There is a natural gloss in every button which makes this material unique — and unlike many plastics, polyester resin can be dye-matched with precision.",
    image: resinSurface,
    category: "Synthetic",
  },
  {
    id: "metal",
    name: "Stainless & Gunmetal",
    subtitle: "Metal · Polished & oxidised",
    body: "High-strength stainless steel and gunmetal alloy for buckles, rivets, and heavy-duty hardware. Polished, brushed, or matte oxidised finishes available. Maximum durability with a sophisticated appearance — widely used across outerwear, workwear, and premium denim.",
    image: metalSurface,
    category: "Metal",
  },
  {
    id: "nylon",
    name: "Nylon / TPE / Silicone",
    subtitle: "Synthetic · Technical & durable",
    body: "Nylon (Polyamide) and thermoplastic elastomers (TPE) are commonly used in the trim industry for their durability and strength. Soft silicone is used as a branding element for labels in single or multi colours. Particularly popular among outdoor, sports, and performance brands — we combine these with metal for a sophisticated and technical appearance.",
    image: cottonSurface,
    category: "Synthetic",
  },
  {
    id: "recycled",
    name: "Recycled & GRS Materials",
    subtitle: "Organic · GRS certified",
    body: "GRS-certified recycled metal content, recycled polyester cord, and bio-based resin alternatives. We continuously develop our sustainable material range to help brands meet their environmental commitments without compromising on quality, finish, or performance. Every recycled trim is tested to the same standards as virgin-material equivalents.",
    image: brassSurface,
    category: "Organic",
  },
];

function GalleryLoadingOverlay({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-background/85 backdrop-blur-sm">
      <div className="flex items-center gap-3 rounded border border-border bg-background px-4 py-3 text-sm text-foreground/80">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/70" />
        {label}
      </div>
    </div>
  );
}


// ─── Page ────────────────────────────────────────────────────────────────────

export default function Production() {
  const { ref: workflowRef, isVisible: workflowVisible, getDelay: getWfDelay } = useStaggeredAnimation(3, 150);
  const { ref: materialsRef, isVisible: materialsVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: sustainRef, isVisible: sustainVisible } = useScrollAnimation({ threshold: 0.1 });
  const [activeTab, setActiveTab] = useState<MaterialCategory>("All");
  const [matIndex, setMatIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [printGalleryOpen, setPrintGalleryOpen] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = "/optimized/assets__production-hero-1200.avif";
    link.type = "image/avif";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

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
            <picture>
              <source
                type="image/avif"
                srcSet="/optimized/assets__production-hero-480.avif 480w, /optimized/assets__production-hero-768.avif 768w, /optimized/assets__production-hero-1200.avif 1200w, /optimized/assets__production-hero-1600.avif 1600w"
                sizes="100vw"
              />
              <source
                type="image/webp"
                srcSet="/optimized/assets__production-hero-480.webp 480w, /optimized/assets__production-hero-768.webp 768w, /optimized/assets__production-hero-1200.webp 1200w, /optimized/assets__production-hero-1600.webp 1600w"
                sizes="100vw"
              />
              <img
                src="/optimized/assets__production-hero-1200.jpg"
                alt="Precision garment hardware — brass buttons, snap fasteners, buckles"
                className="w-full h-full object-cover"
                width={1920}
                height={640}
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </picture>
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
            <div ref={workflowRef} className="space-y-8 lg:space-y-10">
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
                      <img
                        src={step.image}
                        alt={step.title}
                        className="w-full h-full object-cover"
                        width={1200}
                        height={900}
                        loading={i === 0 ? "eager" : "lazy"}
                        decoding="async"
                      />
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

                    {(step as any).showGallery && (
                      <button
                        onClick={() => setGalleryOpen(true)}
                        className="group mt-6 inline-flex items-center gap-3 px-5 py-3 border border-foreground/20 hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-300 text-[13px] font-medium tracking-wide"
                      >
                        <Box size={16} />
                        View 3D Prototypes
                      </button>
                    )}

                    {(step as any).showPrintGallery && (
                      <button
                        onClick={() => setPrintGalleryOpen(true)}
                        className="group mt-6 inline-flex items-center gap-3 px-5 py-3 border border-foreground/20 hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-300 text-[13px] font-medium tracking-wide"
                      >
                        <Images size={16} />
                        View Prototype Gallery
                      </button>
                    )}

                    {(step as any).showStudioLink && (
                      <Link
                        to="/designer-studio"
                        className="group mt-6 inline-flex items-center gap-3 px-5 py-3 border border-foreground/20 hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-300 text-[13px] font-medium tracking-wide"
                      >
                        <span>Custom via Designer Studio</span>
                        <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1 flex-shrink-0" />
                      </Link>
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
              {/* Section header */}
              <div className="text-center mb-12">
                <span className="section-label block mb-4">Materials</span>
                <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-foreground leading-tight">
                  Our Materials
                </h2>
                <p className="mt-4 text-[15px] text-muted-foreground max-w-lg mx-auto leading-relaxed">
                  Functionality and product performance is of upmost importance to us — ensuring all products go through necessary quality control procedures.
                </p>

                {/* Centred tabs */}
                <div className="flex justify-center border-b border-border mt-10">
                  {MATERIAL_TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => { setActiveTab(tab); setMatIndex(0); }}
                      className={`px-8 py-4 text-[18px] lg:text-[20px] font-bold tracking-wide transition-colors duration-150 border-b-2 -mb-px ${
                        activeTab === tab
                          ? "border-foreground text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Material carousel */}
              {(() => {
                const filtered = MATERIALS.filter((m) => activeTab === "All" || m.category === activeTab);
                const mat = filtered[matIndex] || filtered[0];
                if (!mat) return null;
                const isFirst = matIndex === 0;
                const isLast = matIndex >= filtered.length - 1;
                return (
                  <div className="relative">
                    {/* Left arrow */}
                    {!isFirst && (
                      <button
                        onClick={() => setMatIndex((i) => i - 1)}
                        className="hidden lg:flex absolute -left-14 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center border border-foreground/20 text-foreground hover:bg-foreground hover:text-background transition-colors duration-150"
                      >
                        <ChevronLeft size={18} />
                      </button>
                    )}
                    {/* Right arrow */}
                    {!isLast && (
                      <button
                        onClick={() => setMatIndex((i) => i + 1)}
                        className="hidden lg:flex absolute -right-14 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center border border-foreground/20 text-foreground hover:bg-foreground hover:text-background transition-colors duration-150"
                      >
                        <ChevronRight size={18} />
                      </button>
                    )}

                    <div
                      key={mat.id}
                      className={`flex flex-col ${matIndex % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} gap-8 lg:gap-14 items-center transition-opacity duration-300`}
                    >
                      {/* Image */}
                      <div className="lg:w-1/2 w-full">
                        <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius)]">
                          <img
                            src={mat.image}
                            alt={mat.name}
                            className="w-full h-full object-cover"
                            width={1200}
                            height={900}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="lg:w-1/2 w-full">
                        <div className="max-w-md">
                          <span className="text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground">
                            {mat.category}
                          </span>
                          <h3 className="text-[22px] lg:text-[26px] font-semibold text-foreground mt-2 leading-tight">
                            {mat.name}
                          </h3>
                          <p className="text-[13px] text-muted-foreground mt-1">
                            {mat.subtitle}
                          </p>
                          <p className="text-[15px] text-muted-foreground leading-relaxed mt-4">
                            {mat.body}
                          </p>
                          <Link to="/ecollections" className="group inline-flex items-center gap-2 mt-6 text-[13px] font-medium text-foreground hover:text-foreground/70 transition-colors">
                            View in E-Collections
                            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Dot indicators */}
                    <div className="flex justify-center gap-2 mt-10">
                      {filtered.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setMatIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            idx === matIndex ? "bg-foreground w-6" : "bg-foreground/20 hover:bg-foreground/40"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </section>

        {/* ── SECTION 4: Sustainability & Social Responsibility ─────────── */}
        <section className="section-off-white">
          <div className="section-inner">
            <div
              ref={sustainRef}
              className={`transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${sustainVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center mb-14">
                <div className="lg:w-1/2 w-full">
                  <span className="section-label block mb-4">Sustainability</span>
                  <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-foreground leading-tight">
                    Sustainability &<br />Social Responsibility
                  </h2>
                  <p className="mt-6 text-[15px] text-muted-foreground leading-relaxed">
                    We take responsible production seriously. We're continuously working to find sustainable manufacturing solutions in order to minimise our impact on the environment — along with the innovative and sophisticated processes involved in the production of recycled materials.
                  </p>
                  <div className="flex flex-wrap items-center gap-8 mt-8">
                    {[
                      { src: certGrs, alt: "Global Recycled Standard" },
                      { src: certOekoTex, alt: "OEKO-TEX Standard 100" },
                      { src: certHigg, alt: "Higg Index" },
                      { src: certSmeta, alt: "SMETA" },
                    ].map((cert) => (
                      <img
                        key={cert.alt}
                        src={cert.src}
                        alt={cert.alt}
                        className="h-20 w-auto object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    ))}
                  </div>
                </div>
                <div className="lg:w-1/2 w-full">
                  <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius)]">
                    <img
                      src={sustainabilityForestImg}
                      alt="Sustainable manufacturing"
                      className="w-full h-full object-cover"
                      width={1200}
                      height={900}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { image: sustainabilityEcoImg, title: "Sustainability", body: "We take responsible production seriously. We're continuously working to find sustainable manufacturing solutions to minimise our environmental impact.", href: "/sustainability" },
                  { image: sustainabilityRecycledImg, title: "Materials", body: "From idea to finished trim — we combine stylish trimming solutions with eco-conscious material choices and certified sustainable production.", href: "/production" },
                  { image: sustainabilityNatureImg, title: "Our Commitment", body: "Functionality and product performance is of upmost importance — ensuring all products go through quality control procedures aligned with environmental standards.", href: "/about" },
                ].map((card) => (
                  <Link key={card.title} to={card.href} className="group relative aspect-[3/4] overflow-hidden rounded-[var(--radius)] block">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      width={900}
                      height={1200}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-[18px] font-semibold text-white mb-2">{card.title}</h3>
                      <p className="text-[13px] text-white/70 leading-relaxed line-clamp-3">{card.body}</p>
                      <span className="inline-flex items-center gap-1 mt-4 text-[13px] font-medium text-white/80 group-hover:text-white transition-colors">
                        Learn more
                        <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
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
          <Suspense fallback={<GalleryLoadingOverlay label="Loading 3D gallery..." />}>
            <ObjGallery
              open={galleryOpen}
              onClose={() => setGalleryOpen(false)}
            />
          </Suspense>
        )}

        {/* Print Gallery popup */}
        {printGalleryOpen && (
          <Suspense fallback={<GalleryLoadingOverlay label="Loading prototype gallery..." />}>
            <PrintGallery
              open={printGalleryOpen}
              onClose={() => setPrintGalleryOpen(false)}
            />
          </Suspense>
        )}
    </>
  );
}
