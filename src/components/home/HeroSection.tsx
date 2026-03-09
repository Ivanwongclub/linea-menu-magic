import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useEffect, useState } from "react";

const HeroSection = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation({ threshold: 0.2 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
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
      {/* Subtle geometric background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center"
        style={{
          transform: `translateY(${parallaxOffset * 0.15}px)`,
          opacity: opacityFade,
        }}
      >
        <p
          className={`text-subtitle mb-6 transition-all duration-700 ease-out ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          Since 1979
        </p>

        <h1
          className={`text-6xl md:text-7xl lg:text-8xl font-light tracking-tight text-foreground mb-6 transition-all duration-700 ease-out ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '400ms' }}
        >
          Timeless
          <span className="block mt-2 font-bold">Craftsmanship</span>
        </h1>

        <p
          className={`text-lg md:text-xl text-muted-foreground font-light mb-4 transition-all duration-700 ease-out ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '600ms' }}
        >
          匠心傳承 · 觸動靈魂的細節之美
        </p>

        <p
          className={`text-sm text-muted-foreground tracking-wider mb-12 transition-all duration-700 ease-out ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '700ms' }}
        >
          Premium Garment Accessories Manufacturer
        </p>

        {/* CTA Buttons — pill shaped */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 ease-out ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '800ms' }}
        >
          <Link
            to="/products"
            className="px-10 py-4 bg-primary text-primary-foreground text-xs tracking-[0.2em] uppercase rounded-full transition-all duration-300 hover:bg-primary-hover hover:scale-105"
          >
            Explore Products
          </Link>
          <Link
            to="/contact"
            className="px-10 py-4 border border-foreground text-foreground text-xs tracking-[0.2em] uppercase rounded-full transition-all duration-300 hover:bg-foreground hover:text-background hover:scale-105"
          >
            Get in Touch
          </Link>
        </div>

        {/* Accent line */}
        <div
          className={`mt-20 transition-all duration-1000 ease-out ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '1000ms' }}
        >
          <div className="inline-flex items-center space-x-4 text-muted-foreground">
            <span className={`h-px bg-accent/40 transition-all duration-1000 ease-out ${heroVisible ? 'w-12' : 'w-0'}`} style={{ transitionDelay: '1200ms' }} />
            <span className="text-xs tracking-[0.3em] uppercase">Est. 1979</span>
            <span className={`h-px bg-accent/40 transition-all duration-1000 ease-out ${heroVisible ? 'w-12' : 'w-0'}`} style={{ transitionDelay: '1200ms' }} />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-700 ${
          heroVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transitionDelay: '1400ms', opacity: opacityFade * 0.8 }}
      >
        <div className="w-6 h-10 border border-muted-foreground/30 rounded-full flex justify-center">
          <div className="w-1 h-2 bg-muted-foreground/50 rounded-full mt-2 animate-bounce" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
};

export default HeroSection;
