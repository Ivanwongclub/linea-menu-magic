import { Link } from "react-router-dom";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";

const SustainabilitySection = () => {
  const { ref: imageRef, isVisible: imageVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: certRef, isVisible: certVisible, getDelay } = useStaggeredAnimation(4, 100);

  const certifications = [
    { name: "GRS", fullName: "Global Recycled Standard" },
    { name: "RCS", fullName: "Recycled Claim Standard" },
    { name: "OEKO-TEX", fullName: "Standard 100" },
    { name: "ISO 9001", fullName: "Quality Management" },
  ];

  return (
    <section className="py-24 px-6 lg:px-8 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Visual */}
          <div ref={imageRef} className="relative">
            <div 
              className={`aspect-square bg-secondary transition-all duration-1000 ease-out ${
                imageVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            />
            <div 
              className={`absolute inset-8 border border-border transition-all duration-700 ease-out ${
                imageVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
              }`}
              style={{ transitionDelay: '300ms' }}
            />
            {/* Animated corner accents */}
            <div 
              className={`absolute top-4 left-4 w-12 h-12 border-t border-l border-foreground/20 transition-all duration-500 ${
                imageVisible ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ transitionDelay: '500ms' }}
            />
            <div 
              className={`absolute bottom-4 right-4 w-12 h-12 border-b border-r border-foreground/20 transition-all duration-500 ${
                imageVisible ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ transitionDelay: '600ms' }}
            />
          </div>

          {/* Content */}
          <div ref={contentRef}>
            <p 
              className={`text-subtitle mb-4 transition-all duration-700 ease-out ${
                contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
            >
              Sustainability
            </p>
            <h2 
              className={`font-serif text-3xl md:text-4xl font-light text-foreground mb-6 transition-all duration-700 ease-out ${
                contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
              style={{ transitionDelay: '100ms' }}
            >
              永續願景
            </h2>
            
            <p 
              className={`text-muted-foreground leading-relaxed mb-8 transition-all duration-700 ease-out ${
                contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
              style={{ transitionDelay: '200ms' }}
            >
              我們深信，優質的產品應該對環境負責。透過國際認證的可持續製程，
              我們致力於減少生態足跡，同時維持卓越的品質標準。
            </p>

            {/* Certifications */}
            <div ref={certRef} className="grid grid-cols-2 gap-4 mb-8">
              {certifications.map((cert, index) => (
                <div 
                  key={cert.name} 
                  className={`group p-4 border border-border transition-all duration-500 ease-out hover:border-foreground hover:bg-secondary ${
                    certVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={getDelay(index)}
                >
                  <span className="text-lg font-serif text-foreground group-hover:scale-105 inline-block transition-transform duration-300">{cert.name}</span>
                  <p className="text-xs text-muted-foreground mt-1">{cert.fullName}</p>
                </div>
              ))}
            </div>

            <Link
              to="/sustainability"
              className={`group inline-flex items-center text-sm tracking-wider text-foreground link-elegant transition-all duration-700 ease-out ${
                contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
              style={{ transitionDelay: '400ms' }}
            >
              了解更多
              <svg 
                className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SustainabilitySection;