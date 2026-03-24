import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRODUCT_FAMILIES, PRODUCT_SEGMENTS } from "@/features/products/taxonomy";

const MEGA_FAMILIES = [
  {
    name: "Hardware",
    nameCn: "五金配件",
    slug: "hardware",
    subcategories: [
      { en: "Buttons", cn: "鈕扣" },
      { en: "Snap Buttons", cn: "啪鈕" },
      { en: "Jeans Buttons", cn: "牛仔鈕" },
      { en: "Shank Buttons", cn: "腳鈕" },
      { en: "Buckles", cn: "扣環" },
      { en: "Eyelets", cn: "雞眼" },
      { en: "Hook & Eyes", cn: "鉤眼" },
      { en: "Rivets", cn: "鉚釘" },
      { en: "Zipper Pullers", cn: "拉鏈頭" },
      { en: "Toggles", cn: "繩扣" },
      { en: "Cord Ends", cn: "繩尾夾" },
      { en: "Cord Stoppers", cn: "繩塞" },
      { en: "Beads", cn: "珠飾" },
    ],
  },
  {
    name: "Soft Trims",
    nameCn: "軟質輔料",
    slug: "soft-trims",
    subcategories: [
      { en: "Drawcords", cn: "抽繩" },
      { en: "Webbing", cn: "織帶" },
    ],
  },
  {
    name: "Branding Trims",
    nameCn: "品牌標識",
    slug: "branding-trims",
    subcategories: [
      { en: "Badges", cn: "徽章" },
      { en: "Patches", cn: "布標" },
    ],
  },
];

