import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRODUCT_FAMILIES, PRODUCT_SEGMENT_DETAILS } from "@/features/products/taxonomy";
import BrandWordmark from "@/components/layout/BrandWordmark";
import aboutHeritageImg from "@/assets/about-heritage.jpg";
import heritageCraftImg from "@/assets/heritage-craftsmanship.jpg";
import aboutShowroomImg from "@/assets/about-showroom.jpg";
import foundersImg from "@/assets/founders.jpg";

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

import megaProductsGrid from "@/assets/products/mega-products-grid.png";

// ─── About flat link list ──────────────────────────────────────────────────────
interface AboutLink { label?: string; href?: string; image?: string; divider?: true; }

const ABOUT_LINKS: AboutLink[] = [
  { label: "About Us",       href: "/about",              image: aboutHeritageImg  },
  { label: "Our Story",      href: "/about/our-story",    image: aboutHeritageImg  },
  { label: "Factory",        href: "/about/factory",      image: heritageCraftImg  },
  { label: "Certificates",   href: "/about/certificates", image: aboutShowroomImg  },
  { label: "Sustainability", href: "/sustainability",      image: aboutShowroomImg  },
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

const NAV_LINKS: Array<{ href: string; label: string; megaMenu?: "products" | "about" | "segments" }> = [
  { href: "/segments",        label: "Segments",        megaMenu: "segments" },
  { href: "/products",        label: "Products",        megaMenu: "products" },
  { href: "/about",           label: "About",           megaMenu: "about"    },
  { href: "/production",      label: "Production"      },
  { href: "/sustainability",  label: "Sustainability"  },
  { href: "/ecollections",    label: "E-Collections"  },
  { href: "/designer-studio", label: "Designer Studio" },
];

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
  const [productsMegaHydrated, setProductsMegaHydrated] = useState(false);
  const [aboutMegaHydrated, setAboutMegaHydrated] = useState(false);
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

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");

  // ─── Nav link class: white on transparent, black on scrolled/non-hero ──────
  const linkClass = (active: boolean) =>
    `text-[15px] font-medium tracking-[0.04em] uppercase whitespace-nowrap transition-colors duration-200 py-1 ${
      isTransparent
        ? "text-white hover:text-white/50"
        : "text-foreground hover:text-muted-foreground"
    }`;

  const iconClass = `p-2 transition-all duration-300 ${
    isTransparent ? "text-white/80 hover:text-white" : "text-foreground hover:text-muted-foreground"
  }`;

  const handleProductsEnter = () => {
    clearTimeout(productsTimeout.current);
    setProductsMegaHydrated(true);
    setIsProductsOpen(true);
    setIsAboutOpen(false);
    setIsSegmentsOpen(false);
  };
  const handleProductsLeave = () => { productsTimeout.current = setTimeout(() => setIsProductsOpen(false), 150); };
  const handleAboutEnter    = () => {
    clearTimeout(aboutTimeout.current);
    setAboutMegaHydrated(true);
    setIsAboutOpen(true);
    setIsProductsOpen(false);
    setIsSegmentsOpen(false);
  };
  const handleAboutLeave    = () => { aboutTimeout.current    = setTimeout(() => setIsAboutOpen(false), 150); };
  const handleSegmentsEnter = () => { clearTimeout(segmentsTimeout.current); setIsSegmentsOpen(true);  setIsProductsOpen(false); setIsAboutOpen(false);    };
  const handleSegmentsLeave = () => { segmentsTimeout.current = setTimeout(() => setIsSegmentsOpen(false), 150); };

  const closeAllMenus = useCallback(() => {
    setIsSegmentsOpen(false);
    setIsProductsOpen(false);
    setIsAboutOpen(false);
  }, []);

  return (
    <>
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          isTransparent
            ? "bg-black/20 backdrop-blur-[2px] border-b border-white/20 shadow-none"
            : "bg-white/95 backdrop-blur-sm border-b border-[hsl(var(--border))] shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-16 xl:px-24">
          <div className="flex items-center h-20 gap-3">

            {/* Logo: single shared wordmark component (always black) */}
            <Link to="/" className="inline-flex items-center justify-center px-2 py-1 transition-all duration-300 flex-shrink-0">
              <BrandWordmark />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center justify-center gap-8 flex-1">
              {NAV_LINKS.map((link) => {
                if (link.megaMenu === "segments") {
                  return (
                    <div key={link.href} className="relative" ref={segmentsRef} onMouseEnter={handleSegmentsEnter} onMouseLeave={handleSegmentsLeave}>
                      <Link to="/products?segment=apparel" onClick={closeAllMenus} className={linkClass(false) + " flex items-center gap-1"}>
                        {link.label}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isSegmentsOpen ? "rotate-180" : ""}`} />
                      </Link>
                    </div>
                  );
                }
                if (link.megaMenu === "products") {
                  return (
                    <div key={link.href} className="relative" onMouseEnter={handleProductsEnter} onMouseLeave={handleProductsLeave}>
                      <Link to="/products" onClick={closeAllMenus} className={linkClass(isActive(link.href)) + " flex items-center gap-1"}>
                        {link.label}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isProductsOpen ? "rotate-180" : ""}`} />
                      </Link>
                    </div>
                  );
                }
                if (link.megaMenu === "about") {
                  return (
                    <div key={link.href} className="relative" onMouseEnter={handleAboutEnter} onMouseLeave={handleAboutLeave}>
                      <Link to="/about" onClick={closeAllMenus} className={linkClass(isActive(link.href)) + " flex items-center gap-1"}>
                        {link.label}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isAboutOpen ? "rotate-180" : ""}`} />
                      </Link>
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
              <Link to="/contact" onClick={closeAllMenus}>
                <Button
                  size="sm"
                  className={
                    isTransparent
                      ? "border border-white/60 bg-white/10 text-white hover:bg-white hover:text-foreground hover:border-white transition-all duration-200"
                      : "border border-border bg-transparent text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-200"
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
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`lg:hidden ml-auto flex-shrink-0 ${iconClass}`} aria-label="Toggle menu">
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Segments Mega Menu ───────────────────────────────────────────────── */}
      <div
        className="hidden lg:block fixed left-0 right-0 z-40"
        style={{ top: "80px", pointerEvents: isSegmentsOpen ? "auto" : "none" }}
        onMouseEnter={handleSegmentsEnter}
        onMouseLeave={handleSegmentsLeave}
      >
        <div className={`transition-all duration-200 ease-out ${
          isSegmentsOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
        }`}>
          <div className="bg-white border-b-[3px] border-b-foreground shadow-mega h-[660px]">
            <div className="w-full pr-10 lg:pr-16 xl:pr-24 py-10 h-full" style={{ paddingLeft: navLeftOffset }}>
              <div className="flex gap-0 h-full">

                {/* Left: segment selector list */}
                <div className="w-[220px] flex-shrink-0 border-r border-[hsl(var(--border))] flex flex-col">
                  <div className="flex flex-col gap-1">
                    {PRODUCT_SEGMENT_DETAILS.map((seg) => (
                      <button
                        key={seg.slug}
                        onMouseEnter={() => setActiveSegmentSlug(seg.slug)}
                        className={`group text-left pl-3 pr-2 py-3.5 border-l-2 transition-all duration-150 ${
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
                    <Link to="/designer-studio" onClick={closeAllMenus} className="text-[12px] text-foreground hover:text-muted-foreground transition-colors leading-snug block">
                      Custom via our<br />
                      <span className="font-semibold text-foreground">Designer Studio →</span>
                    </Link>
                  </div>
                </div>

                {/* Centre: active segment detail */}
                {(() => {
                  const active = PRODUCT_SEGMENT_DETAILS.find((s) => s.slug === activeSegmentSlug) ?? PRODUCT_SEGMENT_DETAILS[0];
                  return (
                    <div className="flex-1 px-8 flex flex-col gap-5 min-w-0 h-full overflow-y-auto">
                      <div>
                        <p className="text-[18px] font-semibold text-foreground">{active.name}</p>
                        <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">{active.tagline}</p>
                      </div>
                      <div className="flex flex-col gap-6">
                        {active.categories.map((group) => (
                          <div key={group.family}>
                            <span className="text-[14px] font-semibold capitalize tracking-[0.10em] text-foreground block mb-3">
                              {group.family}
                            </span>
                            <div className="grid gap-[6px]" style={{ gridTemplateColumns: "repeat(5, 140px)" }}>
                              {group.items.map((item) => (
                                <Link
                                  key={item}
                                  to={`/products?category=${slugify(item)}&segment=${active.slug}`}
                                  onClick={closeAllMenus}
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
                          to={`/products?segment=${active.slug}`}
                          onClick={closeAllMenus}
                          className="text-[11px] font-medium uppercase tracking-[0.1em] text-foreground hover:text-muted-foreground transition-colors"
                        >
                          View all {active.name} products →
                        </Link>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Products Mega Menu ───────────────────────────────────────────────── */}
      <div
        className="hidden lg:block fixed left-0 right-0 z-40"
        style={{ top: "80px", pointerEvents: isProductsOpen ? "auto" : "none" }}
        onMouseEnter={handleProductsEnter}
        onMouseLeave={handleProductsLeave}
      >
        {productsMegaHydrated && (
          <div className={`transition-all duration-200 ease-out ${
            isProductsOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
          }`}>
            <div className="bg-white border-b-[3px] border-b-foreground shadow-mega">
              <div className="w-full pr-10 lg:pr-16 xl:pr-24 py-10" style={{ paddingLeft: navLeftOffset }}>
                <div className="flex items-start gap-10">
                  {/* Hardware column */}
                  <div className="flex-shrink-0 min-w-0">
                    {(() => {
                      const hardware = MEGA_FAMILIES[0];
                      return (
                        <div>
                          <Link
                            to={`/products?family=${hardware.slug}`}
                            onClick={closeAllMenus}
                            className="text-[15px] font-semibold text-foreground hover:text-muted-foreground transition-colors block mb-3"
                          >
                            {hardware.name}
                          </Link>
                          <ul className="space-y-2">
                            {hardware.subcategories.map((sub) => (
                              <li key={sub.en}>
                                <Link
                                  to={`/products?category=${slugify(sub.en)}`}
                                  onClick={closeAllMenus}
                                  className="text-[14px] text-foreground hover:text-muted-foreground transition-colors duration-150 block"
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
                    {MEGA_FAMILIES.slice(1).map((family) => (
                      <div key={family.slug} className="mb-6 last:mb-0">
                        <Link
                          to={`/products?family=${family.slug}`}
                          onClick={closeAllMenus}
                          className="text-[15px] font-semibold text-foreground hover:text-muted-foreground transition-colors block mb-3"
                        >
                          {family.name}
                        </Link>
                        <ul className="space-y-2">
                          {family.subcategories.map((sub) => (
                            <li key={sub.en}>
                              <Link
                                to={`/products?category=${slugify(sub.en)}`}
                                onClick={closeAllMenus}
                                className="text-[14px] text-foreground hover:text-muted-foreground transition-colors duration-150 block"
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
                        decoding="async"
                      />
                    </div>
                    <Link
                      to="/products"
                      onClick={closeAllMenus}
                      className="mt-4 text-[11px] font-medium uppercase tracking-[0.1em] text-foreground hover:text-muted-foreground transition-colors"
                    >
                      View All Products →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── About Mega Menu ──────────────────────────────────────────────────── */}
      <div
        className="hidden lg:block fixed left-0 right-0 z-40"
        style={{ top: "80px", pointerEvents: isAboutOpen ? "auto" : "none" }}
        onMouseEnter={handleAboutEnter}
        onMouseLeave={handleAboutLeave}
      >
        {aboutMegaHydrated && (
          <div className={`transition-all duration-200 ease-out ${
            isAboutOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
          }`}>
            <div className="bg-white border-b-[3px] border-b-foreground shadow-mega h-[560px]">
              <div className="w-full pr-10 lg:pr-16 xl:pr-24 py-10 h-full" style={{ paddingLeft: navLeftOffset }}>
                <div className="flex gap-0 h-full">
                  <div className="flex-[6] pr-10 flex gap-10">
                    <div className="min-w-0">
                      <ul className="space-y-0">
                        {ABOUT_LINKS.map((item, i) => {
                          if (item.divider) {
                            return <li key={`divider-${i}`}><hr className="my-2 border-border" /></li>;
                          }
                          return (
                            <li key={item.href}>
                              <Link
                                to={item.href!}
                                onClick={closeAllMenus}
                                className="text-[15px] font-semibold text-foreground hover:text-muted-foreground transition-colors duration-150 block py-[7px]"
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
                      <div className="relative flex-1 rounded-[var(--radius)] overflow-hidden">
                        <img
                          key={aboutPreviewImage}
                          src={aboutPreviewImage}
                          alt={aboutPreviewLabel}
                          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                          style={{ animation: "fadeIn 250ms ease" }}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="w-px bg-[hsl(var(--border))] self-stretch" />

                  <div className="flex-[4] pl-10">
                    <div className="space-y-3">
                      {ABOUT_TRUST_CARDS.map((card) => (
                        <Link
                          key={card.title}
                          to={card.href}
                          onClick={closeAllMenus}
                          className="group block rounded-[var(--radius)] border border-[hsl(var(--border))] overflow-hidden hover:border-foreground/20 hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all duration-200"
                        >
                          <div className="flex items-stretch h-[88px]">
                            <div className="w-20 flex-shrink-0 overflow-hidden">
                              <img
                                src={card.image}
                                alt={card.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                decoding="async"
                              />
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
                      <Link to="/about/our-story" onClick={closeAllMenus} className="text-[11px] font-medium uppercase tracking-[0.1em] text-foreground hover:text-muted-foreground transition-colors">
                        Learn More About Us →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spacer */}
      {!isHeroPage && <div className="h-20" />}

      {/* ── Mobile Navigation ────────────────────────────────────────────────── */}
      {isMenuOpen &&
        createPortal(
          <div className="lg:hidden fixed inset-0 z-[100] bg-white overflow-y-auto" style={{ animation: "slideInRight 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border">
              <div className="relative flex items-center justify-center h-20 px-4 sm:px-6">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="inline-flex items-center justify-center px-2 py-1">
                  <div className="flex flex-col items-center leading-none select-none">
                    <span className="text-[22px] sm:text-[26px] font-extrabold tracking-[0.06em] text-foreground">
                      WIN-CYC
                    </span>
                    <span className="text-[10px] sm:text-[12px] tracking-[0.12em] uppercase text-foreground">
                      Group Limited
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="absolute right-4 sm:right-6 p-2 text-foreground hover:text-muted-foreground transition-colors duration-150"
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>
            </div>
            <nav className="flex flex-col">
              <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-border/70 bg-white">
                <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Quick Access</p>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <Link to="/products" onClick={() => setIsMenuOpen(false)} className="rounded-xl border border-border/70 bg-white px-3 py-2.5 text-[12px] font-medium tracking-[0.01em] text-foreground/90 text-center">Products</Link>
                  <Link to="/ecollections" onClick={() => setIsMenuOpen(false)} className="rounded-xl border border-border/70 bg-white px-3 py-2.5 text-[12px] font-medium tracking-[0.01em] text-foreground/90 text-center">E-Collections</Link>
                  <Link to="/news" onClick={() => setIsMenuOpen(false)} className="rounded-xl border border-border/70 bg-white px-3 py-2.5 text-[12px] font-medium tracking-[0.01em] text-foreground/90 text-center">News</Link>
                  <Link to="/about/our-story" onClick={() => setIsMenuOpen(false)} className="rounded-xl border border-border/70 bg-white px-3 py-2.5 text-[12px] font-medium tracking-[0.01em] text-foreground/90 text-center">Our Story</Link>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-5 space-y-2.5">
                {NAV_LINKS.map((link) => {
                  const triggerBaseClass = "w-full flex items-center justify-between text-left text-[16px] font-medium tracking-[0.01em] text-foreground hover:text-muted-foreground transition-colors duration-150 px-4 py-3.5";

                  if (link.megaMenu === "segments") {
                    return (
                      <div key={link.href} className="rounded-2xl border border-border/70 bg-white overflow-hidden">
                        <button onClick={() => setMobileSegmentsOpen(!mobileSegmentsOpen)} className={triggerBaseClass}>
                          {link.label}
                          <ChevronDown size={17} className={`transition-transform duration-200 ${mobileSegmentsOpen ? "rotate-180" : ""}`} />
                        </button>
                        {mobileSegmentsOpen && (
                          <div className="border-t border-border/60 bg-white px-3.5 pb-3.5 pt-2.5 space-y-2.5">
                            {PRODUCT_SEGMENT_DETAILS.map((seg) => {
                              const sampleItems = seg.categories.flatMap((g) => g.items).slice(0, 3);
                              return (
                                <div key={seg.slug} className="rounded-xl border border-border/60 bg-white p-3.5">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-foreground">{seg.name}</p>
                                      <p className="text-[11px] text-muted-foreground/90 mt-1 leading-relaxed">{seg.tagline}</p>
                                    </div>
                                    <Link to={`/products?segment=${seg.slug}`} onClick={() => setIsMenuOpen(false)} className="text-[11px] font-medium text-foreground/90 whitespace-nowrap">
                                      Explore →
                                    </Link>
                                  </div>
                                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                                    {sampleItems.map((item) => (
                                      <Link
                                        key={item}
                                        to={`/products?category=${slugify(item)}&segment=${seg.slug}`}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-[11px] text-muted-foreground hover:text-foreground border border-border/70 rounded-full px-2.5 py-1 transition-colors"
                                      >
                                        {item}
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                            <Link to="/designer-studio" onClick={() => setIsMenuOpen(false)} className="block rounded-xl border border-border/70 bg-white px-3.5 py-2.5 text-[12px] font-medium text-foreground">
                              Custom via Designer Studio →
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (link.megaMenu === "products") {
                    return (
                      <div key={link.href} className="rounded-2xl border border-border/70 bg-white overflow-hidden">
                        <button onClick={() => setMobileProductsOpen(!mobileProductsOpen)} className={triggerBaseClass}>
                          {link.label}
                          <ChevronDown size={17} className={`transition-transform duration-200 ${mobileProductsOpen ? "rotate-180" : ""}`} />
                        </button>
                        {mobileProductsOpen && (
                          <div className="border-t border-border/60 bg-white px-3.5 pb-3.5 pt-2.5 space-y-2.5">
                            {MEGA_FAMILIES.map((family) => (
                              <div key={family.slug} className="rounded-xl border border-border/60 bg-white p-3.5">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-[12px] font-semibold text-foreground">{family.name}</p>
                                  <Link to={`/products?family=${family.slug}`} onClick={() => setIsMenuOpen(false)} className="text-[11px] font-medium text-foreground/90 whitespace-nowrap">
                                    View →
                                  </Link>
                                </div>
                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                  {family.subcategories.slice(0, 4).map((sub) => (
                                    <Link
                                      key={sub.en}
                                      to={`/products?category=${slugify(sub.en)}`}
                                      onClick={() => setIsMenuOpen(false)}
                                      className="text-[11px] text-muted-foreground hover:text-foreground border border-border/70 rounded-full px-2.5 py-1 transition-colors"
                                    >
                                      {sub.en}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <Link to="/products" onClick={() => setIsMenuOpen(false)} className="block rounded-xl border border-border/70 bg-white px-3.5 py-2.5 text-[12px] font-medium text-foreground">
                              View All Products →
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (link.megaMenu === "about") {
                    return (
                      <div key={link.href} className="rounded-2xl border border-border/70 bg-white overflow-hidden">
                        <button onClick={() => setMobileAboutOpen(!mobileAboutOpen)} className={triggerBaseClass}>
                          {link.label}
                          <ChevronDown size={17} className={`transition-transform duration-200 ${mobileAboutOpen ? "rotate-180" : ""}`} />
                        </button>
                        {mobileAboutOpen && (
                          <div className="border-t border-border/60 bg-white px-3.5 pb-3.5 pt-2.5">
                            <div className="grid grid-cols-2 gap-2.5">
                              {ABOUT_LINKS.filter((item) => !item.divider).map((item) => (
                                <Link
                                  key={item.href}
                                  to={item.href!}
                                  onClick={() => setIsMenuOpen(false)}
                                  className="rounded-xl border border-border/70 bg-white px-3 py-2.5 text-[12px] font-medium text-foreground/90 text-center hover:text-muted-foreground transition-colors"
                                >
                                  {item.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between rounded-2xl border border-border/70 bg-white px-4 py-3.5 text-[16px] font-medium tracking-[0.01em] text-foreground hover:text-muted-foreground transition-colors duration-150"
                    >
                      <span>{link.label}</span>
                      <ChevronRight size={16} className="text-muted-foreground/50" />
                    </Link>
                  );
                })}
              </div>

              <div className="px-4 sm:px-6 pb-8 pt-4 space-y-3 border-t border-border/70 bg-white">
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
