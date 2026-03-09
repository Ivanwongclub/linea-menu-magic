import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import LetterReveal from "@/components/ui/LetterReveal";

const DesignerCTA = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });

  return (
    <section ref={ref} className="py-24 px-6 lg:px-8 bg-foreground text-primary-foreground overflow-hidden">
      <div className="max-w-4xl mx-auto text-center">
        <div className={`inline-flex items-center space-x-2 mb-8 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className={`h-px bg-primary-foreground/30 transition-all duration-700 ${isVisible ? 'w-8' : 'w-0'}`} style={{ transitionDelay: '200ms' }} />
          <span className="text-xs tracking-[0.15em] uppercase text-primary-foreground/60 font-medium">Exclusive</span>
          <span className={`h-px bg-primary-foreground/30 transition-all duration-700 ${isVisible ? 'w-8' : 'w-0'}`} style={{ transitionDelay: '200ms' }} />
        </div>

        <div className="mb-6">
          <LetterReveal
            text="Designer"
            as="h2"
            className="text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-[0.15em] text-primary-foreground"
            isVisible={isVisible}
            startDelay={100}
            letterDelay={50}
          />
          <LetterReveal
            text="Studio"
            as="span"
            className="block text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-[0.15em] text-primary-foreground"
            isVisible={isVisible}
            startDelay={550}
            letterDelay={60}
          />
        </div>

        <p className={`text-primary-foreground/70 leading-relaxed max-w-2xl mx-auto mb-12 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '900ms' }}>
          Access our comprehensive trim library, explore 3D product models, and streamline your workflow with our exclusive B2B platform.
        </p>

        <Link
          to="/designer-studio"
          className={`inline-block px-12 py-4 border border-primary-foreground text-primary-foreground text-xs tracking-[0.2em] uppercase rounded-full transition-all duration-500 hover:bg-primary-foreground hover:text-foreground hover:scale-105 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ transitionDelay: '1000ms' }}
        >
          Enter Studio
        </Link>
      </div>
    </section>
  );
};

export default DesignerCTA;
