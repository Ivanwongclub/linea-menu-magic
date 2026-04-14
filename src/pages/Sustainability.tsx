import { Leaf, Recycle, Factory, TreePine, Wind, Droplets, Sun, ArrowRight } from "lucide-react";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import LetterReveal from "@/components/ui/LetterReveal";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import bottleImg from "@/assets/sustainability-bottle.jpg";
import forestImg from "@/assets/sustainability-forest.jpg";
import recycledMetalImg from "@/assets/sustainability-recycled-metal.jpg";
import natureImg from "@/assets/sustainability-nature.jpg";
import ecoProcessImg from "@/assets/sustainability-eco-process.jpg";
import carbonImg from "@/assets/sustainability-carbon.jpg";
import zeroWasteImg from "@/assets/sustainability-zero-waste.jpg";

const Sustainability = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: initHeaderRef, isVisible: initHeaderVisible } = useScrollAnimation();
  const { ref: initRef, isVisible: initVisible, getDelay: getInitDelay } = useStaggeredAnimation(4, 150);
  const { ref: greenRef, isVisible: greenVisible } = useScrollAnimation();
  const { ref: circularRef, isVisible: circularVisible } = useScrollAnimation();
  const { ref: ecoRef, isVisible: ecoVisible } = useScrollAnimation();

  const initiatives = [
    {
      icon: Recycle,
      title: "Recycled Materials",
      description: "GRS-certified recycled polyester and metals reduce raw material consumption across our supply chain.",
      image: recycledMetalImg,
    },
    {
      icon: Factory,
      title: "Eco-friendly Process",
      description: "Advanced eco-friendly plating technology reduces harmful chemical emissions in production.",
      image: ecoProcessImg,
    },
    {
      icon: Leaf,
      title: "Carbon Footprint",
      description: "Continuously monitoring and reducing carbon emissions across all production processes.",
      image: carbonImg,
    },
    {
      icon: TreePine,
      title: "Zero Waste Policy",
      description: "Committed to eliminating production waste to landfill through recycling and material recovery.",
      image: zeroWasteImg,
    },
  ];

  const circularSteps = [
    { icon: Recycle, title: "Collect", desc: "Post-consumer PET bottles and recycled metals sourced responsibly" },
    { icon: Factory, title: "Process", desc: "Materials cleaned, processed, and transformed into raw materials" },
    { icon: Wind, title: "Manufacture", desc: "Eco-friendly production with reduced energy and water consumption" },
    { icon: Sun, title: "Deliver", desc: "Finished trims shipped with minimised packaging and carbon offset" },
  ];

  return (
    <>
        <PageBreadcrumb
          segments={[
            { label: "Home", href: "/" },
            { label: "Sustainability" },
          ]}
          title="Sustainability"
        />

        {/* Hero — two-column with bottle */}
        <section ref={heroRef} className="py-20 lg:py-28 px-6 lg:px-8 overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(140 30% 96%), hsl(150 20% 92%))" }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left — copy */}
              <div className={`transition-all duration-700 ease-out ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <span className={`block w-16 h-px mb-6 transition-all duration-700 ${heroVisible ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundColor: "hsl(150 40% 35%)", transitionDelay: "200ms" }} />
                <div className="text-5xl md:text-6xl lg:text-7xl leading-[0.9] mb-8">
                  <LetterReveal text="Our" as="span" className="font-light block text-foreground" isVisible={heroVisible} startDelay={100} letterDelay={60} />
                  <LetterReveal text="Promise" as="span" className="font-bold block text-[hsl(150_40%_30%)]" isVisible={heroVisible} startDelay={350} letterDelay={80} />
                  
                </div>
                <p className={`text-lg leading-relaxed mb-6 transition-all duration-700 ease-out ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: "600ms", color: "hsl(150 10% 35%)" }}>
                  As a leader in the garment accessories industry, we understand our responsibility to the environment. Through innovative technology and sustainable practices, we are committed to minimising our environmental footprint while maintaining the highest product quality.
                </p>
                <div className={`flex gap-8 transition-all duration-700 ease-out ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: "800ms" }}>
                  <div>
                    <p className="text-3xl font-bold" style={{ color: "hsl(150 40% 30%)" }}>30%</p>
                    <p className="text-xs text-muted-foreground">Recycled materials used</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold" style={{ color: "hsl(150 40% 30%)" }}>100%</p>
                    <p className="text-xs text-muted-foreground">Environmental compliance</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold" style={{ color: "hsl(150 40% 30%)" }}>50+</p>
                    <p className="text-xs text-muted-foreground">Eco product lines</p>
                  </div>
                </div>
              </div>

              {/* Right — bottle image */}
              <div className={`flex justify-center transition-all duration-1000 ease-out ${heroVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`} style={{ transitionDelay: "400ms" }}>
                <div className="relative max-w-sm w-full">
                  <img
                    src={bottleImg}
                    alt="Recycled PET bottle — circular material"
                    width={768}
                    height={1024}
                    className="w-full h-auto object-contain drop-shadow-xl"
                  />
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-5 py-2 rounded-full shadow-md">
                    <span className="text-xs font-medium tracking-wide" style={{ color: "hsl(150 40% 30%)" }}>♻ From Waste to Trim</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Initiatives */}
        <section className="py-24 px-6 lg:px-8 overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(140 25% 94%), hsl(140 15% 97%))" }}>
          <div className="max-w-7xl mx-auto">
            <div ref={initHeaderRef} className="mb-16">
              <p className={`text-xs tracking-[0.2em] uppercase mb-4 transition-all duration-700 ease-out ${initHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ color: "hsl(150 40% 35%)" }}>Initiatives</p>
              <LetterReveal
                text="Green Action"
                as="h2"
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground"
                isVisible={initHeaderVisible}
                startDelay={100}
                letterDelay={80}
              />
            </div>

            <div ref={initRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {initiatives.map((initiative, index) => (
                <div
                  key={initiative.title}
                  className={`group relative overflow-hidden transition-all duration-500 ease-out ${
                    initVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                  }`}
                  style={getInitDelay(index)}
                >
                  <div className="relative h-72">
                    <img src={initiative.image} alt={initiative.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(150 30% 15% / 0.85), hsl(150 30% 15% / 0.3))" }} />
                    <div className="relative z-10 h-full flex flex-col justify-end p-8">
                      <initiative.icon className="w-7 h-7 text-white/80 mb-3" strokeWidth={1.5} />
                      <h3 className="text-xl font-semibold text-white mb-2">{initiative.title}</h3>
                      <p className="text-sm text-white/75">{initiative.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Green Vision — full-width immersive forest */}
        <section ref={greenRef} className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={forestImg}
              alt="Lush forest canopy"
              className={`w-full h-full object-cover transition-transform duration-[2s] ease-out ${greenVisible ? 'scale-100' : 'scale-110'}`}
              loading="lazy"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, hsl(150 40% 10% / 0.85), hsl(150 40% 10% / 0.5))" }} />
          </div>

          <div className="relative z-10 py-28 lg:py-36 px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="max-w-2xl">
                <div className={`flex items-center gap-2 mb-6 transition-all duration-700 ${greenVisible ? 'opacity-100' : 'opacity-0'}`}>
                  <Leaf className="w-5 h-5 text-green-300" strokeWidth={1.5} />
                  <span className="text-xs tracking-[0.2em] uppercase text-green-300">Green Vision</span>
                </div>
                <LetterReveal
                  text="A Greener Future"
                  as="h2"
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
                  isVisible={greenVisible}
                  startDelay={100}
                  letterDelay={70}
                />
                <p className={`text-lg text-white/80 leading-relaxed mb-10 transition-all duration-700 ease-out ${greenVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: "400ms" }}>
                  We believe that every small change can make a profound impact on our planet. From material selection to production processes, we continuously explore more environmentally responsible methods to create a better future for the next generation.
                </p>

                <div className={`grid grid-cols-2 gap-4 transition-all duration-700 ease-out ${greenVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: "600ms" }}>
                  {[
                    { icon: TreePine, title: "Green Supply Chain", desc: "Traceable eco-friendly supplier network" },
                    { icon: Wind, title: "Clean Energy", desc: "Transitioning to renewable sources" },
                    { icon: Droplets, title: "Water Conservation", desc: "Closed-loop water treatment systems" },
                    { icon: Sun, title: "Carbon Neutral", desc: "Committed to neutrality by 2030" },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "hsl(150 30% 20% / 0.5)", backdropFilter: "blur(8px)" }}>
                      <item.icon className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="text-xs text-white/60">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Circular Material Journey — replaces Certifications */}
        <section className="py-24 px-6 lg:px-8 overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(140 20% 96%), hsl(0 0% 100%))" }}>
          <div className="max-w-7xl mx-auto">
            <div ref={circularRef}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className={`transition-all duration-700 ease-out ${circularVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
                  <p className="text-xs tracking-[0.2em] uppercase mb-4" style={{ color: "hsl(150 40% 35%)" }}>Circular Economy</p>
                  <LetterReveal
                    text="Material Journey"
                    as="h2"
                    className="text-4xl md:text-5xl font-bold text-foreground mb-6"
                    isVisible={circularVisible}
                    startDelay={100}
                    letterDelay={70}
                  />
                  <p className="text-muted-foreground leading-relaxed mb-10">
                    From post-consumer waste to premium garment trims — our circular material programme transforms discarded PET bottles and reclaimed metals into high-quality accessories, closing the loop on material consumption.
                  </p>

                  <div className="space-y-6">
                    {circularSteps.map((step, index) => (
                      <div key={step.title} className={`flex items-start gap-4 transition-all duration-500 ease-out ${circularVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${400 + index * 150}ms` }}>
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(150 30% 92%)" }}>
                          <step.icon className="w-5 h-5" style={{ color: "hsl(150 40% 30%)" }} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">0{index + 1}</span>
                            <h4 className="font-semibold text-foreground">{step.title}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                        </div>
                        {index < circularSteps.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0 mt-3 hidden md:block" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`transition-all duration-700 ease-out ${circularVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`} style={{ transitionDelay: "200ms" }}>
                  <div className="relative rounded-2xl overflow-hidden">
                    <img
                      src={natureImg}
                      alt="Pristine nature — environmental vision"
                      width={800}
                      height={640}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(150 30% 15% / 0.4), transparent)" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Eco-Plating Feature */}
        <section ref={ecoRef} className="py-24 px-6 lg:px-8 overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(150 35% 15%), hsl(160 30% 10%))" }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className={`transition-all duration-700 ease-out ${ecoVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
                <p className="text-xs tracking-[0.2em] uppercase text-green-300/70 mb-4">
                  Featured Technology
                </p>
                <LetterReveal
                  text="Eco-Plating"
                  as="h2"
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 uppercase tracking-[0.05em]"
                  isVisible={ecoVisible}
                  startDelay={100}
                  letterDelay={60}
                />
                <h3 className={`text-xl text-white/80 mb-6 transition-all duration-700 ease-out ${ecoVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '500ms' }}>
                  Eco-Friendly Electroless Plating
                </h3>
                <div className={`space-y-4 text-white/70 transition-all duration-700 ease-out ${ecoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '600ms' }}>
                  <p>
                    We have introduced advanced eco-friendly plating technology. Compared to traditional plating methods:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-400/60 rounded-full mr-3" />
                      No electricity required, reducing energy consumption
                    </li>
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-400/60 rounded-full mr-3" />
                      Reduced use of harmful substances
                    </li>
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-400/60 rounded-full mr-3" />
                      More uniform coating finish
                    </li>
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-400/60 rounded-full mr-3" />
                      Meets international environmental standards
                    </li>
                  </ul>
                </div>
              </div>
              <div className={`rounded-2xl overflow-hidden transition-all duration-700 ease-out ${ecoVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`} style={{ transitionDelay: '200ms' }}>
                <img
                  src={recycledMetalImg}
                  alt="Recycled metal granules for eco-plating"
                  width={800}
                  height={640}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>
    </>
  );
};

export default Sustainability;
