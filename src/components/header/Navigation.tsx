import { ArrowRight, X, Minus, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ShoppingBag from "./ShoppingBag";
import pantheonImage from "@/assets/pantheon.jpg";
import eclipseImage from "@/assets/eclipse.jpg";
import haloImage from "@/assets/halo.jpg";

interface CartItem {
  id: number;
  name: string;
  price: string;
  image: string;
  quantity: number;
  category: string;
}

const Navigation = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [offCanvasType, setOffCanvasType] = useState<'favorites' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShoppingBagOpen, setIsShoppingBagOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  
  // Shopping bag state with 3 mock items
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 1,
      name: "Metal Button MBT-001",
      price: "詢價",
      image: pantheonImage,
      quantity: 100,
      category: "Buttons"
    },
    {
      id: 2,
      name: "Metal Zipper MZ-205",
      price: "詢價", 
      image: eclipseImage,
      quantity: 50,
      category: "Zippers"
    },
    {
      id: 3,
      name: "Cotton Lace CL-088",
      price: "詢價",
      image: haloImage, 
      quantity: 200,
      category: "Lace"
    }
  ]);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(items => items.filter(item => item.id !== id));
    } else {
      setCartItems(items => 
        items.map(item => 
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  // Scroll listener for navbar transparency
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Preload dropdown images for faster display
  useEffect(() => {
    const imagesToPreload = ["/founders.png"];
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  const popularSearches = [
    "Metal Buttons",
    "YKK Zippers", 
    "Cotton Lace",
    "Belt Buckles",
    "Snap Buttons",
    "Woven Labels"
  ];
  
  const navItems = [
    {
      name: "Segments",
      href: "/products?segment=apparel",
      submenuItems: [],
      images: []
    },
    { 
      name: "Products", 
      href: "/products",
      submenuItems: [
        "Buttons",
        "Zippers", 
        "Lace",
        "Hardware",
        "Other Products"
      ],
      images: []
    },
    { 
      name: "最新動態", 
      href: "/news",
      submenuItems: [
        "行業動態",
        "產品發布",
        "認證消息",
        "合作夥伴"
      ],
      images: []
    },
    {
      name: "E-Collections",
      href: "/ecollections",
      submenuItems: [],
      images: []
    },
    { 
      name: "About", 
      href: "/about",
      submenuItems: [
        "Our Story",
        "Factory",
        "Certificates",
        "Store Locator"
      ],
      images: [
        { src: "/founders.png", alt: "Company Founders", label: "了解更多" }
      ]
    }
  ];

  const isActiveLink = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  return (
    <nav 
      className={`sticky top-0 z-50 transition-all duration-200 ease-in-out ${
        isScrolled
          ? "bg-white/95 backdrop-blur-sm border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="flex items-center justify-between h-16 px-6">
        {/* Mobile hamburger button */}
        <button
          className="lg:hidden p-2 mt-0.5 text-foreground hover:opacity-60 transition-opacity duration-150"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-[22px] h-[22px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Left navigation - Hidden on tablets and mobile */}
        <div className="hidden lg:flex gap-10">
          {navItems.map((item) => (
            <div
              key={item.name}
              className="relative"
              onMouseEnter={() => setActiveDropdown(item.name)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to={item.href}
                className={`text-xs font-medium tracking-[0.08em] uppercase transition-colors duration-150 py-5 block border-b-2 ${
                  isActiveLink(item.href)
                    ? "text-foreground border-foreground"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            </div>
          ))}
        </div>

        {/* Center logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link to="/" className="block">
            <img 
              src="/LINEA-1.svg" 
              alt="LINEA" 
              className="max-h-8 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Right icons */}
        <div className="flex items-center space-x-2">
          <button 
            className="p-2 text-foreground hover:opacity-60 transition-opacity duration-150"
            aria-label="Search"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
          <button 
            className="hidden lg:block p-2 text-foreground hover:opacity-60 transition-opacity duration-150"
            aria-label="Favorites"
            onClick={() => setOffCanvasType('favorites')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>
          <button 
            className="p-2 text-foreground hover:opacity-60 transition-opacity duration-150 relative"
            aria-label="Shopping bag"
            onClick={() => setIsShoppingBagOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[30%] text-[0.5rem] font-semibold text-foreground pointer-events-none">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Full width dropdown */}
      {activeDropdown && (
        <div 
          className="absolute top-full left-0 right-0 bg-white border border-border rounded-[var(--radius)] shadow-[0_4px_16px_rgba(0,0,0,0.08)] z-50"
          onMouseEnter={() => setActiveDropdown(activeDropdown)}
          onMouseLeave={() => setActiveDropdown(null)}
        >
          <div className="px-6 py-8">
            <div className="flex justify-between w-full">
              {/* Left side - Menu items */}
              <div className="flex-1">
                <ul className="space-y-1">
                   {navItems
                     .find(item => item.name === activeDropdown)
                     ?.submenuItems.map((subItem, index) => (
                      <li key={index}>
                        <Link 
                          to={activeDropdown === "About" 
                            ? `/about/${subItem.toLowerCase().replace(/\s+/g, '-')}` 
                            : activeDropdown === "Products"
                            ? `/category/${subItem.toLowerCase().replace(/\s+/g, '-')}`
                            : `/news`
                          }
                          className="text-sm text-foreground hover:bg-secondary transition-colors duration-150 block py-2 px-3 rounded-none"
                        >
                          {subItem}
                        </Link>
                      </li>
                   ))}
                </ul>
              </div>

              {/* Right side - Images */}
              <div className="flex space-x-6">
                {navItems
                  .find(item => item.name === activeDropdown)
                  ?.images.map((image, index) => {
                    let linkTo = "/";
                    if (activeDropdown === "About") {
                      linkTo = "/about/our-story";
                    }
                    
                    return (
                      <Link key={index} to={linkTo} className="w-[400px] h-[280px] cursor-pointer group relative overflow-hidden block rounded-[var(--radius)]">
                        <img 
                          src={image.src}
                          alt={image.alt}
                          className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-90"
                        />
                        <div className="absolute bottom-2 left-2 text-white text-xs font-light flex items-center gap-1">
                          <span>{image.label}</span>
                          <ArrowRight size={12} />
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search overlay */}
      {isSearchOpen && (
        <div 
          className="absolute top-full left-0 right-0 bg-white border border-border shadow-[0_4px_16px_rgba(0,0,0,0.08)] z-50"
        >
          <div className="px-6 py-8">
            <div className="max-w-2xl mx-auto">
              {/* Search input */}
              <div className="relative mb-8">
                <div className="flex items-center border-b border-border pb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-muted-foreground mr-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="搜尋產品..."
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-lg"
                    autoFocus
                  />
                </div>
              </div>

              {/* Popular searches */}
              <div>
                <h3 className="text-foreground text-xs font-medium tracking-[0.08em] uppercase mb-4">Popular Searches</h3>
                <div className="flex flex-wrap gap-3">
                  {popularSearches.map((search, index) => (
                    <button
                      key={index}
                      className="text-foreground hover:bg-secondary text-sm font-medium py-2 px-4 border border-border rounded-none transition-colors duration-150"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile navigation menu — full-screen slide-in from right */}
      <div
        className={`lg:hidden fixed inset-0 z-[100] bg-white transition-transform duration-300 ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Close button */}
        <div className="flex items-center justify-end h-16 px-6">
          <button
            className="p-2 text-foreground hover:opacity-60 transition-opacity duration-150"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Menu links */}
        <div className="flex flex-col flex-1">
          {navItems.map((item) => (
            <div key={item.name}>
              <Link
                to={item.href}
                className="text-2xl font-semibold tracking-tight text-foreground hover:opacity-60 transition-opacity duration-150 block py-5 px-6 border-b border-border"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
              {item.submenuItems.length > 0 && (
                <div className="bg-secondary">
                  {item.submenuItems.map((subItem, subIndex) => (
                    <Link
                      key={subIndex}
                      to={item.name === "關於我們" 
                        ? `/about/${subItem.toLowerCase().replace(/\s+/g, '-')}` 
                        : item.name === "產品"
                        ? `/category/${subItem.toLowerCase().replace(/\s+/g, '-')}`
                        : `/news`
                      }
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 block py-3 px-6 border-b border-border"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {subItem}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* CTA buttons at bottom */}
          <div className="mt-auto px-6 pb-8 pt-6 space-y-4">
            <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full">
                聯絡我們
              </Button>
            </Link>
            <Link to="/designer-studio" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full">
                Designer Studio
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Shopping Bag Component */}
      <ShoppingBag 
        isOpen={isShoppingBagOpen}
        onClose={() => setIsShoppingBagOpen(false)}
        cartItems={cartItems}
        updateQuantity={updateQuantity}
        onViewFavorites={() => {
          setIsShoppingBagOpen(false);
          setOffCanvasType('favorites');
        }}
      />
      
      {/* Favorites Off-canvas overlay */}
      {offCanvasType === 'favorites' && (
        <div className="fixed inset-0 z-50 h-screen">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 h-screen"
            onClick={() => setOffCanvasType(null)}
          />
          
          {/* Off-canvas panel */}
          <div className="absolute right-0 top-0 h-screen w-96 bg-background border-l border-border animate-slide-in-right flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-medium text-foreground">Your Favorites</h2>
              <button
                onClick={() => setOffCanvasType(null)}
                className="p-2 text-foreground hover:opacity-60 transition-opacity"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="text-muted-foreground text-sm mb-6">
                You haven't added any favorites yet. Browse our collection and click the heart icon to save items you love.
              </p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
