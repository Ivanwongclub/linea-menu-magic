import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useEffect, useState } from "react";

const HeroSection = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation({ threshold: 0.2 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const parallaxOffset = scrollY * 0.4;
  const opacityFade = Math.max(0, 1 - scrollY / 600);

  return (
    <section 
      ref={heroRef}
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-secondary"
    >
      {/* Parallax Background Layers */}
      <div 
        className="absolute inset-0 transition-transform duration-100 ease-out"
        style={{ transform: `translateY(${parallaxOffset * 0.3}px)` }}
      >
        {/* Deep background pattern */}
        <div 
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 50m-40 0a40,40 0 1,0 80,0a40,40 0 1,0 -80,0' fill='none' stroke='%23000' stroke-width='0.8'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
        />
      </div>

      <div 
        className="absolute inset-0 transition-transform duration-100 ease-out"
        style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
      >
        {/* Mid-layer pattern */}
        <div 
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.5'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Floating decorative elements with parallax */}
      <div 
        className="absolute top-20 left-[10%] w-32 h-32 border-2 border-foreground/10 rotate-45 transition-transform duration-100 ease-out"
        style={{ transform: `translateY(${parallaxOffset * 0.2}px) rotate(45deg)` }}
      />
      <div 
        className="absolute bottom-32 right-[15%] w-24 h-24 border-2 border-foreground/10 transition-transform duration-100 ease-out"
        style={{ transform: `translateY(${parallaxOffset * 0.6}px)` }}
      />
      <div 
        className="absolute top-1/3 right-[8%] w-16 h-16 bg-foreground/[0.06] transition-transform duration-100 ease-out"
        style={{ transform: `translateY(${parallaxOffset * 0.35}px)` }}
      />
      <div 
        className="absolute bottom-1/4 left-[12%] w-20 h-20 border-2 border-foreground/[0.08] rounded-full transition-transform duration-100 ease-out"
        style={{ transform: `translateY(${parallaxOffset * 0.45}px)` }}
      />

      {/* Content with fade on scroll */}
      <div 
        className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center transition-all duration-100 ease-out"
        style={{ 
          transform: `translateY(${parallaxOffset * 0.15}px)`,
          opacity: opacityFade 
        }}
      >
        {/* Tagline */}
        <p 
          className={`text-subtitle mb-6 transition-all duration-700 ease-out ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          匠心傳承 · 始於1979
        </p>

        {/* Main Heading */}
        <h1 
          className={`text-display text-foreground mb-6 transition-all duration-700 ease-out ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '400ms' }}
        >
          雋永工藝
          <span 
            className={`block mt-2 text-3xl md:text-4xl lg:text-5xl font-light transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '500ms' }}
          >
            優雅從容
          </span>
        </h1>

        {/* Subheading */}
        <p 
          className={`text-lg md:text-xl text-muted-foreground font-light mb-4 transition-all duration-700 ease-out ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '600ms' }}
        >
          觸動靈魂的細節之美
        </p>
        
        <p 
          className={`text-sm text-muted-foreground tracking-wider mb-12 transition-all duration-700 ease-out ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '700ms' }}
        >
          Timeless Craftsmanship in Garment Accessories
        </p>

        {/* CTA Buttons */}
        <div 
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 ease-out ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '800ms' }}
        >
          <Link
            to="/products"
            className="group px-10 py-4 bg-foreground text-background text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:bg-primary-hover hover:scale-105"
          >
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
              探索產品
            </span>
          </Link>
          <Link
            to="/contact"
            className="group px-10 py-4 border border-foreground text-foreground text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:bg-foreground hover:text-background hover:scale-105"
          >
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
              聯絡我們
            </span>
          </Link>
        </div>

        {/* Year Badge */}
        <div 
          className={`mt-20 transition-all duration-1000 ease-out ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '1000ms' }}
        >
          <div className="inline-flex items-center space-x-4 text-muted-foreground">
            <span className={`h-px bg-border transition-all duration-1000 ease-out ${heroVisible ? 'w-12' : 'w-0'}`} style={{ transitionDelay: '1200ms' }} />
            <span className="text-xs tracking-[0.3em] uppercase">Since 1979</span>
            <span className={`h-px bg-border transition-all duration-1000 ease-out ${heroVisible ? 'w-12' : 'w-0'}`} style={{ transitionDelay: '1200ms' }} />
          </div>
        </div>
      </div>

      {/* Scroll indicator with parallax */}
      <div 
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-700 ${
          heroVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          transitionDelay: '1400ms',
          opacity: opacityFade * 0.8,
          transform: `translateX(-50%) translateY(${parallaxOffset * 0.1}px)`
        }}
      >
        <div className="w-6 h-10 border border-muted-foreground/30 rounded-full flex justify-center">
          <div className="w-1 h-2 bg-muted-foreground/50 rounded-full mt-2 animate-bounce" />
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
};

export default HeroSection;