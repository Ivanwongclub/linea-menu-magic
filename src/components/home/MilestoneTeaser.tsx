import { useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import LetterReveal from "@/components/ui/LetterReveal";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import milestoneFoundingImg from "@/assets/milestone-founding.jpg";
import milestoneCraftImg from "@/assets/milestone-craftsmanship.jpg";
import milestoneIsoImg from "@/assets/milestone-iso-quality.jpg";
import milestoneGlobalImg from "@/assets/milestone-global.jpg";
import factoryHeroImg from "@/assets/factory-hero.jpg";
import factoryProductionImg from "@/assets/factory-production.jpg";
import milestoneIntegratedImg from "@/assets/milestone-integrated.jpg";
import sustainabilityRecycledImg from "@/assets/sustainability-recycled-metal.jpg";
import milestoneDigitalImg from "@/assets/milestone-digital.jpg";

interface Milestone {
  year: string;
  title: string;
  desc: string;
  image: string;
  position: "above" | "below";
  animClass: string;
  isHighlight?: boolean;
  badge?: string;
}

const milestones: Milestone[] = [
  {
    year: "1979",
    title: "Founded in Hong Kong",
    desc: "A small workshop with a vision for world-class garment trims.",
    image: milestoneFoundingImg,
    position: "above",
    animClass: "ms-anim-warm",
  },
  {
    year: "1990s",
    title: "Manufacturing Depth",
    desc: "Refining tooling, production techniques, and craft expertise.",
    image: milestoneCraftImg,
    position: "below",
    animClass: "ms-anim-zoom",
  },
  {
    year: "2000",
    title: "ISO 9001 Certified",
    desc: "International quality management systems formalised.",
    image: milestoneIsoImg,
    position: "above",
    animClass: "ms-anim-zoom",
  },
  {
    year: "2000s–2010s",
    title: "Global Supply Partner",
    desc: "Leading brands across Europe, the Americas & Asia Pacific.",
    image: milestoneGlobalImg,
    position: "below",
    animClass: "ms-anim-drift",
  },
  {
    year: "2010s",
    title: "OEM & ODM Capability",
    desc: "Concept-to-production — sampling, mould-making, volume manufacturing.",
    image: factoryHeroImg,
    position: "above",
    animClass: "ms-anim-pan",
  },
  {
    year: "2015",
    title: "Multi-Location Operations",
    desc: "Hong Kong HQ, Dongguan production, regional offices worldwide.",
    image: factoryProductionImg,
    position: "below",
    animClass: "ms-anim-pan",
  },
  {
    year: "2020s",
    title: "Integrated Solutions",
    desc: "Full-service partner — design, compliance, trim programmes.",
    image: milestoneIntegratedImg,
    position: "above",
    animClass: "ms-anim-drift",
  },
  {
    year: "45+ Years",
    title: "Sustainability Commitment",
    desc: "Recycled and eco-conscious accessories for responsible brands.",
    image: sustainabilityRecycledImg,
    position: "below",
    animClass: "ms-anim-breathe",
  },
  {
    year: "2026",
    title: "New Era",
    desc: "Digital transformation — catalogue, collaboration & speed.",
    image: milestoneDigitalImg,
    position: "below",
    isHighlight: true,
    badge: "May 2026 · New Era",
    animClass: "ms-anim-shimmer",
  },
];

const MilestoneTeaser = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: timelineRef, isVisible: timelineVisible } = useScrollAnimation({ threshold: 0.1 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -480, behavior: "smooth" });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 480, behavior: "smooth" });
    }
  }, []);

  return (
    <section className="py-24 overflow-hidden bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="mb-6">
          <span
            className={`section-label transition-all duration-700 ease-out ${
              headerVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            About WinCYC
          </span>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4">
            <LetterReveal
              text="Our"
              as="span"
              className="text-outline inline-block mr-4"
              isVisible={headerVisible}
              startDelay={100}
              letterDelay={60}
            />
            <LetterReveal
              text="Journey"
              as="span"
              className="inline-block font-serif-display"
              isVisible={headerVisible}
              startDelay={250}
              letterDelay={60}
            />
          </h2>
        </div>

        {/* Intro */}
        <p
          className={`text-muted-foreground max-w-xl mb-16 leading-relaxed transition-all duration-700 ease-out ${
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "400ms" }}
        >
          Since 1979, WinCYC has grown from a Hong Kong workshop into a global partner for premium garment trims and accessories — combining heritage craftsmanship with forward-looking innovation.
        </p>

        {/* Timeline wrapper — relative, for arrow positioning */}
        <div className="relative">
          {/* Left arrow — Dorlet style */}
          <button
            onClick={scrollLeft}
            aria-label="Scroll timeline left"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center
                       w-12 h-12 text-foreground/50 hover:text-foreground transition-colors duration-200
                       bg-gradient-to-r from-secondary/80 to-transparent"
            style={{ marginTop: "-8px" }}
          >
            <ChevronLeft size={32} strokeWidth={1.5} />
          </button>

          {/* Scrollable track */}
          <div
            ref={scrollRef}
            className="overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollSnapType: "x proximity" }}
          >
            <div ref={timelineRef} className="relative" style={{ minWidth: "max-content" }}>
              {/* Spine base line */}
              <div className="absolute top-[7px] left-0 right-0 h-px bg-border hidden md:block" />
              {/* Spine fill — animated */}
              <div
                className={`absolute top-[7px] left-0 right-0 h-px bg-foreground hidden md:block transform-gpu origin-left ${
                  timelineVisible ? "animate-[ms-line-grow_2s_ease-out_forwards]" : "scale-x-0"
                }`}
                style={{ animationDelay: "300ms" }}
              />

              <div className="grid grid-cols-1 md:grid-cols-9 gap-8 md:gap-4" style={{ minWidth: "900px" }}>
                {milestones.map((m, i) => (
                  <div
                    key={m.year}
                    className={`relative transition-all duration-700 ease-out ${
                      timelineVisible ? "opacity-100 translate-y-0 ms-visible" : "opacity-0 translate-y-8"
                    } ${m.animClass}`}
                    style={{ transitionDelay: `${300 + i * 150}ms` }}
                  >
                    {/* Dot */}
                    <div className="hidden md:flex items-center mb-5">
                      <div
                        className={`rounded-full border-2 ${
                          m.isHighlight
                            ? "w-[14px] h-[14px] bg-foreground border-foreground"
                            : "w-[14px] h-[14px] bg-background border-foreground"
                        } ${
                          timelineVisible
                            ? "animate-[ms-dot-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
                            : "scale-0 opacity-0"
                        }`}
                        style={{ animationDelay: `${500 + i * 150}ms` }}
                      />
                    </div>

                    {/* Card */}
                    {m.isHighlight ? (
                      <div className="bg-foreground text-background rounded-lg overflow-hidden">
                        <div className="overflow-hidden rounded-sm">
                          <img
                            src={m.image}
                            alt={m.title}
                            width={800}
                            height={608}
                            loading="lazy"
                            className="w-full h-32 object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <span className="text-[10px] font-mono tracking-[0.15em] uppercase opacity-70">
                            {m.badge}
                          </span>
                          <h3 className="text-sm font-semibold mt-1">{m.title}</h3>
                          <p className="text-xs opacity-80 mt-1.5 leading-relaxed">{m.desc}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="overflow-hidden rounded-sm mb-3">
                          <img
                            src={m.image}
                            alt={m.title}
                            width={800}
                            height={608}
                            loading="lazy"
                            className="w-full h-28 object-cover"
                          />
                        </div>
                        <span className="text-[10px] font-mono tracking-[0.12em] text-muted-foreground">
                          {m.year}
                        </span>
                        <h3 className="text-sm font-semibold text-foreground mt-1">{m.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{m.desc}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right arrow — Dorlet style */}
          <button
            onClick={scrollRight}
            aria-label="Scroll timeline right"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center
                       w-12 h-12 text-foreground/50 hover:text-foreground transition-colors duration-200
                       bg-gradient-to-l from-secondary/80 to-transparent"
            style={{ marginTop: "-8px" }}
          >
            <ChevronRight size={32} strokeWidth={1.5} />
          </button>
        </div>

        {/* CTA */}
        <div
          className={`mt-12 transition-all duration-700 ease-out ${
            timelineVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "1200ms" }}
        >
          <Link
            to="/about/our-story"
            className="group inline-flex items-center text-sm tracking-wider text-foreground link-elegant"
          >
            Read Our Full Story
            <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default MilestoneTeaser;
