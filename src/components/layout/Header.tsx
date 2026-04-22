import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import { useI18n } from "@/features/i18n/I18nProvider";
import BrandWordmark from "@/components/layout/BrandWordmark";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import aboutHeritageImg from "@/assets/about-heritage-showroom.jpg";
import heritageCraftImg from "@/assets/about-heritage-showroom.jpg";
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
  { labelKey: "header.product.buttons", img: megaButtonsImg, slug: "buttons" },
  { labelKey: "header.product.snapButtons", img: megaSnapButtonsImg, slug: "snap-buttons" },
  { labelKey: "header.product.jeansButtons", img: megaJeansButtonsImg, slug: "jeans-buttons" },
  { labelKey: "header.product.shankButtons", img: megaShankButtonsImg, slug: "shank-buttons" },
  { labelKey: "header.product.buckles", img: megaBucklesImg, slug: "buckles" },
  { labelKey: "header.product.eyelets", img: megaEyeletsImg, slug: "eyelets" },
  { labelKey: "header.product.hookEyes", img: megaHookEyesImg, slug: "hook-eyes" },
  { labelKey: "header.product.rivets", img: megaRivetsImg, slug: "rivets" },
  { labelKey: "header.product.zipperPullers", img: megaZipperPullersImg, slug: "zipper-pullers" },
  { labelKey: "header.product.toggles", img: megaTogglesImg, slug: "toggles" },
  { labelKey: "header.product.cordEnds", img: megaCordEndsImg, slug: "cord-ends" },
  { labelKey: "header.product.cordStoppers", img: megaCordStoppersImg, slug: "cord-stoppers" },
  { labelKey: "header.product.beads", img: megaBeadsImg, slug: "beads" },
  { labelKey: "header.product.drawcords", img: megaDrawcordsImg, slug: "drawcords" },
  { labelKey: "header.product.badges", img: megaBadgesImg, slug: "badges" },
];


// ─── About flat link list ──────────────────────────────────────────────────────
interface AboutLink { labelKey?: string; href?: string; image?: string; divider?: true; }

const ABOUT_LINKS: AboutLink[] = [
  { labelKey: "header.about.aboutUs", href: "/about", image: aboutHeritageImg },
  { labelKey: "header.about.ourStory", href: "/about/our-story", image: aboutHeritageImg },
  { labelKey: "header.about.factory", href: "/about/factory", image: heritageCraftImg },
  { labelKey: "header.about.certificates", href: "/about/certificates", image: aboutShowroomImg },
  { labelKey: "header.about.sustainability", href: "/sustainability", image: aboutShowroomImg },
  { labelKey: "header.about.news", href: "/news", image: aboutHeritageImg },
];

const ABOUT_DEFAULT_PREVIEW = aboutHeritageImg;

const ABOUT_TRUST_CARDS = [
  {
    titleKey: "header.about.card.heritage",
    descriptionKey: "header.about.card.heritageDesc",
    href: "/about/our-story",
    image: foundersImg,
  },
  {
    titleKey: "header.about.card.manufacturing",
    descriptionKey: "header.about.card.manufacturingDesc",
    href: "/about/factory",
    image: heritageCraftImg,
  },
  {
    titleKey: "header.about.card.responsibility",
    descriptionKey: "header.about.card.responsibilityDesc",
    href: "/sustainability",
    image: aboutShowroomImg,
  },
];

// ─── Products families ─────────────────────────────────────────────────────────
const MEGA_FAMILIES = [
  {
    nameKey: "header.family.hardware", slug: "hardware",
    image: hardwareCategoryImg,
    subcategories: [
      { en: "Buttons", key: "header.product.buttons", image: metalButtonImg },
      { en: "Snap Buttons", key: "header.product.snapButtons", image: snapButtonImg },
      { en: "Jeans Buttons", key: "header.product.jeansButtons", image: engravedButtonImg },
      { en: "Shank Buttons", key: "header.product.shankButtons", image: metalButtonImg },
      { en: "Buckles", key: "header.product.buckles", image: beltBuckleImg },
      { en: "Eyelets", key: "header.product.eyelets", image: otherCategoryImg },
      { en: "Hook & Eyes", key: "header.product.hookEyes", image: metalClaspImg },
      { en: "Rivets", key: "header.product.rivets", image: otherCategoryImg },
      { en: "Zipper Pullers", key: "header.product.zipperPullers", image: metalZipperImg },
      { en: "Toggles", key: "header.product.toggles", image: otherCategoryImg },
      { en: "Cord Ends", key: "header.product.cordEnds", image: cottonLaceImg },
      { en: "Cord Stoppers", key: "header.product.cordStoppers", image: cottonLaceImg },
      { en: "Beads", key: "header.product.beads", image: resinButtonsImg },
    ],
  },
  {
    nameKey: "header.family.softTrims", slug: "soft-trims",
    image: laceImg,
    subcategories: [
      { en: "Drawcords", key: "header.product.drawcords", image: cottonLaceImg },
      { en: "Webbing", key: "header.product.webbing", image: laceImg },
    ],
  },
  {
    nameKey: "header.family.brandingTrims", slug: "branding-trims",
    image: wovenLabelImg,
    subcategories: [
      { en: "Badges", key: "header.product.badges", image: wovenLabelImg },
      { en: "Patches", key: "header.product.patches", image: wovenLabelImg },
    ],
  },
];

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+&\s+/g, "-").replace(/\s+/g, "-");
}

