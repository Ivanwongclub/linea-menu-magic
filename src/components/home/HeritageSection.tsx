import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import heritageCraftsmanship from "@/assets/heritage-craftsmanship.jpg";

const HeritageSection = () => {
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: imageRef, isVisible: imageVisible } = useScrollAnimation({ threshold: 0.3 });

  return (
    <section className="py-24 px-6 lg:px-8 bg-secondary overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div ref={contentRef} className="order-2 lg:order-1">
            <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              Heritage
            </p>
            <h2 className={`text-3xl md:text-4xl font-bold text-foreground mb-6 transition-all duration-700 ease-out ${contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`} style={{ transitionDelay: '100ms' }}>
              Our Story
            </h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p className={`transition-all duration-700 ease-out ${contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`} style={{ transitionDelay: '200ms' }}>
                Since our founding in 1979, WIN-CYC GROUP has been dedicated to the research and manufacturing of premium garment accessories.
              </p>
              <p className={`transition-all duration-700 ease-out ${contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`} style={{ transitionDelay: '300ms' }}>
                From our roots in Hong Kong, we have grown into an internationally certified global supplier serving leading brands across Europe, the Americas, Japan, and Asia Pacific.
              </p>
            </div>
            <div className={`mt-8 transition-all duration-700 ease-out ${contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`} style={{ transitionDelay: '400ms' }}>
              <Link to="/about" className="group inline-flex items-center text-sm tracking-wider text-foreground link-elegant">
                Discover More
                <svg className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

          <div ref={imageRef} className="order-1 lg:order-2">
            <div className="relative">
              <div className={`aspect-[4/5] overflow-hidden rounded-lg transition-all duration-1000 ease-out ${imageVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <img src={heritageCraftsmanship} alt="Artisan craftsmanship" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
              </div>
              <div className={`absolute -bottom-6 -left-6 w-32 h-32 bg-accent text-accent-foreground flex items-center justify-center rounded-lg transition-all duration-700 ease-out ${imageVisible ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 translate-x-4 translate-y-4'}`} style={{ transitionDelay: '400ms' }}>
                <div className="text-center">
                  <span className="text-4xl font-bold">45</span>
                  <p className="text-xs tracking-wider mt-1">Years</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeritageSection;