const MEGA_SEGMENTS = [
  { name: "Fashion", nameCn: "時裝", slug: "fashion" },
  { name: "Apparel", nameCn: "成衣", slug: "apparel" },
  { name: "Beauty", nameCn: "美妝", slug: "beauty" },
];

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+&\s+/g, "-").replace(/\s+/g, "-");
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const productsTimeout = useRef<ReturnType<typeof setTimeout>>();
  const aboutTimeout = useRef<ReturnType<typeof setTimeout>>();

  const isHeroPage = pathname === "/";
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

  // Close mega menu on route change
  useEffect(() => {
    setIsProductsOpen(false);
    setIsAboutOpen(false);
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/products", label: "Products", hasMegaMenu: true },
    { href: "/about", label: "About", hasSubmenu: true },
    { href: "/sustainability", label: "Sustainability" },
    { href: "/news", label: "News" },
    { href: "/brochures", label: "Brochures" },
    { href: "/designer-studio", label: "Designer Studio" },
  ];

  const aboutSubmenu = [
    { href: "/about/our-story", label: "Our Story" },
    { href: "/about/factory", label: "Factory" },
    { href: "/about/certificates", label: "Certificates" },
    { href: "/about/sustainability", label: "Sustainability" },
  ];

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  const linkClass = (active: boolean) =>
    `text-xs font-medium tracking-[0.08em] uppercase transition-colors duration-300 py-5 border-b-2 ${
      active
        ? isTransparent
          ? "text-white border-white/60"
          : "text-foreground border-foreground"
        : isTransparent
          ? "text-white/70 border-transparent hover:text-white"
          : "text-muted-foreground border-transparent hover:text-foreground"
    }`;

  const iconClass = `p-2 transition-all duration-300 ${
    isTransparent
      ? "text-white/80 hover:text-white"
      : "text-foreground hover:opacity-60"
  }`;

  const handleProductsEnter = () => {
    clearTimeout(productsTimeout.current);
    setIsProductsOpen(true);
    setIsAboutOpen(false);
  };
  const handleProductsLeave = () => {
    productsTimeout.current = setTimeout(() => setIsProductsOpen(false), 150);
  };
  const handleAboutEnter = () => {
    clearTimeout(aboutTimeout.current);
    setIsAboutOpen(true);
    setIsProductsOpen(false);
  };
  const handleAboutLeave = () => {
    aboutTimeout.current = setTimeout(() => setIsAboutOpen(false), 150);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          isTransparent
            ? "bg-transparent border-b border-transparent shadow-none"
            : "bg-white/95 backdrop-blur-sm border-b border-[hsl(var(--border))] shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className={`inline-flex items-center justify-center px-5 py-1 lg:px-7 lg:py-1 rounded-[var(--radius)] transition-all duration-300 ${
                isTransparent
                  ? "bg-white/20 backdrop-blur-sm"
                  : "bg-primary"
              }`}
            >
              <div className="flex flex-col items-center justify-center leading-none">
                <span
                  className={`text-xs lg:text-sm font-semibold transition-colors duration-300 ${
                    isTransparent ? "text-white" : "text-primary-foreground"
                  }`}
                  style={{ fontFamily: "'Libre Caslon Text', serif" }}
                >
                  WIN-CYC
                </span>
                <span
                  className={`text-[6px] lg:text-[8px] tracking-[0.12em] uppercase transition-colors duration-300 ${
                    isTransparent ? "text-white/80" : "text-primary-foreground"
                  }`}
                >
                  Group Limited
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => {
                if (link.hasMegaMenu) {
                  return (
                    <div
                      key={link.href}
                      className="relative"
                      onMouseEnter={handleProductsEnter}
                      onMouseLeave={handleProductsLeave}
                    >
                      <button className={linkClass(isActive(link.href)) + " flex items-center gap-1"}>
                        {link.label}
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${isProductsOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                  );
                }
                if (link.hasSubmenu) {
                  return (
                    <div
                      key={link.href}
                      className="relative"
                      onMouseEnter={handleAboutEnter}
                      onMouseLeave={handleAboutLeave}
                    >
                      <button className={linkClass(isActive(link.href)) + " flex items-center gap-1"}>
                        {link.label}
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${isAboutOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {isAboutOpen && (
                        <div className="absolute top-full left-0 pt-2 min-w-[180px] z-50">
                          <div className="bg-white border border-border shadow-[0_4px_16px_rgba(0,0,0,0.08)] rounded-[var(--radius)] py-2">
                            {aboutSubmenu.map((sub) => (
                              <Link
                                key={sub.href}
                                to={sub.href}
                                className={`block px-4 py-2 text-sm transition-colors duration-150 ${
                                  pathname === sub.href
                                    ? "text-foreground bg-secondary"
                                    : "text-foreground hover:bg-secondary"
                                }`}
                              >
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
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

            {/* Right CTA buttons */}
            <div className="hidden lg:flex items-center space-x-3">
              {isTransparent ? (
                <>
                  <Link to="/contact">
                    <Button
                      size="sm"
                      className="bg-white/20 text-white border border-white/40 hover:bg-white/30 hover:text-white"
                    >
                      Contact
                    </Button>
                  </Link>
                  <Link to="/designer-studio">
                    <Button
                      size="sm"
                      className="bg-transparent text-white border border-white/60 hover:bg-white hover:text-black"
                    >
                      B2B Login
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/contact">
                    <Button size="sm">Contact</Button>
                  </Link>
                  <Link to="/designer-studio">
                    <Button variant="outline" size="sm">B2B Login</Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`lg:hidden ${iconClass}`}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Products Mega Menu — rendered outside header for full-width */}
      {isProductsOpen && (
        <div
          className="hidden lg:block fixed left-0 right-0 z-40"
          style={{ top: "64px" }}
          onMouseEnter={handleProductsEnter}
          onMouseLeave={handleProductsLeave}
        >
          <div className="bg-white border-b border-[hsl(var(--border))] shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
              <div className="flex gap-0">
                {/* Left: Categories — ~68% */}
                <div className="flex-[7] pr-10">
                  <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-6 block">
                    Browse by Category
                  </span>
                  <div className="grid grid-cols-3 gap-x-10 gap-y-7">
                    {MEGA_FAMILIES.map((family) => (
                      <div key={family.slug}>
                        <Link
                          to={`/products?family=${family.slug}`}
                          className="text-sm font-semibold text-foreground hover:opacity-70 transition-opacity block mb-3"
                        >
                          {family.name}
                        </Link>
                        <ul className="space-y-2">
                          {family.subcategories.map((sub) => (
                            <li key={sub.en}>
                              <Link
                                to={`/products?categories=${slugify(sub.en)}`}
                                className="group text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-150 block"
                              >
                                {sub.en}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px bg-[hsl(var(--border))] self-stretch" />

                {/* Right: Segments — ~32% */}
                <div className="flex-[3] pl-10">
                  <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-6 block">
                    Browse by Segment
                  </span>
                  <ul className="space-y-4">
                    {MEGA_SEGMENTS.map((seg) => (
                      <li key={seg.slug}>
                        <Link
                          to={`/products?segments=${seg.slug}`}
                          className="group flex items-center gap-2 text-sm font-medium text-foreground hover:opacity-70 transition-opacity"
                        >
                          {seg.name}
                          <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {/* Utility link */}
                  <div className="mt-8 pt-5 border-t border-[hsl(var(--border))]">
                    <Link
                      to="/products"
                      className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      View All Products →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer to compensate for fixed navbar on non-hero pages */}
      {!isHeroPage && <div className="h-16" />}

      {/* Mobile Navigation */}
      {isMenuOpen &&
        createPortal(
          <div
            className="lg:hidden fixed inset-0 z-[100] bg-white overflow-y-auto"
            style={{
              animation: "slideInRight 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            <div className="flex items-center justify-end h-16 px-6">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-foreground hover:opacity-60 transition-opacity duration-150"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="flex flex-col">
              {navLinks.map((link) => {
                if (link.hasMegaMenu) {
                  return (
                    <div key={link.href}>
                      <button
                        onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                        className="w-full flex items-center justify-between text-2xl font-semibold tracking-tight text-foreground hover:opacity-60 transition-opacity duration-150 py-5 px-6 border-b border-border"
                      >
                        {link.label}
                        <ChevronDown
                          size={18}
                          className={`transition-transform duration-200 ${mobileProductsOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {mobileProductsOpen && (
                        <div className="bg-secondary">
                          {MEGA_FAMILIES.map((family) => (
                            <div key={family.slug}>
                              <Link
                                to={`/products?family=${family.slug}`}
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-baseline gap-2 text-sm font-semibold text-foreground py-3.5 px-6 border-b border-border"
                              >
                                {family.name}
                              </Link>
                              {family.subcategories.map((sub) => (
                                <Link
                                  key={sub.en}
                                  to={`/products?categories=${slugify(sub.en)}`}
                                  onClick={() => setIsMenuOpen(false)}
                                  className="text-[13px] text-muted-foreground hover:text-foreground transition-colors block py-2 px-10 border-b border-border/30"
                                >
                                  {sub.en}
                                </Link>
                              ))}
                            </div>
                          ))}
                          <div className="px-6 py-4 border-b border-border">
                            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground block mb-3">
                              Segments
                            </span>
                            {MEGA_SEGMENTS.map((seg) => (
                              <Link
                                key={seg.slug}
                                to={`/products?segments=${seg.slug}`}
                                onClick={() => setIsMenuOpen(false)}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors block py-2"
                              >
                                {seg.name}
                              </Link>
                            ))}
                          </div>
                          <Link
                            to="/products"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-sm font-medium text-foreground block py-3.5 px-6 border-b border-border"
                          >
                            View All Products →
                            <span className="block text-[9px] text-muted-foreground/35 mt-0.5 tracking-wide font-normal">查看所有產品</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                }
                if (link.hasSubmenu) {
                  return (
                    <div key={link.href}>
                      <button
                        onClick={() => setIsAboutOpen(!isAboutOpen)}
                        className="w-full flex items-center justify-between text-2xl font-semibold tracking-tight text-foreground hover:opacity-60 transition-opacity duration-150 py-5 px-6 border-b border-border"
                      >
                        {link.label}
                        <ChevronDown
                          size={18}
                          className={`transition-transform duration-200 ${isAboutOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {isAboutOpen && (
                        <div className="bg-secondary">
                          {aboutSubmenu.map((sub) => (
                            <Link
                              key={sub.href}
                              to={sub.href}
                              onClick={() => setIsMenuOpen(false)}
                              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 block py-3 px-6 border-b border-border"
                            >
                              {sub.label}
                            </Link>
                          ))}
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
                    className="text-2xl font-semibold tracking-tight text-foreground hover:opacity-60 transition-opacity duration-150 py-5 px-6 border-b border-border"
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="px-6 pb-8 pt-6 space-y-4">
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
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

export default Header;
