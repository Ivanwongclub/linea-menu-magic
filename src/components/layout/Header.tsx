import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { href: "/", label: "首頁", labelEn: "Home" },
    { href: "/about", label: "關於我們", labelEn: "About" },
    { href: "/products", label: "產品", labelEn: "Products" },
    { href: "/sustainability", label: "可持續發展", labelEn: "Sustainability" },
    { href: "/designer-studio", label: "設計師工作室", labelEn: "Designer Studio" },
    { href: "/contact", label: "聯絡我們", labelEn: "Contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="w-full sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex flex-col items-start">
            <span className="text-xl font-serif font-medium tracking-wide text-[#EC1C24]">
              WIN-CYC
            </span>
            <span className="text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
              Group Limited
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm tracking-wide transition-colors duration-300 link-elegant ${
                  isActive(link.href)
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-brand-red-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              to="/contact"
              className="px-6 py-2.5 bg-brand-red-accent text-white text-xs tracking-widest uppercase transition-all duration-300 hover:bg-foreground btn-red-glow"
            >
              獲取報價
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-6 border-t border-border animate-fade-in">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-sm tracking-wide py-2 transition-colors ${
                    isActive(link.href)
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                  <span className="text-xs text-muted-foreground ml-2">
                    {link.labelEn}
                  </span>
                </Link>
              ))}
              <Link
                to="/contact"
                onClick={() => setIsMenuOpen(false)}
                className="mt-4 py-3 bg-brand-red-accent text-white text-center text-xs tracking-widest uppercase transition-all duration-300 hover:bg-foreground btn-red-glow"
              >
                獲取報價
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;