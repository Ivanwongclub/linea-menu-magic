import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import LetterReveal from "@/components/ui/LetterReveal";
import { Button } from "@/components/ui/button";

const DesignerCTA = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });

  return (
    <section ref={ref} className="section-off-white overflow-hidden">
      <div className="section-inner text-center">
        <span className={`section-label transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          Exclusive
        </span>

        <div className="mb-6">
          <LetterReveal
            text="Designer"
            as="h2"
            className="text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-[0.15em] text-foreground"
            isVisible={isVisible}
            startDelay={100}
            letterDelay={50}
          />
          <LetterReveal
            text="Studio"
            as="span"
            className="block text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-[0.15em] text-foreground"
            isVisible={isVisible}
            startDelay={550}
            letterDelay={60}
          />
        </div>

        <p className={`text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-12 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '900ms' }}>
          Access our comprehensive trim library, explore 3D product models, and streamline your workflow with our exclusive B2B platform.
        </p>

        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ transitionDelay: '1000ms' }}
        >
          <Link to="/designer-studio">
            <Button size="lg">Enter Studio</Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline" size="lg">Get in Touch</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DesignerCTA;
