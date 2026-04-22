import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import LetterReveal from "@/components/ui/LetterReveal";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import aboutHeritageImage from "@/assets/about-heritage.jpg";

const About = () => {
  const { ref: storyRef, isVisible: storyVisible } = useScrollAnimation();
  const { ref: valuesHeaderRef, isVisible: valuesHeaderVisible } = useScrollAnimation();
  const { ref: valuesRef, isVisible: valuesVisible, getDelay: getValuesDelay } = useStaggeredAnimation(2, 150);
  const { ref: timelineHeaderRef, isVisible: timelineHeaderVisible } = useScrollAnimation();
  const { ref: timelineRef, isVisible: timelineVisible, getDelay: getTimelineDelay } = useStaggeredAnimation(9, 100);

  interface TimelineMilestone {
    year: string;
    event: string;
    isHighlight?: boolean;
    isVintage?: boolean;
  }

  const milestones: TimelineMilestone[] = [
    { year: "1979",        event: "Founded in Hong Kong — a small workshop with a vision for world-class garment trims.",             isVintage: true  },
    { year: "1990s",       event: "Manufacturing depth — a decade refining tooling, production techniques, and craft expertise.",     isVintage: true  },
    { year: "2000",        event: "ISO 9001 certified — international quality management systems formalised across all operations."               },
    { year: "2000s-2010s", event: "Global supply partner — serving leading brands across Europe, Americas & Asia Pacific."                       },
    { year: "2010s",       event: "OEM & ODM capability — concept-to-production: sampling, mould-making, volume manufacturing."                  },
    { year: "2015",        event: "Multi-location operations — Hong Kong HQ, Dongguan production, regional offices worldwide."                   },
    { year: "2020s",       event: "Integrated solutions partner — full-service design, compliance, and trim programme management."               },
    { year: "45+ Years",   event: "Sustainability commitment — recycled and eco-conscious accessories for responsible brands."                    },
    { year: "May 2026",    event: "New Era — digital transformation: catalogue, collaboration & speed.", isHighlight: true                       },
  ];

  const values = [
    { title: "Quality First", desc: "Adhering to international quality standards, every product undergoes rigorous testing." },
    { title: "Innovative Design", desc: "Keeping pace with fashion trends, continuously developing innovative styles and materials." },
  ];

  return (
    <>
        <PageBreadcrumb
          segments={[
            { label: "Home", href: "/" },
            { label: "About" },
          ]}
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
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-24 px-6 lg:px-8 bg-secondary overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div ref={valuesHeaderRef} className="mb-16">
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

            <div ref={valuesRef} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <div 
                  key={value.title}
                  className={`p-8 bg-background rounded-lg transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1 ${
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
        <section className="py-32 px-6 lg:px-8 bg-heritage overflow-hidden">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div ref={timelineHeaderRef} className="mb-24">
              <p className={`text-[11px] font-medium tracking-[0.18em] uppercase text-foreground/40 block mb-6 transition-all duration-700 ease-out ${
                timelineHeaderVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
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

            {/* Timeline rows */}
            <div ref={timelineRef} className="relative">
              {/* Spine — starts below header */}
              <div className="absolute left-[140px] top-0 bottom-0 w-px bg-foreground/30" />

              <div className="space-y-0">
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className={`relative flex items-start transition-all duration-700 ease-out ${
                      timelineVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                    } ${milestone.isHighlight ? "pt-10 pb-2" : "py-7"}`}
                    style={getTimelineDelay(index)}
                  >
                    {/* Year */}
                    <div className="w-[140px] flex-shrink-0 text-right pr-10 pt-0.5 whitespace-nowrap">
                      <span className={`font-semibold tracking-tight leading-tight block ${
                        milestone.isHighlight
                          ? "text-[18px] text-foreground"
                          : "text-[16px] text-foreground/50"
                      } ${milestone.isVintage ? "text-foreground/35" : ""}`}>
                        {milestone.year}
                      </span>
                    </div>

                    {/* Dot on spine */}
                    <div className="absolute left-[140px] top-[calc(1.75rem+1px)] -translate-x-1/2 z-10">
                      {milestone.isHighlight ? (
                        <div className="w-3 h-3 rounded-full bg-foreground" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-heritage border border-foreground/30" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pl-10">
                      {milestone.isHighlight ? (
                        <div className="border-l-2 border-foreground pl-6 py-1">
                          <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-foreground/40 block mb-2">
                            New Era · May 2026
                          </span>
                          <p className="text-[15px] font-semibold text-foreground leading-relaxed">
                            {milestone.event}
                          </p>
                        </div>
                      ) : (
                        <p className={`text-[14px] leading-relaxed ${
                          milestone.isVintage
                            ? "text-foreground/40"
                            : "text-foreground/65"
                        }`}>
                          {milestone.event}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
    </>
  );
};

export default About;
