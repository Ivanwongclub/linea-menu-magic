import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";

type Language = 'zh-TW' | 'zh-CN' | 'en';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>('zh-TW');
  const location = useLocation();

  const languages: { code: Language; label: string }[] = [
    { code: 'zh-TW', label: '繁' },
    { code: 'zh-CN', label: '簡' },
    { code: 'en', label: 'ENG' },
  ];

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const navLinks = [
    { href: "/about", label: "關於我們", labelEn: "About", hasSubmenu: true },
    { href: "/products", label: "產品", labelEn: "Products" },
    { href: "/sustainability", label: "可持續發展", labelEn: "Sustainability" },
    { href: "/news", label: "最新動態", labelEn: "News" },
    { href: "/designer-studio", label: "設計師工作室", labelEn: "Designer Studio" },
    { href: "/contact", label: "聯絡我們", labelEn: "Contact" },
  ];

  const aboutSubmenu = [
    { href: "/about/our-story", label: "我們的故事", labelEn: "Our Story" },
    { href: "/about/factory", label: "工廠", labelEn: "Factory" },
    { href: "/about/certificates", label: "認證", labelEn: "Certificates" },
    { href: "/about/sustainability", label: "可持續發展", labelEn: "Sustainability" },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="w-full sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex flex-col items-start">
            <span className="text-lg lg:text-xl font-serif font-medium tracking-wide text-[#EC1C24]">
              WIN-CYC
            </span>
            <span className="text-[8px] lg:text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
              Group Limited
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              link.hasSubmenu ? (
                <div 
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => setIsAboutOpen(true)}
                  onMouseLeave={() => setIsAboutOpen(false)}
                >
                  <button
                    className={`text-sm tracking-wide transition-colors duration-300 link-elegant flex items-center gap-1 ${
                      isActive(link.href)
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-brand-red-muted"
                    }`}
                  >
                    {link.label}
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isAboutOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown */}
                  {isAboutOpen && (
                    <div className="absolute top-full left-0 pt-2 min-w-[180px] z-50">
                      <div className="bg-background border border-border shadow-lg py-2">
                        {aboutSubmenu.map((sublink) => (
                          <Link
                            key={sublink.href}
                            to={sublink.href}
                            className={`block px-4 py-2 text-sm transition-colors ${
                              location.pathname === sublink.href
                                ? "text-foreground bg-muted"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            {sublink.label}
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
                  className={`text-sm tracking-wide transition-colors duration-300 link-elegant ${
                    isActive(link.href)
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-brand-red-muted"
                  }`}
                >
                  {link.label}
                </Link>
              )
            ))}
          </nav>

          {/* Language Switcher & CTA Button */}
          <div className="hidden lg:flex items-center space-x-6">
            {/* Language Switcher */}
            <div className="flex items-center text-sm">
              {languages.map((lang, index) => (
                <span key={lang.code} className="flex items-center">
                  <button
                    onClick={() => setCurrentLang(lang.code)}
                    className={`transition-colors duration-200 ${
                      currentLang === lang.code
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {lang.label}
                  </button>
                  {index < languages.length - 1 && (
                    <span className="mx-1.5 text-border">丨</span>
                  )}
                </span>
              ))}
            </div>
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
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation with Backdrop - rendered via portal to escape stacking context */}
      {isMenuOpen && createPortal(
        <>
          {/* Backdrop overlay - click to close */}
          <div 
            className="lg:hidden fixed inset-0 top-14 bg-black/40 z-[9998] animate-fade-in"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu content */}
          <div className="lg:hidden fixed top-14 left-0 right-0 bg-background border-b border-border z-[9999] animate-slide-down max-h-[calc(100vh-56px)] overflow-y-auto px-6">
            {/* Mobile Language Switcher */}
            <div className="flex items-center justify-center py-3 border-b border-border opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
              {languages.map((lang, index) => (
                <span key={lang.code} className="flex items-center">
                  <button
                    onClick={() => setCurrentLang(lang.code)}
                    className={`text-sm transition-colors duration-200 ${
                      currentLang === lang.code
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {lang.label}
                  </button>
                  {index < languages.length - 1 && (
                    <span className="mx-2 text-border">丨</span>
                  )}
                </span>
              ))}
            </div>
            
            <nav className="flex flex-col space-y-2 py-4">
              {navLinks.map((link, index) => (
                link.hasSubmenu ? (
                  <div 
                    key={link.href}
                    className="opacity-0 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                  >
                    <button
                      onClick={() => setIsAboutOpen(!isAboutOpen)}
                      className={`w-full flex items-center justify-between text-sm tracking-wide py-2 transition-colors ${
                        isActive(link.href)
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span>
                        {link.label}
                        <span className="text-xs text-muted-foreground ml-2">{link.labelEn}</span>
                      </span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${isAboutOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isAboutOpen && (
                      <div className="pl-4 mt-1 space-y-1 border-l border-border ml-2">
                        {aboutSubmenu.map((sublink, subIndex) => (
                          <Link
                            key={sublink.href}
                            to={sublink.href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`block text-sm py-1.5 transition-colors opacity-0 animate-fade-in ${
                              location.pathname === sublink.href
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            style={{ animationDelay: `${subIndex * 30}ms`, animationFillMode: 'forwards' }}
                          >
                            {sublink.label}
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
                      isActive(link.href)
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }`}
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                  >
                    {link.label}
                    <span className="text-xs text-muted-foreground ml-2">
                      {link.labelEn}
                    </span>
                  </Link>
                )
              ))}
              <Link
                to="/contact"
                onClick={() => setIsMenuOpen(false)}
                className="mt-4 py-3 bg-brand-red-accent text-white text-center text-xs tracking-widest uppercase transition-all duration-300 hover:bg-foreground btn-red-glow opacity-0 animate-fade-in"
                style={{ animationDelay: `${navLinks.length * 50}ms`, animationFillMode: 'forwards' }}
              >
                獲取報價
              </Link>
            </nav>
          </div>
        </>,
        document.body
      )}
    </header>
  );
};

export default Header;