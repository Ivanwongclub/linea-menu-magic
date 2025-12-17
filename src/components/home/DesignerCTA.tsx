import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const DesignerCTA = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });

  return (
    <section 
      ref={ref}
      className="py-24 px-6 lg:px-8 bg-foreground text-primary-foreground overflow-hidden"
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div 
          className={`inline-flex items-center space-x-2 mb-8 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className={`h-px bg-primary-foreground/30 transition-all duration-700 ${isVisible ? 'w-8' : 'w-0'}`} style={{ transitionDelay: '200ms' }} />
          <span className="text-xs tracking-[0.2em] uppercase text-primary-foreground/60">
            Exclusive
          </span>
          <span className={`h-px bg-primary-foreground/30 transition-all duration-700 ${isVisible ? 'w-8' : 'w-0'}`} style={{ transitionDelay: '200ms' }} />
        </div>

        {/* Heading */}
        <h2 
          className={`font-serif text-3xl md:text-4xl lg:text-5xl font-light mb-6 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '100ms' }}
        >
          Designer Studio
        </h2>
        <h3 
          className={`font-serif text-xl md:text-2xl font-light text-primary-foreground/80 mb-8 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          設計師工作室
        </h3>

        {/* Description */}
        <p 
          className={`text-primary-foreground/70 leading-relaxed max-w-2xl mx-auto mb-12 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '300ms' }}
        >
          登入專屬工作室，瀏覽完整輔料庫存，優化您的設計工作流程。
          <br />
          <span className="text-sm">
            Access our comprehensive trim library to streamline your workflow.
          </span>
        </p>

        {/* CTA */}
        <Link
          to="/designer-studio"
          className={`group inline-block px-12 py-4 border border-primary-foreground text-primary-foreground text-xs tracking-[0.2em] uppercase transition-all duration-500 hover:bg-primary-foreground hover:text-foreground hover:scale-105 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '400ms' }}
        >
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
            進入工作室
          </span>
        </Link>
      </div>
    </section>
  );
};

export default DesignerCTA;