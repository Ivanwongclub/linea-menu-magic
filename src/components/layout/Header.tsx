import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRODUCT_FAMILIES } from "@/features/products/taxonomy";
import BrandWordmark from "@/components/layout/BrandWordmark";

const aboutHeritageImg = "/optimized/assets__about-heritage-480.webp?v=2";
const heritageCraftImg = "/optimized/assets__about-heritage-768.webp?v=2";
const aboutShowroomImg = "/optimized/assets__about-showroom-480.webp";
const foundersImg = "/optimized/assets__founders-480.webp";
const buttonsCategoryImg = "/optimized/assets__products__buttons-category-480.webp";
const hardwareCategoryImg = "/optimized/assets__products__hardware-category-480.webp";
const laceImg = "/optimized/assets__products__lace-category-480.webp";
const zippersCategoryImg = "/optimized/assets__products__zippers-category-480.webp";
const metalButtonImg = "/optimized/assets__products__metal-button-480.webp";
const resinButtonsImg = "/optimized/assets__products__resin-buttons-480.webp";
const snapButtonImg = "/optimized/assets__products__snap-button-480.webp";
const engravedButtonImg = "/optimized/assets__products__engraved-button-480.webp";
const beltBuckleImg = "/optimized/assets__products__belt-buckle-480.webp";
const metalClaspImg = "/optimized/assets__products__metal-clasp-480.webp";
const metalZipperImg = "/optimized/assets__products__metal-zipper-480.webp";
const cottonLaceImg = "/optimized/assets__products__cotton-lace-480.webp";
const wovenLabelImg = "/optimized/assets__products__woven-label-480.webp";
const otherCategoryImg = "/optimized/assets__products__other-category-480.webp";
const megaButtonsImg = "/images/mega/buttons.jpg";
const megaSnapButtonsImg = "/images/mega/snap-buttons.jpg";
const megaJeansButtonsImg = "/images/mega/jeans-buttons.jpg";
const megaShankButtonsImg = "/images/mega/shank-buttons.jpg";
const megaBucklesImg = "/images/mega/buckles.jpg";
const megaEyeletsImg = "/images/mega/eyelets.jpg";
const megaHookEyesImg = "/images/mega/hook-eyes.jpg";
const megaRivetsImg = "/images/mega/rivets.jpg";
const megaZipperPullersImg = "/images/mega/zipper-pullers.jpg";
const megaTogglesImg = "/images/mega/toggles.jpg";
const megaCordEndsImg = "/images/mega/cord-ends.jpg";
const megaCordStoppersImg = "/images/mega/cord-stoppers.jpg";
const megaBeadsImg = "/images/mega/beads.jpg";
const megaDrawcordsImg = "/images/mega/drawcords.jpg";
const megaBadgesImg = "/images/mega/badges.jpg";

const MEGA_GRID_ITEMS = [
  { label: "Buttons",        img: megaButtonsImg,       slug: "buttons"        },
  { label: "Snap Buttons",   img: megaSnapButtonsImg,   slug: "snap-buttons"   },
  { label: "Jeans Buttons",  img: megaJeansButtonsImg,  slug: "jeans-buttons"  },
  { label: "Shank Buttons",  img: megaShankButtonsImg,  slug: "shank-buttons"  },
  { label: "Buckles",        img: megaBucklesImg,       slug: "buckles"        },
  { label: "Eyelets",        img: megaEyeletsImg,       slug: "eyelets"        },
  { label: "Hook & Eyes",    img: megaHookEyesImg,      slug: "hook-eyes"      },
  { label: "Rivets",         img: megaRivetsImg,        slug: "rivets"         },
  { label: "Zipper Pullers", img: megaZipperPullersImg, slug: "zipper-pullers" },
  { label: "Toggles",        img: megaTogglesImg,       slug: "toggles"        },
  { label: "Cord Ends",      img: megaCordEndsImg,      slug: "cord-ends"      },
  { label: "Cord Stoppers",  img: megaCordStoppersImg,  slug: "cord-stoppers"  },
  { label: "Beads",          img: megaBeadsImg,         slug: "beads"          },
  { label: "Drawcords",      img: megaDrawcordsImg,     slug: "drawcords"      },
  { label: "Badges",         img: megaBadgesImg,        slug: "badges"         },
];


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

