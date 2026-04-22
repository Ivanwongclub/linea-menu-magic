import { Link } from "react-router-dom";
import { useRef, useCallback } from "react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import milestoneFoundingImg from "@/assets/milestone-founding.jpg";
import milestoneCraftImg from "@/assets/milestone-craftsmanship.jpg";
import milestoneGlobalImg from "@/assets/milestone-global.jpg";
import factoryHeroImg from "@/assets/factory-hero.jpg";
import factoryProductionImg from "@/assets/factory-production.jpg";
import sustainabilityImg from "@/assets/sustainability-recycled-metal.jpg";
import milestoneDigitalImg from "@/assets/milestone-digital.jpg";

interface Milestone {
  year: string;
  title: string;
  desc: string;
  image?: string;
  isHighlight?: boolean;
  badge?: string;
  isVintage?: boolean;
}

const milestones: Milestone[] = [
  {
    year: "2026",
    title: "New Era",
    desc: "Digital transformation — catalogue, collaboration & speed.",
    image: milestoneDigitalImg,
    isHighlight: true,
    badge: "May 2026 · New Era",
  },
  {
    year: "45+ Years",
    title: "Sustainability",
    desc: "Recycled and eco-conscious accessories for responsible brands.",
    image: sustainabilityImg,
  },
  {
    year: "2020s",
    title: "Integrated Solutions",
    desc: "Full-service partner — design, compliance, trim programmes.",
  },
  {
    year: "2015",
    title: "Multi-Location Operations",
    desc: "Hong Kong HQ, Dongguan production, regional offices worldwide.",
    image: factoryProductionImg,
  },
  {
    year: "2010s",
    title: "OEM & ODM Capability",
    desc: "Concept-to-production — sampling, mould-making, volume manufacturing.",
    image: factoryHeroImg,
  },
  {
    year: "2000s–2010s",
    title: "Global Supply Partner",
    desc: "Leading brands across Europe, Americas & Asia Pacific.",
    image: milestoneGlobalImg,
  },
  {
    year: "2000",
    title: "ISO 9001 Certified",
    desc: "International quality management systems formalised.",
  },
  {
    year: "1990s",
    title: "Manufacturing Depth",
    desc: "Refining tooling, production techniques, and craft expertise.",
    image: milestoneCraftImg,
    isVintage: true,
  },
  {
    year: "1979",
    title: "Founded in Hong Kong",
    desc: "A small workshop with a vision for world-class garment trims.",
    image: milestoneFoundingImg,
    isVintage: true,
  },
];

const COLS = milestones.length;

