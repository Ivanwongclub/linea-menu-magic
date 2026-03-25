import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import LetterReveal from "@/components/ui/LetterReveal";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import aboutHeritageImage from "@/assets/about-heritage.jpg";

const About = () => {
  const { ref: storyRef, isVisible: storyVisible } = useScrollAnimation();
  const { ref: valuesHeaderRef, isVisible: valuesHeaderVisible } = useScrollAnimation();
  const { ref: valuesRef, isVisible: valuesVisible, getDelay: getValuesDelay } = useStaggeredAnimation(3, 150);
  const { ref: timelineHeaderRef, isVisible: timelineHeaderVisible } = useScrollAnimation();
  const { ref: timelineRef, isVisible: timelineVisible, getDelay: getTimelineDelay } = useStaggeredAnimation(6, 100);

  const milestones = [
    { year: "1979", event: "Founded in Hong Kong" },
    { year: "1995", event: "Expanded to mainland China" },
    { year: "2005", event: "Achieved ISO 9001 certification" },
    { year: "2015", event: "Obtained OEKO-TEX certification" },
    { year: "2020", event: "GRS & RCS certified" },
    { year: "2024", event: "Continuous innovation, serving global clients" },
  ];

  const values = [
    { title: "Quality First", desc: "Adhering to international quality standards, every product undergoes rigorous testing." },
    { title: "Innovative Design", desc: "Keeping pace with fashion trends, continuously developing innovative styles and materials." },
    { title: "Sustainability", desc: "Practising environmental responsibility, driving sustainable production methods." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <PageBreadcrumb
          segments={[
            { label: "Home", href: "/" },
            { label: "About" },
          ]}
          title="About Us"
        />

        {/* Story */}
        <section ref={storyRef} className="py-24 px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${storyVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                  Heritage
                </p>
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
                  <LetterReveal
                    text="Brand"
                    as="span"
                    className="text-outline inline-block mr-2"
                    isVisible={storyVisible}
                    startDelay={100}
                    letterDelay={80}
                  />
                  <LetterReveal
                    text="Story"
                    as="span"
                    className="inline-block"
                    isVisible={storyVisible}
                    startDelay={300}
                    letterDelay={80}
                  />
                </h2>
                <div className={`space-y-6 text-muted-foreground leading-relaxed transition-all duration-700 ease-out ${
                  storyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`} style={{ transitionDelay: '500ms' }}>
                  <p>
                    Since its founding in 1979, WIN-CYC GROUP LIMITED has been dedicated to the research, manufacturing, and supply of premium garment accessories.
                  </p>
                  <p>
                    Starting from a small factory in Hong Kong, we have grown into an international supplier serving globally renowned brands through our commitment to quality and innovation.
                  </p>
                  <p>
                    We believe that every detail can achieve perfection. Whether it is a finely crafted button or a smooth zipper, each carries our respect for craftsmanship and pursuit of beauty.
                  </p>
                </div>
              </div>
              <div className={`aspect-[4/5] bg-muted overflow-hidden rounded-lg transition-all duration-700 ease-out ${
                storyVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
              }`} style={{ transitionDelay: '300ms' }}>
                <img 
                  src={aboutHeritageImage} 
                  alt="WIN-CYC heritage craftsmanship" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-24 px-6 lg:px-8 bg-secondary overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div ref={valuesHeaderRef} className="text-center mb-16">
              <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${
                valuesHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>Our Values</p>
              <LetterReveal
                text="Core Values"
                as="h2"
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground"
                isVisible={valuesHeaderVisible}
                startDelay={100}
                letterDelay={80}
              />
            </div>

            <div ref={valuesRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <div 
                  key={value.title}
                  className={`p-8 bg-background rounded-lg text-center transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1 ${
                    valuesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                  }`}
                  style={getValuesDelay(index)}
                >
                  <h3 className="text-xl font-semibold text-foreground mb-4">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-24 px-6 lg:px-8 overflow-hidden">
          <div className="max-w-4xl mx-auto">
            <div ref={timelineHeaderRef} className="text-center mb-16">
              <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${
                timelineHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>Milestones</p>
              <LetterReveal
                text="Our Journey"
                as="h2"
                className="text-5xl md:text-6xl lg:text-7xl font-light text-foreground italic"
                isVisible={timelineHeaderVisible}
                startDelay={100}
                letterDelay={80}
              />
            </div>

            <div ref={timelineRef} className="space-y-8">
              {milestones.map((milestone, index) => (
                <div 
                  key={index} 
                  className={`flex items-start space-x-8 group transition-all duration-500 ease-out ${
                    timelineVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                  }`}
                  style={getTimelineDelay(index)}
                >
                  <div className="flex-shrink-0 w-20 text-right">
                    <span className="text-2xl font-bold text-foreground">{milestone.year}</span>
                  </div>
                  <div className="flex-shrink-0 w-px h-16 bg-border group-last:hidden" />
                  <div className="pt-1">
                    <p className="text-foreground">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
