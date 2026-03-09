import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const navLinks = [
    { href: "/products", label: "Products" },
    { href: "/about", label: "About", hasSubmenu: true },
    { href: "/sustainability", label: "Sustainability" },
    { href: "/news", label: "News" },
    { href: "/designer-studio", label: "Designer Studio" },
  ];

  const aboutSubmenu = [
    { href: "/about/our-story", label: "Our Story" },
    { href: "/about/factory", label: "Factory" },
    { href: "/about/certificates", label: "Certificates" },
    { href: "/about/sustainability", label: "Sustainability" },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="w-full sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
           {/* Logo */}
            <Link to="/" className="inline-flex items-center justify-center bg-primary px-6 py-1.5 lg:px-8 lg:py-1.5">
              <div className="flex flex-col items-center justify-center leading-none">
                <span className="text-sm lg:text-base text-white font-semibold" style={{ fontFamily: "'Libre Caslon Text', serif" }}>
                  WIN-CYC
                </span>
                    <span className="text-[7px] lg:text-xs tracking-[0.12em] text-white/60 uppercase">
                      Group Limited
                    </span>
              </div>
            </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) =>
              link.hasSubmenu ? (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => setIsAboutOpen(true)}
                  onMouseLeave={() => setIsAboutOpen(false)}
                >
                  <button
                    className={`text-sm tracking-wide transition-colors duration-200 flex items-center gap-1 ${
                      isActive(link.href) ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.label}
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isAboutOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isAboutOpen && (
                    <div className="absolute top-full left-0 pt-2 min-w-[180px] z-50">
                      <div className="bg-background border border-border shadow-lg rounded-lg py-2">
                        {aboutSubmenu.map((sub) => (
                          <Link
                            key={sub.href}
                            to={sub.href}
                            className={`block px-4 py-2 text-sm transition-colors ${
                              location.pathname === sub.href
                                ? "text-foreground bg-muted"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm tracking-wide transition-colors duration-200 ${
                    isActive(link.href) ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Right CTA buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link
              to="/contact"
              className="px-6 py-2.5 bg-primary text-primary-foreground text-xs tracking-widest uppercase rounded-full transition-all duration-300 hover:bg-primary-hover"
            >
              Contact
            </Link>
            <Link
              to="/designer-studio"
              className="px-6 py-2.5 border border-foreground text-foreground text-xs tracking-widest uppercase rounded-full transition-all duration-300 hover:bg-foreground hover:text-background"
            >
              B2B Login
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && createPortal(
        <>
          <div
            className="lg:hidden fixed inset-0 top-16 bg-black/40 z-[9998] animate-fade-in"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="lg:hidden fixed top-16 left-0 right-0 bg-background z-[9999] animate-slide-down max-h-[calc(100vh-64px)] overflow-y-auto px-6">
            <nav className="flex flex-col space-y-2 py-6">
              {navLinks.map((link, index) =>
                link.hasSubmenu ? (
                  <div
                    key={link.href}
                    className="opacity-0 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                  >
                    <button
                      onClick={() => setIsAboutOpen(!isAboutOpen)}
                      className={`w-full flex items-center justify-between text-sm tracking-wide py-2 transition-colors ${
                        isActive(link.href) ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {link.label}
                      <ChevronDown size={14} className={`transition-transform duration-200 ${isAboutOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isAboutOpen && (
                      <div className="pl-4 mt-1 space-y-1 border-l border-border ml-2">
                        {aboutSubmenu.map((sub, si) => (
                          <Link
                            key={sub.href}
                            to={sub.href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`block text-sm py-1.5 transition-colors opacity-0 animate-fade-in ${
                              location.pathname === sub.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                            }`}
                            style={{ animationDelay: `${si * 30}ms`, animationFillMode: 'forwards' }}
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
                    className={`text-sm tracking-wide py-2 transition-colors opacity-0 animate-fade-in ${
                      isActive(link.href) ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                  >
                    {link.label}
                  </Link>
                )
              )}
              <div className="flex flex-col space-y-3 pt-4 opacity-0 animate-fade-in" style={{ animationDelay: `${navLinks.length * 50}ms`, animationFillMode: 'forwards' }}>
                <Link
                  to="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className="py-3 bg-primary text-primary-foreground text-center text-xs tracking-widest uppercase rounded-full"
                >
                  Contact
                </Link>
                <Link
                  to="/designer-studio"
                  onClick={() => setIsMenuOpen(false)}
                  className="py-3 border border-foreground text-foreground text-center text-xs tracking-widest uppercase rounded-full"
                >
                  B2B Login
                </Link>
              </div>
            </nav>
          </div>
        </>,
        document.body
      )}
    </header>
  );
};

export default Header;