const NAV_LINKS: Array<{ href: string; label: string; megaMenu?: "products" | "about" }> = [
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
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [mobileAboutOpen,    setMobileAboutOpen]    = useState(false);
  const [scrolled,           setScrolled]           = useState(false);
  const [productsMegaHydrated, setProductsMegaHydrated] = useState(false);
  const [aboutMegaHydrated, setAboutMegaHydrated] = useState(false);
  const [aboutPreviewImage,  setAboutPreviewImage]  = useState(ABOUT_DEFAULT_PREVIEW);
  const [aboutPreviewLabel,  setAboutPreviewLabel]  = useState("Our Story");

  const { pathname } = useLocation();
  const productsTimeout = useRef<ReturnType<typeof setTimeout>>();
  const aboutTimeout    = useRef<ReturnType<typeof setTimeout>>();
  const productsRef     = useRef<HTMLDivElement>(null);
  const [navLeftOffset, setNavLeftOffset] = useState(200);

  useEffect(() => {
    const update = () => {
      if (productsRef.current) {
        setNavLeftOffset(productsRef.current.getBoundingClientRect().left);
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
    setIsMenuOpen(false);
  }, [pathname]);

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");
  const mobileNavLinks = NAV_LINKS.filter((link) => link.href !== "/ecollections");

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
  };
  const handleProductsLeave = () => { productsTimeout.current = setTimeout(() => setIsProductsOpen(false), 150); };
  const handleAboutEnter    = () => {
    clearTimeout(aboutTimeout.current);
    setAboutMegaHydrated(true);
    setIsAboutOpen(true);
    setIsProductsOpen(false);
  };
  const handleAboutLeave    = () => { aboutTimeout.current    = setTimeout(() => setIsAboutOpen(false), 150); };

  const closeAllMenus = useCallback(() => {
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
                if (link.megaMenu === "products") {
                  return (
                    <div key={link.href} className="relative" ref={productsRef} onMouseEnter={handleProductsEnter} onMouseLeave={handleProductsLeave}>
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

                  {/* 5×3 product image grid */}
                  <div className="flex-shrink-0 w-[500px] flex flex-col">
                    <div className="grid grid-cols-5 gap-1.5">
                      {MEGA_GRID_ITEMS.map((item) => (
                        <Link
                          key={item.slug}
                          to={`/products?category=${item.slug}`}
                          onClick={closeAllMenus}
                          className="group flex flex-col"
                        >
                          <div className="aspect-square overflow-hidden bg-secondary rounded-sm">
                            <img
                              src={item.img}
                              alt={item.label}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <span className="mt-1 text-[9px] font-medium capitalize tracking-[0.07em] text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight px-0.5 truncate">
                            {item.label}
                          </span>
                        </Link>
                      ))}
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
          <div
            className="lg:hidden fixed inset-0 z-[100] bg-white overflow-y-auto"
            style={{ animation: "slideInRight 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
          >
            {/* Header with logo + close */}
            <div className="flex items-center justify-between h-20 px-6 border-b border-border">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="inline-flex items-center">
                <BrandWordmark compact />
              </Link>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-foreground hover:text-muted-foreground transition-colors duration-150"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            {/* Link list with collapsible sub-menus */}
            <nav className="flex flex-col flex-1">
              <div className="px-6 pt-4 pb-4 border-b border-border bg-secondary/40">
                <Link
                  to="/news"
                  onClick={() => setIsMenuOpen(false)}
                  className="group flex items-center justify-between rounded-xl border border-foreground bg-foreground px-4 py-3 text-background transition-colors duration-150 hover:bg-foreground/90"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-background/70">
                      Newsroom
                    </span>
                    <span className="text-[15px] font-semibold tracking-[0.01em]">
                      Latest Updates
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-background/80 group-hover:text-background transition-colors duration-150" />
                </Link>
              </div>

              {mobileNavLinks.map((link) => {
                /* Products — collapsible */
                if (link.megaMenu === "products") {
                  return (
                    <div key={link.href}>
                      <button
                        onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                        className="w-full flex items-center justify-between text-lg font-medium tracking-tight text-foreground hover:text-muted-foreground transition-colors duration-150 py-4 px-6 border-b border-border"
                      >
                        {link.label}
                        <ChevronDown size={18} className={`transition-transform duration-200 ${mobileProductsOpen ? "rotate-180" : ""}`} />
                      </button>
                      {mobileProductsOpen && (
                        <div className="bg-secondary border-b border-border">
                          {MEGA_FAMILIES.map((family) => (
                            <div key={family.slug}>
                              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 pt-3 pb-1">{family.name}</span>
                              {family.subcategories.map((sub) => (
                                <Link
                                  key={sub.en}
                                  to={`/products?category=${slugify(sub.en)}`}
                                  onClick={() => setIsMenuOpen(false)}
                                  className="text-sm text-foreground hover:text-muted-foreground transition-colors duration-150 block py-2 px-8 border-b border-border last:border-b-0"
                                >
                                  {sub.en}
                                </Link>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                /* About — collapsible */
                if (link.megaMenu === "about") {
                  return (
                    <div key={link.href}>
                      <button
                        onClick={() => setMobileAboutOpen(!mobileAboutOpen)}
                        className="w-full flex items-center justify-between text-lg font-medium tracking-tight text-foreground hover:text-muted-foreground transition-colors duration-150 py-4 px-6 border-b border-border"
                      >
                        {link.label}
                        <ChevronDown size={18} className={`transition-transform duration-200 ${mobileAboutOpen ? "rotate-180" : ""}`} />
                      </button>
                      {mobileAboutOpen && (
                        <div className="bg-secondary border-b border-border">
                          {ABOUT_LINKS.filter(l => l.label && l.href).map((l) => (
                            <Link
                              key={l.href}
                              to={l.href!}
                              onClick={() => setIsMenuOpen(false)}
                              className="text-sm text-foreground hover:text-muted-foreground transition-colors duration-150 block py-2 px-8 border-b border-border last:border-b-0"
                            >
                              {l.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                /* Simple links */
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-lg font-medium tracking-tight text-foreground hover:text-muted-foreground transition-colors duration-150 block py-4 px-6 border-b border-border"
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* CTA buttons */}
              <div className="mt-auto px-6 pb-8 pt-6 space-y-3">
                <Link to="/contact" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full">Contact</Button>
                </Link>
                <Link to="/designer-studio" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full">B2B Login</Button>
                </Link>
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
