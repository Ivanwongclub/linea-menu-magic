import { Link } from "react-router-dom";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import LetterReveal from "@/components/ui/LetterReveal";
import { Button } from "@/components/ui/button";
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
    <section className="section-inverse overflow-hidden">
      <div className="section-inner">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div ref={imageRef} className="relative">
            <div className={`aspect-square overflow-hidden rounded-[var(--radius)] transition-all duration-1000 ease-out ${imageVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <img src={sustainabilityImage} alt="Sustainability" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
            </div>
          </div>

          <div ref={contentRef}>
            <span className={`section-label transition-all duration-700 ease-out ${contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              Sustainability
            </span>
            <div className={`flex items-start gap-4 mb-6`}>
              <span className={`w-1 bg-white/30 self-stretch transition-all duration-700 ${contentVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '300ms' }} />
              <div className="text-5xl md:text-6xl lg:text-7xl text-white leading-[0.9]">
                <LetterReveal
                  text="Our"
                  as="span"
                  className="font-light block"
                  isVisible={contentVisible}
                  startDelay={100}
                  letterDelay={60}
                />
                <LetterReveal
                  text="Commitment"
                  as="span"
                  className="font-bold block"
                  isVisible={contentVisible}
                  startDelay={300}
                  letterDelay={40}
                />
              </div>
            </div>
            <p className={`text-white/70 leading-relaxed mb-8 transition-all duration-700 ease-out ${contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`} style={{ transitionDelay: '600ms' }}>
              We believe that quality products should be environmentally responsible. Through internationally certified sustainable processes, we are committed to reducing our ecological footprint while maintaining exceptional quality standards.
            </p>

            <div ref={certRef} className="grid grid-cols-2 gap-4 mb-8">
              {certifications.map((cert, index) => (
                <div
                  key={cert.name}
                  className={`group p-4 border border-white/20 rounded-[var(--radius)] transition-all duration-500 ease-out hover:border-white/50 hover:bg-white/5 ${
                    certVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={getDelay(index)}
                >
                  <span className="text-lg font-semibold text-white">{cert.name}</span>
                  <p className="text-xs text-white/50 mt-1">{cert.fullName}</p>
                </div>
              ))}
            </div>

            <Link
              to="/sustainability"
              className={`transition-all duration-700 ease-out inline-block ${contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
              style={{ transitionDelay: '700ms' }}
            >
              <Button variant="outline-inverse">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SustainabilitySection;