const NAV_LINKS: Array<{ href: string; labelKey: string; megaMenu?: "products" | "about" }> = [
  { href: "/products", labelKey: "header.nav.products", megaMenu: "products" },
  { href: "/about", labelKey: "header.nav.about", megaMenu: "about" },
  { href: "/production", labelKey: "header.nav.production" },
  { href: "/sustainability", labelKey: "header.nav.sustainability" },
  { href: "/ecollections", labelKey: "header.nav.ecatalogue" },
  { href: "/designer-studio", labelKey: "header.nav.designerStudio" },
];

// ─── Component ─────────────────────────────────────────────────────────────────
const Header = () => {
  const { t } = useI18n();
  const [isMenuOpen,         setIsMenuOpen]         = useState(false);
  const [isAboutOpen,        setIsAboutOpen]        = useState(false);
  const [isProductsOpen,     setIsProductsOpen]     = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [mobileProductFamilyOpen, setMobileProductFamilyOpen] = useState<string | null>(null);
  const [mobileAboutOpen,    setMobileAboutOpen]    = useState(false);
  const [scrolled,           setScrolled]           = useState(false);
  const [productsMegaHydrated, setProductsMegaHydrated] = useState(false);
  const [aboutMegaHydrated, setAboutMegaHydrated] = useState(false);
  const [aboutPreviewImage,  setAboutPreviewImage]  = useState(ABOUT_DEFAULT_PREVIEW);
  const [aboutPreviewLabelKey,  setAboutPreviewLabelKey]  = useState("header.about.ourStory");
  const { session, primaryBrand } = useAuth();

  const { pathname } = useLocation();
  const productsTimeout = useRef<ReturnType<typeof setTimeout>>();
  const aboutTimeout    = useRef<ReturnType<typeof setTimeout>>();
  const productsRef     = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuToggleRef = useRef<HTMLButtonElement>(null);
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
  const isTransparent = isHeroPage && !scrolled && !isProductsOpen && !isAboutOpen;
  const studioCtaHref = session ? "/designer-studio" : "/designer-studio/login";
  const studioCtaLabel = primaryBrand?.name ?? t("header.cta.b2bLogin");

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
    setMobileProductsOpen(false);
    setMobileProductFamilyOpen(null);
    setMobileAboutOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      setMobileProductsOpen(false);
      setMobileProductFamilyOpen(null);
      setMobileAboutOpen(false);
    }
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const menuRoot = mobileMenuRef.current;
    if (!menuRoot) return;

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const getFocusable = () =>
      Array.from(menuRoot.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1
      );

    const timer = window.setTimeout(() => {
      const focusable = getFocusable();
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        menuRoot.focus();
      }
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsMenuOpen(false);
        mobileMenuToggleRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || active === menuRoot) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");
  const mobileNavLinks = NAV_LINKS.filter((link) => link.href !== "/ecollections");

  // ─── Nav link class: always black for consistent readability ──────
  const linkClass = (active: boolean) =>
    `text-[15px] font-medium tracking-[0.04em] uppercase whitespace-nowrap transition-colors duration-200 py-1 text-foreground hover:text-muted-foreground`;

  const iconClass = `p-2 transition-all duration-300 text-foreground hover:text-muted-foreground`;

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
            ? "bg-transparent border-b border-transparent shadow-none"
            : "bg-background border-b border-border shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
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
                        {t(link.labelKey)}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isProductsOpen ? "rotate-180" : ""}`} />
                      </Link>
                    </div>
                  );
                }
                if (link.megaMenu === "about") {
                  return (
                    <div key={link.href} className="relative" onMouseEnter={handleAboutEnter} onMouseLeave={handleAboutLeave}>
                      <Link to="/about" onClick={closeAllMenus} className={linkClass(isActive(link.href)) + " flex items-center gap-1"}>
                        {t(link.labelKey)}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isAboutOpen ? "rotate-180" : ""}`} />
                      </Link>
                    </div>
                  );
                }
                return (
                  <Link key={link.href} to={link.href} className={linkClass(isActive(link.href))}>
                    {t(link.labelKey)}
                  </Link>
                );
              })}
            </nav>

            {/* CTA buttons */}
            <div className="hidden lg:flex items-center space-x-3 ml-auto">
              <LanguageSwitcher />
              <Link to="/contact" onClick={closeAllMenus}>
                <Button
                  size="sm"
                  className={
                    isTransparent
                      ? "border border-white/60 bg-white/10 text-white hover:bg-white hover:text-foreground hover:border-white transition-all duration-200"
                      : "border border-border bg-transparent text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-200"
                  }
                >
                  {t("header.cta.contact")}
                </Button>
              </Link>
              <Link to={studioCtaHref}>
                <Button
                  size="sm"
                  className={
                    isTransparent
                      ? "bg-white text-foreground border border-white/80 hover:bg-foreground hover:text-background transition-all duration-200"
                      : "bg-foreground text-background border border-foreground hover:bg-foreground/80 transition-all duration-200"
                  }
                >
                  <span className="max-w-[150px] truncate">{studioCtaLabel}</span>
                </Button>
              </Link>
            </div>

            {/* Mobile controls */}
            <div className="lg:hidden ml-auto flex items-center gap-1.5">
              <LanguageSwitcher compact />
              <button
                ref={mobileMenuToggleRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`flex-shrink-0 ${iconClass}`}
                aria-label={t("header.menu.toggle")}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu-panel"
              >
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
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
                            {t(hardware.nameKey)}
                          </Link>
                          <ul className="space-y-2">
                            {hardware.subcategories.map((sub) => (
                              <li key={sub.en}>
                                <Link
                                  to={`/products?category=${slugify(sub.en)}`}
                                  onClick={closeAllMenus}
                                  className="text-[14px] text-foreground hover:text-muted-foreground transition-colors duration-150 block"
                                >
                                  {t(sub.key)}
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
                          {t(family.nameKey)}
                        </Link>
                        <ul className="space-y-2">
                          {family.subcategories.map((sub) => (
                            <li key={sub.en}>
                              <Link
                                to={`/products?category=${slugify(sub.en)}`}
                                onClick={closeAllMenus}
                                className="text-[14px] text-foreground hover:text-muted-foreground transition-colors duration-150 block"
                              >
                                {t(sub.key)}
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
                              alt={t(item.labelKey)}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <span className="mt-1 text-[9px] font-medium capitalize tracking-[0.07em] text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight px-0.5 truncate">
                            {t(item.labelKey)}
                          </span>
                        </Link>
                      ))}
                    </div>
                    <Link
                      to="/products"
                      onClick={closeAllMenus}
                      className="mt-4 text-[11px] font-medium uppercase tracking-[0.1em] text-foreground hover:text-muted-foreground transition-colors"
                    >
                      {t("header.products.viewAll")}
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
                                onMouseEnter={() => { setAboutPreviewImage(item.image!); setAboutPreviewLabelKey(item.labelKey!); }}
                              >
                                {t(item.labelKey!)}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <div
                      className="flex-1 min-w-[280px] flex flex-col"
                      onMouseEnter={() => { setAboutPreviewImage(ABOUT_DEFAULT_PREVIEW); setAboutPreviewLabelKey("header.about.ourStory"); }}
                    >
                      <div className="relative flex-1 rounded-[var(--radius)] overflow-hidden">
                        <img
                          key={aboutPreviewImage}
                          src={aboutPreviewImage}
                          alt={t(aboutPreviewLabelKey)}
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
                          key={card.titleKey}
                          to={card.href}
                          onClick={closeAllMenus}
                          className="group block rounded-[var(--radius)] border border-[hsl(var(--border))] overflow-hidden hover:border-foreground/20 hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all duration-200"
                        >
                          <div className="flex items-stretch h-[88px]">
                            <div className="w-20 flex-shrink-0 overflow-hidden">
                              <img
                                src={card.image}
                                alt={t(card.titleKey)}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center px-4">
                              <span className="text-[15px] font-semibold text-foreground block">{t(card.titleKey)}</span>
                              <span className="text-[12px] text-muted-foreground leading-snug block mt-0.5">{t(card.descriptionKey)}</span>
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
                        {t("header.about.learnMore")}
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
            id="mobile-menu-panel"
            ref={mobileMenuRef}
            className="lg:hidden fixed top-20 left-0 right-0 bottom-0 z-40 bg-white overflow-y-auto border-t border-border"
            style={{ animation: "slideInDown 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
            role="dialog"
            aria-modal="true"
            aria-label={t("header.menu.toggle")}
            tabIndex={-1}
          >
            {/* Link list with collapsible sub-menus */}
            <nav className="flex flex-col flex-1">
              {mobileNavLinks.map((link) => {
                if (link.megaMenu === "products") {
                  const open = mobileProductsOpen;
                  return (
                    <div key={link.href} className="border-b border-border">
                      <button
                        type="button"
                        onClick={() => {
                          setMobileProductsOpen((v) => !v);
                          if (open) setMobileProductFamilyOpen(null);
                        }}
                        className="w-full flex items-center justify-between text-lg font-medium tracking-tight text-foreground hover:text-muted-foreground transition-colors duration-150 py-4 px-6"
                        aria-expanded={open}
                      >
                        <span>{t(link.labelKey)}</span>
                        <ChevronDown
                          size={18}
                          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                      {open && (
                        <div className="bg-secondary/40 border-t border-border">
                          <Link
                            to="/products"
                            onClick={() => setIsMenuOpen(false)}
                            className="block text-[13px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors py-3 px-6"
                          >
                            {t("header.products.viewAll")}
                          </Link>
                          {MEGA_FAMILIES.map((family) => {
                            const familyOpen = mobileProductFamilyOpen === family.slug;
                            return (
                              <div key={family.slug} className="border-t border-border">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMobileProductFamilyOpen(familyOpen ? null : family.slug)
                                  }
                                  className="w-full flex items-center justify-between text-[15px] font-semibold text-foreground hover:text-muted-foreground transition-colors py-3 px-6"
                                  aria-expanded={familyOpen}
                                >
                                  <span>{t(family.nameKey)}</span>
                                  <ChevronDown
                                    size={16}
                                    className={`transition-transform duration-200 ${familyOpen ? "rotate-180" : ""}`}
                                  />
                                </button>
                                {familyOpen && (
                                  <ul className="bg-background border-t border-border">
                                    <li>
                                      <Link
                                        to={`/products?family=${family.slug}`}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="block text-[13px] text-muted-foreground hover:text-foreground transition-colors py-2.5 px-9 italic"
                                      >
                                        {t("header.products.viewAll")}
                                      </Link>
                                    </li>
                                    {family.subcategories.map((sub) => (
                                      <li key={sub.en}>
                                        <Link
                                          to={`/products?category=${slugify(sub.en)}`}
                                          onClick={() => setIsMenuOpen(false)}
                                          className="block text-[14px] text-foreground hover:text-muted-foreground transition-colors py-2.5 px-9"
                                        >
                                          {t(sub.key)}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                if (link.megaMenu === "about") {
                  const open = mobileAboutOpen;
                  return (
                    <div key={link.href} className="border-b border-border">
                      <button
                        type="button"
                        onClick={() => setMobileAboutOpen((v) => !v)}
                        className="w-full flex items-center justify-between text-lg font-medium tracking-tight text-foreground hover:text-muted-foreground transition-colors duration-150 py-4 px-6"
                        aria-expanded={open}
                      >
                        <span>{t(link.labelKey)}</span>
                        <ChevronDown
                          size={18}
                          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                      {open && (
                        <ul className="bg-secondary/40 border-t border-border">
                          {ABOUT_LINKS.filter((l) => !l.divider && l.href && l.href !== "/sustainability").map((item) => (
                            <li key={item.href} className="border-t border-border first:border-t-0">
                              <Link
                                to={item.href!}
                                onClick={() => setIsMenuOpen(false)}
                                className="block text-[14px] text-foreground hover:text-muted-foreground transition-colors py-3 px-9"
                              >
                                {t(item.labelKey!)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-lg font-medium tracking-tight text-foreground hover:text-muted-foreground transition-colors duration-150 block py-4 px-6 border-b border-border"
                  >
                    {t(link.labelKey)}
                  </Link>
                );
              })}

              {/* CTA buttons */}
              <div className="mt-auto px-6 pb-8 pt-6 space-y-3">
                <Link to="/contact" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full">{t("header.cta.contact")}</Button>
                </Link>
                <Link to={studioCtaHref} onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    <span className="truncate">{studioCtaLabel}</span>
                  </Button>
                </Link>
              </div>
            </nav>
          </div>,
          document.body
        )}

      <style>{`
        @keyframes slideInDown { from { transform: translateY(-12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
};

export default Header;
