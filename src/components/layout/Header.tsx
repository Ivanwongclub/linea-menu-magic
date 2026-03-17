import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

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

  const navLinks = [
    { href: "/products", label: "Products" },
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

  // Dynamic classes based on transparency state
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
              {navLinks.map((link) =>
                link.hasSubmenu ? (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => setIsAboutOpen(true)}
                    onMouseLeave={() => setIsAboutOpen(false)}
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
                ) : (
                  <Link key={link.href} to={link.href} className={linkClass(isActive(link.href))}>
                    {link.label}
                  </Link>
                )
              )}
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

      {/* Spacer to compensate for fixed navbar on non-hero pages */}
      {!isHeroPage && <div className="h-16" />}

      {/* Mobile Navigation */}
      {isMenuOpen &&
        createPortal(
          <div
            className="lg:hidden fixed inset-0 z-[100] bg-white"
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
              {navLinks.map((link) =>
                link.hasSubmenu ? (
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
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-2xl font-semibold tracking-tight text-foreground hover:opacity-60 transition-opacity duration-150 py-5 px-6 border-b border-border"
                  >
                    {link.label}
                  </Link>
                )
              )}
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