const MilestoneTeaser = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: timelineRef, isVisible: timelineVisible } = useScrollAnimation({ threshold: 0.1 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = useCallback(() => {
    scrollRef.current?.scrollBy({ left: -500, behavior: "smooth" });
  }, []);

  const scrollRight = useCallback(() => {
    scrollRef.current?.scrollBy({ left: 500, behavior: "smooth" });
  }, []);

  return (
    <section className="py-24 overflow-hidden bg-heritage">
      {/* Heading — constrained */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div ref={headerRef} className="mb-6">
          <span
             className={`text-[11px] font-medium tracking-[0.12em] uppercase text-foreground/40 block mb-3 transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
               headerVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            About WIN-CYC
          </span>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8">
            <span className="inline-block mr-4">Our</span>
            <span className="inline-block font-serif-display">Journey</span>
          </h2>
        </div>
      </div>

      {/* Timeline — full width, no scroll */}
      <div className="w-full max-w-6xl mx-auto px-8 lg:px-12 relative mt-20">
        <div ref={scrollRef} className="pb-2">
          <div ref={timelineRef}>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                gridTemplateRows: "1fr auto 1fr",
                columnGap: "8px",
              }}
            >
              {/* ROW 1: ABOVE-LINE CONTENT (even indices: 0,2,4,6,8) */}
              {milestones.map((m, i) => (
                <div
                  key={`above-${i}`}
                   className={`flex items-end pb-8 transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
                     timelineVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ gridRow: 1, gridColumn: i + 1, transitionDelay: `${i * 80}ms` }}
                >
                  {i % 2 === 0 && <MilestoneCard m={m} isVisible={timelineVisible} delay={i * 80} />}
                </div>
              ))}

              {/* ROW 2: SPINE LINE + DOT */}
              {milestones.map((m, i) => (
                <div
                  key={`line-${i}`}
                  className="relative"
                  style={{ gridRow: 2, gridColumn: i + 1, height: "2px" }}
                >
                  <div className="absolute inset-0 bg-foreground/20" />
                  {i === 0 && (
                    <div
                      className="absolute top-0 left-0 h-full bg-foreground/80"
                      style={{
                        width: timelineVisible ? `calc(${COLS} * 100% + ${(COLS - 1) * 16}px)` : "0%",
                        transition: "width 1.4s cubic-bezier(0.19,1,0.22,1)",
                        transitionDelay: "200ms",
                      }}
                    />
                  )}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 rounded-full border-2 transition-all duration-500 ${
                      m.isHighlight
                        ? "w-[16px] h-[16px] bg-foreground border-foreground"
                        : "w-[14px] h-[14px] bg-heritage border-foreground/60"
                    } ${timelineVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
                    style={{ transitionDelay: `${300 + i * 80}ms` }}
                  />
                </div>
              ))}

              {/* ROW 3: BELOW-LINE CONTENT (odd indices: 1,3,5,7) */}
              {milestones.map((m, i) => (
                <div
                  key={`below-${i}`}
                   className={`flex items-start pt-8 transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
                     timelineVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
                  }`}
                  style={{ gridRow: 3, gridColumn: i + 1, transitionDelay: `${i * 80 + 100}ms` }}
                >
                  {i % 2 === 1 && <MilestoneCard m={m} isVisible={timelineVisible} delay={i * 80 + 100} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA — constrained */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-14">
        <div
           className={`transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
             timelineVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "1200ms" }}
        >
          <Link
            to="/about/our-story"
            className="group inline-flex items-center text-sm tracking-wider text-foreground/50 hover:text-foreground transition-colors duration-200 link-elegant"
          >
            Read Our Full Story
            <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" />
          </Link>
        </div>
      </div>
    </section>
  );
};

/* Milestone card — shared between above and below */
const MilestoneCard = ({
  m,
  isVisible,
  delay,
}: {
  m: Milestone;
  isVisible: boolean;
  delay: number;
}) => {
  if (m.isHighlight) {
    return (
      <div
         className={`border border-foreground/12 bg-foreground/[0.04] rounded-lg overflow-hidden pl-1 transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
           isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
        style={{ transitionDelay: `${delay}ms` }}
      >
        {m.image && (
          <div className="overflow-hidden rounded-t-lg">
            <img
              src={m.image}
              alt={m.title}
              width={800}
              height={608}
              loading="lazy"
              className="w-full h-48 object-cover"
            />
          </div>
        )}
        <div className="p-2">
          {m.badge && (
            <span className="text-[9px] font-mono tracking-[0.15em] uppercase text-foreground/40 block">
              {m.badge}
            </span>
          )}
           <span className={`text-[20px] lg:text-[24px] font-bold text-foreground/80 leading-none block mb-1 tracking-tight transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.34,1.4,0.64,1)] ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"}`} style={{ transitionDelay: `${delay + 100}ms` }}>
            {m.year}
          </span>
          <h3 className="text-sm font-semibold text-foreground mt-1 leading-snug">{m.title}</h3>
          <p className="text-xs text-foreground/45 mt-1 leading-relaxed text-justify">{m.desc}</p>
        </div>
      </div>
    );
  }

  return (
    <div
       className={`pl-1 transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
         isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {m.image && (
        <div className="overflow-hidden rounded-sm mb-2">
          <img
            src={m.image}
            alt={m.title}
            width={800}
            height={608}
            loading="lazy"
            className={`w-full h-44 object-cover transition-filter duration-500 ${
              m.isVintage ? "grayscale sepia-[0.2] brightness-95" : ""
            }`}
          />
        </div>
      )}
      <span className={`text-[20px] lg:text-[24px] font-bold text-foreground/80 leading-none block mb-1 tracking-tight transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.34,1.4,0.64,1)] ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"}`} style={{ transitionDelay: `${delay + 100}ms` }}>
        {m.year}
      </span>
      <h3 className="text-sm font-semibold text-foreground mt-1 leading-snug">{m.title}</h3>
      <p className="text-xs text-foreground/45 mt-1 leading-relaxed text-justify">{m.desc}</p>
    </div>
  );
};

export default MilestoneTeaser;
