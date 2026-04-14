import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRODUCT_FAMILIES, PRODUCT_SEGMENT_DETAILS } from "@/features/products/taxonomy";
import aboutHeritageImg from "@/assets/about-heritage.jpg";
import heritageCraftImg from "@/assets/heritage-craftsmanship.jpg";
import aboutShowroomImg from "@/assets/about-showroom.jpg";
import foundersImg from "@/assets/founders.png";

import buttonsCategoryImg from "@/assets/products/buttons-category.jpg";
import hardwareCategoryImg from "@/assets/products/hardware-category.jpg";
import laceImg from "@/assets/products/lace-category.jpg";
import zippersCategoryImg from "@/assets/products/zippers-category.jpg";
import metalButtonImg from "@/assets/products/metal-button.jpg";
import resinButtonsImg from "@/assets/products/resin-buttons.jpg";
import snapButtonImg from "@/assets/products/snap-button.jpg";
import engravedButtonImg from "@/assets/products/engraved-button.jpg";
import beltBuckleImg from "@/assets/products/belt-buckle.jpg";
import metalClaspImg from "@/assets/products/metal-clasp.jpg";
import metalZipperImg from "@/assets/products/metal-zipper.jpg";
import cottonLaceImg from "@/assets/products/cotton-lace.jpg";
import wovenLabelImg from "@/assets/products/woven-label.jpg";
import otherCategoryImg from "@/assets/products/other-category.jpg";
import featuredSegmentImg from "@/assets/products/featured-segment.jpg";
import megaProductsGrid from "@/assets/products/mega-products-grid.png";

// ─── About flat link list ──────────────────────────────────────────────────────
interface AboutLink { label?: string; href?: string; image?: string; divider?: true; }

const ABOUT_LINKS: AboutLink[] = [
  { label: "About WIN-CYC",  href: "/about",              image: aboutHeritageImg  },
  { label: "Our Story",      href: "/about/our-story",    image: aboutHeritageImg  },
  { label: "Factory",        href: "/about/factory",      image: heritageCraftImg  },
  { label: "Certificates",   href: "/about/certificates", image: aboutShowroomImg  },
  { label: "Sustainability", href: "/sustainability",      image: aboutShowroomImg  },
  { divider: true },
  { label: "News",           href: "/news",               image: aboutHeritageImg  },
];

const ABOUT_DEFAULT_PREVIEW = aboutHeritageImg;

const ABOUT_TRUST_CARDS = [
  { title: "Heritage",       description: "Four decades of craftsmanship excellence", href: "/about/our-story", image: foundersImg      },
  { title: "Manufacturing",  description: "Precision production at scale",            href: "/about/factory",   image: heritageCraftImg },
  { title: "Responsibility", description: "Certified sustainable operations",         href: "/sustainability",  image: aboutShowroomImg },
];

// ─── Products families ─────────────────────────────────────────────────────────
const MEGA_FAMILIES = [
  {
    name: "Hardware", slug: "hardware",
    image: hardwareCategoryImg,
    subcategories: [
      { en: "Buttons",        image: metalButtonImg       },
      { en: "Snap Buttons",   image: snapButtonImg        },
      { en: "Jeans Buttons",  image: engravedButtonImg    },
      { en: "Shank Buttons",  image: metalButtonImg       },
      { en: "Buckles",        image: beltBuckleImg        },
      { en: "Eyelets",        image: otherCategoryImg     },
      { en: "Hook & Eyes",    image: metalClaspImg        },
      { en: "Rivets",         image: otherCategoryImg     },
      { en: "Zipper Pullers", image: metalZipperImg       },
      { en: "Toggles",        image: otherCategoryImg     },
      { en: "Cord Ends",      image: cottonLaceImg        },
      { en: "Cord Stoppers",  image: cottonLaceImg        },
      { en: "Beads",          image: resinButtonsImg      },
    ],
  },
  {
    name: "Soft Trims", slug: "soft-trims",
    image: laceImg,
    subcategories: [
      { en: "Drawcords", image: cottonLaceImg },
      { en: "Webbing",   image: laceImg       },
    ],
  },
  {
    name: "Branding Trims", slug: "branding-trims",
    image: wovenLabelImg,
    subcategories: [
      { en: "Badges",  image: wovenLabelImg },
      { en: "Patches", image: wovenLabelImg },
    ],
  },
];

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+&\s+/g, "-").replace(/\s+/g, "-");
}



// ─── Component ─────────────────────────────────────────────────────────────────
const Header = () => {
  const [isMenuOpen,         setIsMenuOpen]         = useState(false);
  const [isAboutOpen,        setIsAboutOpen]        = useState(false);
  const [isProductsOpen,     setIsProductsOpen]     = useState(false);
  const [isSegmentsOpen,     setIsSegmentsOpen]     = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [mobileAboutOpen,    setMobileAboutOpen]    = useState(false);
  const [mobileSegmentsOpen, setMobileSegmentsOpen] = useState(false);
  const [scrolled,           setScrolled]           = useState(false);
  const [aboutPreviewImage,  setAboutPreviewImage]  = useState(ABOUT_DEFAULT_PREVIEW);
  const [aboutPreviewLabel,  setAboutPreviewLabel]  = useState("Our Story");
  const [activeSegmentSlug,  setActiveSegmentSlug]  = useState("apparel");

  const { pathname } = useLocation();
  const productsTimeout = useRef<ReturnType<typeof setTimeout>>();
  const aboutTimeout    = useRef<ReturnType<typeof setTimeout>>();
  const segmentsTimeout = useRef<ReturnType<typeof setTimeout>>();
  const segmentsRef     = useRef<HTMLDivElement>(null);
  const [navLeftOffset, setNavLeftOffset] = useState(200);

  useEffect(() => {
    const update = () => {
      if (segmentsRef.current) {
        setNavLeftOffset(segmentsRef.current.getBoundingClientRect().left);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const isHeroPage    = pathname === "/";
  const isTransparent = isHeroPage && !scrolled;

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsProductsOpen(false);
    setIsAboutOpen(false);
    setIsSegmentsOpen(false);
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinks: Array<{ href: string; label: string; megaMenu?: "products" | "about" | "segments" }> = [
    { href: "/segments",        label: "Segments",        megaMenu: "segments" },
    { href: "/products",        label: "Products",        megaMenu: "products" },
    { href: "/about",           label: "About",           megaMenu: "about"    },
    { href: "/sustainability",  label: "Sustainability"  },
    { href: "/brochures",       label: "E-Collections"  },
    { href: "/designer-studio", label: "Designer Studio" },
  ];

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  // ─── Nav link class: white on transparent, black on scrolled/non-hero ──────
  const linkClass = (active: boolean) =>
    `text-[15px] font-medium tracking-[0.04em] uppercase whitespace-nowrap transition-colors duration-200 py-1 ${
      active
        ? isTransparent
          ? "text-white"
          : "text-foreground"
        : isTransparent
? "text-white hover:text-white/50"
          : "text-foreground hover:text-foreground/50"
    }`;

  const iconClass = `p-2 transition-all duration-300 ${
    isTransparent ? "text-white/80 hover:text-white" : "text-foreground hover:opacity-60"
  }`;

  const handleProductsEnter = () => { clearTimeout(productsTimeout.current); setIsProductsOpen(true);  setIsAboutOpen(false);    setIsSegmentsOpen(false); };
  const handleProductsLeave = () => { productsTimeout.current = setTimeout(() => setIsProductsOpen(false), 150); };
  const handleAboutEnter    = () => { clearTimeout(aboutTimeout.current);    setIsAboutOpen(true);     setIsProductsOpen(false); setIsSegmentsOpen(false); };
  const handleAboutLeave    = () => { aboutTimeout.current    = setTimeout(() => setIsAboutOpen(false), 150); };
  const handleSegmentsEnter = () => { clearTimeout(segmentsTimeout.current); setIsSegmentsOpen(true);  setIsProductsOpen(false); setIsAboutOpen(false);    };
  const handleSegmentsLeave = () => { segmentsTimeout.current = setTimeout(() => setIsSegmentsOpen(false), 150); };

  return (
    <>
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          isTransparent
            ? "bg-transparent border-b border-transparent shadow-none"
            : "bg-white/95 backdrop-blur-sm border-b border-[hsl(var(--border))] shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
        }`}
      >
        <div className="w-full px-10 lg:px-16 xl:px-24">
          <div className="flex items-center h-20">

            {/* Logo: state-aware for hero transparency vs scrolled white bar */}
            <Link to="/" className="inline-flex items-center justify-center px-2 py-1 transition-all duration-300">
              <div className="flex flex-col items-center justify-center leading-none">
                <span
                  className={`text-[21px] lg:text-[24px] font-bold transition-colors duration-300 ${
                    isTransparent ? "text-white" : "text-foreground"
                  }`}
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, letterSpacing: "0.04em" }}
                >
                  WIN-CYC
                </span>
                <span className={`text-[12px] lg:text-[16px] tracking-[0.12em] uppercase transition-colors duration-300 ${
                  isTransparent ? "text-white/70" : "text-foreground"
                }`}>
                  Group Limited
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center justify-center gap-8 flex-1">
              {navLinks.map((link) => {
                if (link.megaMenu === "segments") {
                  return (
                    <div key={link.href} className="relative" ref={segmentsRef} onMouseEnter={handleSegmentsEnter} onMouseLeave={handleSegmentsLeave}>
                      <button className={linkClass(false) + " flex items-center gap-1"}>
                        {link.label}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isSegmentsOpen ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  );
                }
                if (link.megaMenu === "products") {
                  return (
                    <div key={link.href} className="relative" onMouseEnter={handleProductsEnter} onMouseLeave={handleProductsLeave}>
                      <button className={linkClass(isActive(link.href)) + " flex items-center gap-1"}>
                        {link.label}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isProductsOpen ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  );
                }
                if (link.megaMenu === "about") {
                  return (
                    <div key={link.href} className="relative" onMouseEnter={handleAboutEnter} onMouseLeave={handleAboutLeave}>
                      <button className={linkClass(isActive(link.href)) + " flex items-center gap-1"}>
                        {link.label}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isAboutOpen ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  );
                }
                return (
                  <Link key={link.href} to={link.href} className={linkClass(isActive(link.href))}>
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* CTA buttons */}
            <div className="hidden lg:flex items-center space-x-3 ml-auto">
              <Link to="/contact">
                <Button
                  size="sm"
                  className={
                    isTransparent
                      ? "border border-white/60 bg-white/10 text-white hover:bg-white hover:text-foreground transition-all duration-200"
                      : "border border-border bg-transparent text-foreground/70 hover:text-foreground hover:border-foreground transition-all duration-200"
                  }
                >
                  Contact
                </Button>
              </Link>
              <Link to="/designer-studio">
                <Button
                  size="sm"
                  className={
                    isTransparent
                      ? "bg-white text-foreground border border-white/80 hover:bg-foreground hover:text-background transition-all duration-200"
                      : "bg-foreground text-background border border-foreground hover:bg-foreground/80 transition-all duration-200"
                  }
                >
                  B2B Login
                </Button>
              </Link>
            </div>

            {/* Mobile toggle */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`lg:hidden ${iconClass}`} aria-label="Toggle menu">
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Segments Mega Menu ───────────────────────────────────────────────── */}
      {isSegmentsOpen && (
        <div
          className="hidden lg:block fixed left-0 right-0 z-40"
          style={{ top: "80px" }}
          onMouseEnter={handleSegmentsEnter}
          onMouseLeave={handleSegmentsLeave}
        >
          <div className="bg-white border-b border-[hsl(var(--border))] shadow-[0_8px_24px_rgba(0,0,0,0.06)] h-[560px]">
            <div className="w-full pr-10 lg:pr-16 xl:pr-24 py-10 h-full" style={{ paddingLeft: navLeftOffset }}>
              <div className="flex gap-0 h-full">

                {/* Left: segment selector list */}
                <div className="w-[220px] flex-shrink-0 border-r border-[hsl(var(--border))] flex flex-col">
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-6 block">
                    Segments
                  </span>
                  <div className="flex flex-col gap-1">
                    {PRODUCT_SEGMENT_DETAILS.map((seg) => (
                      <button
                        key={seg.slug}
                        onMouseEnter={() => setActiveSegmentSlug(seg.slug)}
                        className={`text-left pl-3 pr-2 py-3.5 border-l-2 transition-all duration-150 ${
                          activeSegmentSlug === seg.slug
                            ? "border-foreground bg-foreground text-white"
                            : "border-transparent hover:bg-foreground hover:text-white hover:border-foreground"
                        }`}
                      >
                        <span className="text-[15px] font-semibold block leading-snug">{seg.name}</span>
                        <span className={`text-[12px] block mt-0.5 leading-snug ${activeSegmentSlug === seg.slug ? "text-white/70" : "text-muted-foreground group-hover:text-white/70"}`}>
                          {seg.slug === "apparel"  && "Garments & fashion"}
                          {seg.slug === "beauty"   && "Cosmetics & packaging"}
                          {seg.slug === "material" && "By finish & composition"}
                        </span>
                      </button>
                    ))}
                  </div>
                  {/* Designer Studio CTA */}
                  <div className="mt-auto pt-5 border-t border-[hsl(var(--border))]" style={{ marginTop: "auto" }}>
                    <Link to="/designer-studio" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors leading-snug block">
                      Custom via our<br />
                      <span className="font-semibold text-foreground">Designer Studio →</span>
                    </Link>
                  </div>
                </div>

                {/* Centre: active segment detail */}
                {(() => {
                  const active = PRODUCT_SEGMENT_DETAILS.find((s) => s.slug === activeSegmentSlug) ?? PRODUCT_SEGMENT_DETAILS[0];
                  return (
                    <div className="flex-1 px-8 flex flex-col gap-5 min-w-0 h-full">
                      <div>
                        <p className="text-[18px] font-semibold text-foreground">{active.name}</p>
                        <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">{active.tagline}</p>
                      </div>
                      <div className="flex flex-col gap-6">
                        {active.categories.map((group) => (
                          <div key={group.family}>
                            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground block mb-3">
                              {group.family}
                            </span>
                            <div className="grid gap-[6px]" style={{ gridTemplateColumns: "repeat(5, 140px)" }}>
                              {group.items.map((item) => (
                                <Link
                                  key={item}
                                  to={`/products?categories=${slugify(item)}&segments=${active.slug}`}
                                  className="w-[140px] py-3 text-[13px] text-center border border-[hsl(var(--border))] text-muted-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-colors duration-150 block"
                                >
                                  {item}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-3 border-t border-[hsl(var(--border))] mt-auto">
                        <Link
                          to={`/products?segments=${active.slug}`}
                          className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          View all {active.name} products →
                        </Link>
                      </div>
                    </div>
                  );
                })()}

                {/* Right: featured image placeholder */}
                <div className="flex-shrink-0 w-[260px] border-l border-[hsl(var(--border))] pl-6 flex flex-col">
                  <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-4 block">
                    Featured
                  </span>
                  <div className="flex-1 relative overflow-hidden bg-secondary min-h-[200px]">
                    <img
                      src={featuredSegmentImg}
                      alt="Featured fashion hardware trims"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <Link
                    to={`/products?segments=${activeSegmentSlug}`}
                    className="mt-4 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Browse all →
                  </Link>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Products Mega Menu ───────────────────────────────────────────────── */}
      {isProductsOpen && (
        <div
          className="hidden lg:block fixed left-0 right-0 z-40"
          style={{ top: "80px" }}
          onMouseEnter={handleProductsEnter}
          onMouseLeave={handleProductsLeave}
        >
          <div className="bg-white border-b border-[hsl(var(--border))] shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
            <div className="w-full pr-10 lg:pr-16 xl:pr-24 py-10" style={{ paddingLeft: navLeftOffset }}>
              <div className="flex items-start gap-10">
                {/* Hardware column */}
                <div className="flex-shrink-0 min-w-0">
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-6 block">
                    Browse by Category
                  </span>
                  {(() => {
                    const hardware = MEGA_FAMILIES[0];
                    return (
                      <div>
                        <Link
                          to={`/products?family=${hardware.slug}`}
                          className="text-[15px] font-semibold text-foreground hover:opacity-70 transition-opacity block mb-3"
                        >
                          {hardware.name}
                        </Link>
                        <ul className="space-y-2">
                          {hardware.subcategories.map((sub) => (
                            <li key={sub.en}>
                              <Link
                                to={`/products?categories=${slugify(sub.en)}`}
                                className="text-[14px] text-muted-foreground hover:text-foreground transition-colors duration-150 block"
                              >
                                {sub.en}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                </div>

                {/* Soft Trims + Branding Trims */}
                <div className="flex-shrink-0 min-w-0">
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-6 block opacity-0 pointer-events-none">
                    &nbsp;
                  </span>
                  {MEGA_FAMILIES.slice(1).map((family) => (
                    <div key={family.slug} className="mb-6 last:mb-0">
                      <Link
                        to={`/products?family=${family.slug}`}
                        className="text-[15px] font-semibold text-foreground hover:opacity-70 transition-opacity block mb-3"
                      >
                        {family.name}
                      </Link>
                      <ul className="space-y-2">
                        {family.subcategories.map((sub) => (
                          <li key={sub.en}>
                            <Link
                              to={`/products?categories=${slugify(sub.en)}`}
                              className="text-[14px] text-muted-foreground hover:text-foreground transition-colors duration-150 block"
                            >
                              {sub.en}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Static product grid collage */}
                <div className="flex-shrink-0 w-[400px] flex flex-col">
                  <div className="relative aspect-square overflow-hidden bg-secondary">
                    <img
                      src={megaProductsGrid}
                      alt="Product categories overview"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <Link
                    to="/products"
                    className="mt-4 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View All Products →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── About Mega Menu ──────────────────────────────────────────────────── */}
      {isAboutOpen && (
        <div
          className="hidden lg:block fixed left-0 right-0 z-40"
          style={{ top: "80px" }}
          onMouseEnter={handleAboutEnter}
          onMouseLeave={handleAboutLeave}
        >
          <div className="bg-white border-b border-[hsl(var(--border))] shadow-[0_8px_24px_rgba(0,0,0,0.06)] h-[560px]">
            <div className="w-full pr-10 lg:pr-16 xl:pr-24 py-10 h-full" style={{ paddingLeft: navLeftOffset }}>
              <div className="flex gap-0 h-full">
                <div className="flex-[6] pr-10 flex gap-10">
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-6 block">
                      About Us
                    </span>
                    <ul className="space-y-0">
                      {ABOUT_LINKS.map((item, i) => {
                        if (item.divider) {
                          return <li key={`divider-${i}`}><hr className="my-2 border-border" /></li>;
                        }
                        return (
                          <li key={item.href}>
                            <Link
                              to={item.href!}
                              className="text-[14px] text-muted-foreground hover:text-foreground transition-colors duration-150 block py-[7px]"
                              onMouseEnter={() => { setAboutPreviewImage(item.image!); setAboutPreviewLabel(item.label!); }}
                            >
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div
                    className="flex-1 min-w-[280px] flex flex-col"
                    onMouseEnter={() => { setAboutPreviewImage(ABOUT_DEFAULT_PREVIEW); setAboutPreviewLabel("Our Story"); }}
                  >
                    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-6 block opacity-0 pointer-events-none">
                      &nbsp;
                    </span>
                    <div className="relative flex-1 rounded-[var(--radius)] overflow-hidden">
                      <img
                        key={aboutPreviewImage}
                        src={aboutPreviewImage}
                        alt={aboutPreviewLabel}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                        style={{ animation: "fadeIn 250ms ease" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="w-px bg-[hsl(var(--border))] self-stretch" />

                <div className="flex-[4] pl-10">
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-6 block">
                    Discover
                  </span>
                  <div className="space-y-3">
                    {ABOUT_TRUST_CARDS.map((card) => (
                      <Link
                        key={card.title}
                        to={card.href}
                        className="group block rounded-[var(--radius)] border border-[hsl(var(--border))] overflow-hidden hover:border-foreground/20 hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all duration-200"
                      >
                        <div className="flex items-stretch h-[88px]">
                          <div className="w-20 flex-shrink-0 overflow-hidden">
                            <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center px-4">
                            <span className="text-[15px] font-semibold text-foreground block">{card.title}</span>
                            <span className="text-[12px] text-muted-foreground leading-snug block mt-0.5">{card.description}</span>
                          </div>
                          <div className="flex items-center pr-3">
                            <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-foreground/60 transition-colors flex-shrink-0" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-[hsl(var(--border))]">
                    <Link to="/about/our-story" className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors">
                      Learn More About Us →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer */}
      {!isHeroPage && <div className="h-20" />}

      {/* ── Mobile Navigation ────────────────────────────────────────────────── */}
      {isMenuOpen &&
        createPortal(
          <div className="lg:hidden fixed inset-0 z-[100] bg-white overflow-y-auto" style={{ animation: "slideInRight 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
            <div className="flex items-center justify-end h-20 px-6">
              <button onClick={() => setIsMenuOpen(false)} className="p-2 text-foreground hover:opacity-60 transition-opacity duration-150" aria-label="Close menu">
                <X size={22} />
              </button>
            </div>
            <nav className="flex flex-col">
              {navLinks.map((link) => {

                if (link.megaMenu === "segments") {
                  return (
                    <div key={link.href}>
                      <button onClick={() => setMobileSegmentsOpen(!mobileSegmentsOpen)} className="w-full flex items-center justify-between text-2xl font-semibold tracking-tight text-foreground hover:opacity-60 transition-opacity duration-150 py-5 px-6 border-b border-border">
                        {link.label}
                        <ChevronDown size={18} className={`transition-transform duration-200 ${mobileSegmentsOpen ? "rotate-180" : ""}`} />
                      </button>
                      {mobileSegmentsOpen && (
                        <div className="bg-secondary">
                          {PRODUCT_SEGMENT_DETAILS.map((seg) => (
                            <div key={seg.slug}>
                              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground block pt-4 pb-1 px-6">{seg.name}</span>
                              {seg.categories.flatMap((g) => g.items).slice(0, 6).map((item) => (
                                <Link key={item} to={`/products?categories=${slugify(item)}&segments=${seg.slug}`} onClick={() => setIsMenuOpen(false)} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors block py-2 px-8 border-b border-border/30">{item}</Link>
                              ))}
                              <Link to={`/products?segments=${seg.slug}`} onClick={() => setIsMenuOpen(false)} className="text-[13px] font-medium text-foreground block py-2 px-8 border-b border-border/50">All {seg.name} →</Link>
                            </div>
                          ))}
                          <Link to="/designer-studio" onClick={() => setIsMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground block py-3.5 px-6 border-b border-border">Custom via our Designer Studio →</Link>
                        </div>
                      )}
                    </div>
                  );
                }

                if (link.megaMenu === "products") {
                  return (
                    <div key={link.href}>
                      <button onClick={() => setMobileProductsOpen(!mobileProductsOpen)} className="w-full flex items-center justify-between text-2xl font-semibold tracking-tight text-foreground hover:opacity-60 transition-opacity duration-150 py-5 px-6 border-b border-border">
                        {link.label}
                        <ChevronDown size={18} className={`transition-transform duration-200 ${mobileProductsOpen ? "rotate-180" : ""}`} />
                      </button>
                      {mobileProductsOpen && (
                        <div className="bg-secondary">
                          {MEGA_FAMILIES.map((family) => (
                            <div key={family.slug}>
                              <Link to={`/products?family=${family.slug}`} onClick={() => setIsMenuOpen(false)} className="flex items-baseline gap-2 text-sm font-semibold text-foreground py-3.5 px-6 border-b border-border">{family.name}</Link>
                              {family.subcategories.map((sub) => (
                                <Link key={sub.en} to={`/products?categories=${slugify(sub.en)}`} onClick={() => setIsMenuOpen(false)} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors block py-2 px-10 border-b border-border/30">{sub.en}</Link>
                              ))}
                            </div>
                          ))}
                          <Link to="/products" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium text-foreground block py-3.5 px-6 border-b border-border">View All Products →</Link>
                        </div>
                      )}
                    </div>
                  );
                }

                if (link.megaMenu === "about") {
                  return (
                    <div key={link.href}>
                      <button onClick={() => setMobileAboutOpen(!mobileAboutOpen)} className="w-full flex items-center justify-between text-2xl font-semibold tracking-tight text-foreground hover:opacity-60 transition-opacity duration-150 py-5 px-6 border-b border-border">
                        {link.label}
                        <ChevronDown size={18} className={`transition-transform duration-200 ${mobileAboutOpen ? "rotate-180" : ""}`} />
                      </button>
                      {mobileAboutOpen && (
                        <div className="bg-secondary">
                          {ABOUT_LINKS.map((item, i) => {
                            if (item.divider) return <hr key={`mob-div-${i}`} className="border-border mx-6" />;
                            return (
                              <Link key={item.href} to={item.href!} onClick={() => setIsMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 block py-2.5 px-6 border-b border-border/30">{item.label}</Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link key={link.href} to={link.href} onClick={() => setIsMenuOpen(false)} className="text-2xl font-semibold tracking-tight text-foreground hover:opacity-60 transition-opacity duration-150 py-5 px-6 border-b border-border">
                    {link.label}
                  </Link>
                );
              })}

              <div className="px-6 pb-8 pt-6 space-y-4">
                <Link to="/contact" onClick={() => setIsMenuOpen(false)}><Button className="w-full">Contact</Button></Link>
                <Link to="/designer-studio" onClick={() => setIsMenuOpen(false)}><Button variant="outline" className="w-full">B2B Login</Button></Link>
              </div>
            </nav>
          </div>,
          document.body
        )}

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
};

export default Header;
