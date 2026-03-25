import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import ContentSection from "../../components/about/ContentSection";
import ImageTextBlock from "../../components/about/ImageTextBlock";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import LetterReveal from "@/components/ui/LetterReveal";

const milestones = [
  {
    year: "1979",
    title: "Founded in Hong Kong",
    body: "WIN-CYC GROUP LIMITED was established in Hong Kong, beginning as a specialist workshop dedicated to the production of premium garment trims, buttons, and fastening accessories.",
  },
  {
    year: "1990s",
    title: "Building Craft & Manufacturing Depth",
    body: "A decade of refining production techniques, investing in tooling capabilities, and building the deep manufacturing expertise that would become the foundation of our global reputation.",
  },
  {
    year: "2000",
    title: "ISO 9001 Certification",
    body: "Achieved ISO 9001 quality management certification, formalising our commitment to international standards across all production and supply operations.",
  },
  {
    year: "2000s–2010s",
    title: "Expanding Across Global Markets",
    body: "Extended our reach to serve leading brands across Europe, the Americas, Japan, and Asia Pacific — becoming a trusted supply partner for the world's most demanding fashion and apparel companies.",
  },
  {
    year: "2020s",
    title: "Integrated Solutions Partner",
    body: "Evolved from a manufacturing supplier into a full-service partner offering design collaboration, material innovation, compliance support, and end-to-end trim programme management.",
  },
  {
    year: "May 2026",
    title: "New Era: A New WinCYC with Digital Transformation",
    body: "Launching a new chapter — integrating digital tools, online cataloguing, and real-time collaboration to serve the next generation of global brands with speed, transparency, and precision.",
    isHighlight: true,
  },
];

const OurStory = () => {
  const { ref: introRef, isVisible: introVisible } = useScrollAnimation();
  const { ref: section2Ref, isVisible: section2Visible } = useScrollAnimation();
  const { ref: section3Ref, isVisible: section3Visible } = useScrollAnimation();
  const { ref: timelineHeaderRef, isVisible: timelineHeaderVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <PageBreadcrumb
        segments={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Our Story" },
        ]}
      />

      <main className="py-8 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Intro */}
          <div
            ref={introRef}
            className={`transition-all duration-700 ${
              introVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <ContentSection>
              <ImageTextBlock
                image="/founders.png"
                imageAlt="WIN-CYC Founders"
                title="The Beginning"
                content="WIN-CYC GROUP LIMITED was founded in Hong Kong in 1979. Driven by passion and expertise in the garment accessories industry, our founders started from a small factory with the mission to provide premium buttons, zippers, and accessories to fashion brands worldwide."
                imagePosition="left"
              />
            </ContentSection>
          </div>

          {/* Heritage & Growth */}
          <div
            ref={section2Ref}
            className={`transition-all duration-700 ${
              section2Visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "150ms" }}
          >
            <ContentSection title="Heritage & Growth">
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-xl font-light text-foreground">Traditional Craftsmanship</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We insist on combining traditional craftsmanship with modern technology. Every
                    product undergoes strict quality control. From raw material procurement to
                    finished goods, each step reflects our unwavering pursuit of quality.
                  </p>
                </div>
                <div className="space-y-6">
                  <h3 className="text-xl font-light text-foreground">Sustainable Development</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We believe that business growth and environmental protection can go hand in hand.
                    Through the adoption of eco-friendly materials and optimised production processes,
                    we are committed to minimising our environmental impact and contributing to the
                    sustainable fashion industry.
                  </p>
                </div>
              </div>
            </ContentSection>
          </div>

          {/* Core Values */}
          <div
            ref={section3Ref}
            className={`transition-all duration-700 ${
              section3Visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "300ms" }}
          >
            <ContentSection title="Core Values">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-foreground">Quality First</h3>
                  <p className="text-muted-foreground">
                    Adhering to international quality standards, ensuring every product passes
                    rigorous testing and certification.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-foreground">Client Focus</h3>
                  <p className="text-muted-foreground">
                    Understanding client needs in depth, providing expert product recommendations and
                    customisation services.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-foreground">Innovation</h3>
                  <p className="text-muted-foreground">
                    Continuously developing new styles and materials, keeping pace with fashion
                    trends and market demands.
                  </p>
                </div>
              </div>
            </ContentSection>
          </div>

          {/* ─── Milestone Timeline ─── */}
          <div className="mt-16 mb-8">
            <div ref={timelineHeaderRef} className="mb-12">
              <span
                className={`section-label transition-all duration-700 ease-out ${
                  timelineHeaderVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                }`}
              >
                Milestones
              </span>
              <LetterReveal
                text="Our Journey"
                as="h2"
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground"
                isVisible={timelineHeaderVisible}
                startDelay={100}
                letterDelay={60}
              />
            </div>

            {/* Vertical timeline */}
            <div className="relative pl-8 md:pl-12">
              {/* Vertical line */}
              <div className="absolute left-[11px] md:left-[19px] top-0 bottom-0 w-px bg-border" />

              {milestones.map((m, i) => (
                <MilestoneItem key={m.year} milestone={m} index={i} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

/* ── Individual milestone row ── */

interface Milestone {
  year: string;
  title: string;
  body: string;
  isHighlight?: boolean;
}

const MilestoneItem = ({ milestone: m, index }: { milestone: Milestone; index: number }) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });

  return (
    <div
      ref={ref}
      className={`relative pb-14 last:pb-0 transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      {/* Dot on the line */}
      <div
        className={`absolute -left-8 md:-left-12 top-1 flex items-center justify-center transition-all duration-500 ${
          isVisible ? "scale-100" : "scale-0"
        }`}
        style={{ transitionDelay: `${index * 120 + 200}ms` }}
      >
        <div
          className={`rounded-full border-2 ${
            m.isHighlight
              ? "w-5 h-5 bg-foreground border-foreground"
              : "w-3 h-3 bg-background border-foreground"
          }`}
        />
      </div>

      {m.isHighlight ? (
        /* ── Highlighted "New Era" card ── */
        <div className="bg-foreground text-background rounded-lg p-6 md:p-8 max-w-2xl">
          <span className="text-xs font-mono tracking-[0.15em] uppercase opacity-60">
            {m.year} · New Era
          </span>
          <h3 className="text-xl md:text-2xl font-semibold mt-2">{m.title}</h3>
          <p className="text-sm md:text-base opacity-80 mt-3 leading-relaxed">{m.body}</p>
        </div>
      ) : (
        /* ── Standard milestone ── */
        <div className="max-w-2xl">
          <span className="text-xs font-mono tracking-[0.12em] text-muted-foreground">{m.year}</span>
          <h3 className="text-lg md:text-xl font-semibold text-foreground mt-1">{m.title}</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{m.body}</p>
        </div>
      )}
    </div>
  );
};

export default OurStory;
