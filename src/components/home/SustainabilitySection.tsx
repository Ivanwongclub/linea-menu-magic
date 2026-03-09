import { Link } from "react-router-dom";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import sustainabilityImage from "@/assets/sustainability.jpg";

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
          <div ref={imageRef} className="relative">
            <div className={`aspect-square overflow-hidden rounded-lg transition-all duration-1000 ease-out ${imageVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <img src={sustainabilityImage} alt="Sustainability" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
            </div>
          </div>

          <div ref={contentRef}>
            <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              Sustainability
            </p>
            <h2 className={`text-3xl md:text-4xl font-bold text-foreground mb-6 transition-all duration-700 ease-out ${contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`} style={{ transitionDelay: '100ms' }}>
              Our Commitment
            </h2>
            <p className={`text-muted-foreground leading-relaxed mb-8 transition-all duration-700 ease-out ${contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`} style={{ transitionDelay: '200ms' }}>
              We believe that quality products should be environmentally responsible. Through internationally certified sustainable processes, we are committed to reducing our ecological footprint while maintaining exceptional quality standards.
            </p>

            <div ref={certRef} className="grid grid-cols-2 gap-4 mb-8">
              {certifications.map((cert, index) => (
                <div
                  key={cert.name}
                  className={`group p-4 border border-border rounded-lg transition-all duration-500 ease-out hover:border-accent hover:bg-secondary ${
                    certVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={getDelay(index)}
                >
                  <span className="text-lg font-semibold text-foreground">{cert.name}</span>
                  <p className="text-xs text-muted-foreground mt-1">{cert.fullName}</p>
                </div>
              ))}
            </div>

            <Link
              to="/sustainability"
              className={`group inline-flex items-center text-sm tracking-wider text-foreground link-elegant transition-all duration-700 ease-out ${contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
              style={{ transitionDelay: '400ms' }}
            >
              Learn More
              <svg className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
