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
}

const milestones: Milestone[] = [
  {
    year: "1979",
    title: "Founded in Hong Kong",
    desc: "A small workshop with a vision for world-class garment trims.",
    image: milestoneFoundingImg,
  },
  {
    year: "1990s",
    title: "Manufacturing Depth",
    desc: "Refining tooling, production techniques, and craft expertise.",
    image: milestoneCraftImg,
  },
  {
    year: "2000",
    title: "ISO 9001 Certified",
    desc: "International quality management systems formalised.",
  },
  {
    year: "2000s–2010s",
    title: "Global Supply Partner",
    desc: "Leading brands across Europe, Americas & Asia Pacific.",
    image: milestoneGlobalImg,
  },
  {
    year: "2010s",
    title: "OEM & ODM Capability",
    desc: "Concept-to-production — sampling, mould-making, volume manufacturing.",
    image: factoryHeroImg,
  },
  {
    year: "2015",
    title: "Multi-Location Operations",
    desc: "Hong Kong HQ, Dongguan production, regional offices worldwide.",
    image: factoryProductionImg,
  },
  {
    year: "2020s",
    title: "Integrated Solutions",
    desc: "Full-service partner — design, compliance, trim programmes.",
  },
  {
    year: "45+ Years",
    title: "Sustainability",
    desc: "Recycled and eco-conscious accessories for responsible brands.",
    image: sustainabilityImg,
  },
  {
    year: "2026",
    title: "New Era",
    desc: "Digital transformation — catalogue, collaboration & speed.",
    image: milestoneDigitalImg,
    isHighlight: true,
    badge: "May 2026 · New Era",
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
    <section className="py-24 overflow-hidden bg-[#0f0f0f] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="mb-6">
          <span
            className={`text-[11px] font-medium tracking-[0.12em] uppercase text-white/45 block mb-3 transition-all duration-700 ease-out ${
              headerVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            About WIN-CYC
          </span>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4">
            <span className="inline-block mr-4">Our</span>
            <span className="inline-block font-serif-display">Journey</span>
          </h2>
        </div>

        {/* Timeline */}
        <div className="relative mt-16">
          {/* Left arrow */}
          <button
            onClick={scrollLeft}
            aria-label="Scroll timeline left"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-12 h-12 text-white/50 hover:text-white transition-colors duration-200 bg-gradient-to-r from-[#0f0f0f] to-transparent"
          >
            <ChevronLeft size={32} strokeWidth={1.5} />
          </button>

          {/* Right arrow */}
          <button
            onClick={scrollRight}
            aria-label="Scroll timeline right"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-12 h-12 text-white/50 hover:text-white transition-colors duration-200 bg-gradient-to-l from-[#0f0f0f] to-transparent"
          >
            <ChevronRight size={32} strokeWidth={1.5} />
          </button>

          {/* Scrollable track */}
          <div
            ref={scrollRef}
            className="overflow-x-auto scrollbar-hide pb-2 px-12"
            style={{ scrollSnapType: "x proximity" }}
          >
            <div ref={timelineRef} style={{ minWidth: "max-content" }}>
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${COLS}, minmax(120px, 160px))`,
                  gridTemplateRows: "auto 1px 28px auto",
                  columnGap: "16px",
                }}
              >
                {/* ROW 1: ABOVE-LINE CONTENT (even indices: 0,2,4,6,8) */}
                {milestones.map((m, i) => (
                  <div
                    key={`above-${i}`}
                    className={`flex items-end pb-4 transition-all duration-700 ease-out ${
                      timelineVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                    style={{ gridRow: 1, gridColumn: i + 1, transitionDelay: `${i * 80}ms` }}
                  >
                    {i % 2 === 0 && <MilestoneCard m={m} isVisible={timelineVisible} delay={i * 80} />}
                  </div>
                ))}

                {/* ROW 2: SPINE LINE */}
                {milestones.map((_, i) => (
                  <div
                    key={`line-${i}`}
                    className="relative"
                    style={{ gridRow: 2, gridColumn: i + 1 }}
                  >
                    {/* Static dim line */}
                    <div className="absolute inset-0 bg-white/15" />
                    {/* Animated fill — only on first column, spans full width */}
                    {i === 0 && (
                      <div
                        className={`absolute top-0 left-0 h-full bg-white/60 transform-gpu origin-left ${
                          timelineVisible ? "animate-[ms-line-grow_2s_ease-out_forwards]" : "scale-x-0"
                        }`}
                        style={{
                          width: `calc(${COLS} * 100% + ${(COLS - 1) * 16}px)`,
                          animationDelay: "300ms",
                        }}
                      />
                    )}
                  </div>
                ))}

                {/* ROW 3: DOTS */}
                {milestones.map((m, i) => (
                  <div
                    key={`dot-${i}`}
                    className="flex justify-start items-start pt-2"
                    style={{ gridRow: 3, gridColumn: i + 1 }}
                  >
                    <div
                      className={`rounded-full border-2 w-[12px] h-[12px] ${
                        m.isHighlight
                          ? "bg-white border-white"
                          : "bg-[#0f0f0f] border-white/60"
                      } ${
                        timelineVisible
                          ? "animate-[ms-dot-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
                          : "scale-0 opacity-0"
                      }`}
                      style={{ animationDelay: `${500 + i * 150}ms` }}
                    />
                  </div>
                ))}

                {/* ROW 4: BELOW-LINE CONTENT (odd indices: 1,3,5,7) */}
                {milestones.map((m, i) => (
                  <div
                    key={`below-${i}`}
                    className={`flex items-start pt-4 transition-all duration-700 ease-out ${
                      timelineVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
                    }`}
                    style={{ gridRow: 4, gridColumn: i + 1, transitionDelay: `${i * 80 + 100}ms` }}
                  >
                    {i % 2 === 1 && <MilestoneCard m={m} isVisible={timelineVisible} delay={i * 80 + 100} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
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
            className="group inline-flex items-center text-sm tracking-wider text-white link-elegant"
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
        className={`bg-white text-[#0f0f0f] rounded-lg overflow-hidden transition-all duration-700 ease-out ${
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
              className="w-full h-28 object-cover"
            />
          </div>
        )}
        <div className="p-3">
          {m.badge && (
            <span className="text-[9px] font-mono tracking-[0.15em] uppercase text-[#0f0f0f]/50 block">
              {m.badge}
            </span>
          )}
          <span className="text-[10px] font-mono tracking-[0.12em] text-[#0f0f0f]/40 block mt-0.5">
            {m.year}
          </span>
          <h3 className="text-sm font-semibold mt-1 leading-snug">{m.title}</h3>
          <p className="text-xs text-[#0f0f0f]/70 mt-1 leading-relaxed">{m.desc}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`transition-all duration-700 ease-out ${
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
            className="w-full h-24 object-cover"
          />
        </div>
      )}
      <span className="text-[10px] font-mono tracking-[0.12em] text-white/40 block">
        {m.year}
      </span>
      <h3 className="text-sm font-semibold text-white mt-1 leading-snug">{m.title}</h3>
      <p className="text-xs text-white/60 mt-1 leading-relaxed">{m.desc}</p>
    </div>
  );
};

export default MilestoneTeaser;
