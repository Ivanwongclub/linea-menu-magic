import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import LetterReveal from "@/components/ui/LetterReveal";
import { ArrowRight } from "lucide-react";

const milestones = [
  { year: "1979", label: "Founded in Hong Kong", desc: "A small workshop with a vision for world-class trims." },
  { year: "2000", label: "ISO 9001 Certified", desc: "International quality systems across all production lines." },
  { year: "2010s", label: "Global Supply Partner", desc: "Serving leading brands across Europe, Americas & Asia Pacific." },
  { year: "2026", label: "New Era", desc: "A new WinCYC — Digital Transformation.", isHighlight: true, month: "May" },
];

const MilestoneTeaser = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: timelineRef, isVisible: timelineVisible } = useScrollAnimation({ threshold: 0.15 });

  return (
    <section className="py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="mb-16">
          <span
            className={`section-label transition-all duration-700 ease-out ${
              headerVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            Milestones
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
          <p
            className={`text-muted-foreground max-w-lg transition-all duration-700 ease-out ${
              headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ transitionDelay: "400ms" }}
          >
            Over four decades of craftsmanship, innovation, and global partnership.
          </p>
        </div>

        {/* Horizontal timeline */}
        <div ref={timelineRef} className="relative">
          {/* Connecting line */}
          <div className="absolute top-[28px] left-0 right-0 h-px bg-border hidden md:block" />
          <div
            className={`absolute top-[28px] left-0 h-px bg-foreground hidden md:block transition-all duration-[1.5s] ease-out ${
              timelineVisible ? "right-0" : "right-full"
            }`}
            style={{ transitionDelay: "300ms" }}
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
            {milestones.map((m, i) => (
              <div
                key={m.year}
                className={`relative transition-all duration-700 ease-out ${
                  timelineVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${300 + i * 200}ms` }}
              >
                {/* Dot */}
                <div className="hidden md:flex items-center justify-start mb-6">
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-500 ${
                      m.isHighlight
                        ? "bg-foreground border-foreground scale-125"
                        : "bg-background border-foreground"
                    }`}
                    style={{ transitionDelay: `${500 + i * 200}ms` }}
                  />
                </div>

                {/* Card */}
                {m.isHighlight ? (
                  <div className="bg-foreground text-background rounded-lg p-6">
                    <span className="text-xs font-mono tracking-widest uppercase opacity-70">
                      {m.month} {m.year}
                    </span>
                    <h3 className="text-lg font-semibold mt-1">{m.label}</h3>
                    <p className="text-sm opacity-80 mt-2 leading-relaxed">{m.desc}</p>
                  </div>
                ) : (
                  <div className="pt-0 md:pt-0">
                    <span className="text-xs font-mono tracking-widest text-muted-foreground">
                      {m.year}
                    </span>
                    <h3 className="text-base font-semibold text-foreground mt-1">{m.label}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{m.desc}</p>
                  </div>
                )}
              </div>
            ))}
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
