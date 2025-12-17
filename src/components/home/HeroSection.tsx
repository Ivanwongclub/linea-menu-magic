import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-secondary">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center">
        {/* Tagline */}
        <p className="text-subtitle mb-6 animate-fade-up opacity-0 animation-delay-100">
          匠心傳承 · 始於1979
        </p>

        {/* Main Heading */}
        <h1 className="text-display text-foreground mb-6 animate-fade-up opacity-0 animation-delay-200">
          雋永工藝
          <span className="block mt-2 text-3xl md:text-4xl lg:text-5xl font-light">
            優雅從容
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-muted-foreground font-light mb-4 animate-fade-up opacity-0 animation-delay-300">
          觸動靈魂的細節之美
        </p>
        
        <p className="text-sm text-muted-foreground tracking-wider mb-12 animate-fade-up opacity-0 animation-delay-300">
          Timeless Craftsmanship in Garment Accessories
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up opacity-0 animation-delay-400">
          <Link
            to="/products"
            className="px-10 py-4 bg-foreground text-background text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:bg-primary-hover"
          >
            探索產品
          </Link>
          <Link
            to="/contact"
            className="px-10 py-4 border border-foreground text-foreground text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:bg-foreground hover:text-background"
          >
            聯絡我們
          </Link>
        </div>

        {/* Year Badge */}
        <div className="mt-20 animate-fade-up opacity-0 animation-delay-400">
          <div className="inline-flex items-center space-x-4 text-muted-foreground">
            <span className="w-12 h-px bg-border" />
            <span className="text-xs tracking-[0.3em] uppercase">Since 1979</span>
            <span className="w-12 h-px bg-border" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;