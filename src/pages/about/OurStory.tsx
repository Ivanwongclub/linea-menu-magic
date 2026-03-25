import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import ContentSection from "../../components/about/ContentSection";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import LetterReveal from "@/components/ui/LetterReveal";
import milestoneFoundingImg from "@/assets/milestone-founding.jpg";
import milestoneCraftImg from "@/assets/milestone-craftsmanship.jpg";
import milestoneGlobalImg from "@/assets/milestone-global.jpg";
import milestoneDigitalImg from "@/assets/milestone-digital.jpg";
import heritageImg from "@/assets/heritage-craftsmanship.jpg";
import aboutHeritageImg from "@/assets/about-heritage.jpg";

interface Milestone {
  year: string;
  title: string;
  body: string;
  image?: string;
  isHighlight?: boolean;
}

const milestones: Milestone[] = [
  {
    year: "1979",
    title: "Founded in Hong Kong",
    body: "WIN-CYC GROUP LIMITED was established in Hong Kong, beginning as a specialist workshop dedicated to the production of premium garment trims, buttons, and fastening accessories.",
    image: milestoneFoundingImg,
  },
  {
    year: "1990s",
    title: "Building Craft & Manufacturing Depth",
    body: "A decade of refining production techniques, investing in tooling capabilities, and building the deep manufacturing expertise that would become the foundation of our global reputation.",
    image: milestoneCraftImg,
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
    image: milestoneGlobalImg,
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
    image: milestoneDigitalImg,
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
          {/* Intro — The Beginning */}
          <div
            ref={introRef}
            className={`transition-all duration-700 ${
              introVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <ContentSection>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="aspect-[3/2] rounded-lg overflow-hidden">
                  <img
                    src={milestoneFoundingImg}
                    alt="WinCYC founding workshop and early production"
                    width={800}
                    height={544}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">The Beginning</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    WIN-CYC GROUP LIMITED was founded in Hong Kong in 1979. Driven by passion and expertise in the garment accessories industry, our founders started from a small factory with the mission to provide premium buttons, zippers, and accessories to fashion brands worldwide.
                  </p>
                </div>
              </div>
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
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-light text-foreground">Traditional Craftsmanship</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We insist on combining traditional craftsmanship with modern technology. Every
                      product undergoes strict quality control. From raw material procurement to
                      finished goods, each step reflects our unwavering pursuit of quality.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-light text-foreground">Sustainable Development</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We believe that business growth and environmental protection can go hand in hand.
                      Through the adoption of eco-friendly materials and optimised production processes,
                      we are committed to minimising our environmental impact.
                    </p>
                  </div>
                </div>
                <div className="grid grid-rows-2 gap-4">
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={heritageImg}
                      alt="Heritage craftsmanship and precision manufacturing"
                      width={800}
                      height={544}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={aboutHeritageImg}
                      alt="WinCYC production facility and team"
                      width={800}
                      height={544}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
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
            <div className="relative ml-4 md:ml-6">
              {/* Vertical line — positioned at center of dots (left offset = dot center) */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

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

const MilestoneItem = ({ milestone: m, index }: { milestone: Milestone; index: number }) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });

  const dotSize = m.isHighlight ? 18 : 12;

  return (
    <div
      ref={ref}
      className={`relative pb-14 last:pb-0 pl-10 md:pl-14 transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      {/* Dot — centered exactly on the vertical line */}
      <div
        className={`absolute left-0 top-1.5 -translate-x-1/2 transition-all duration-500 ${
          isVisible ? "scale-100" : "scale-0"
        }`}
        style={{
          transitionDelay: `${index * 120 + 200}ms`,
          marginLeft: '-4px',
          left: '4px',
        }}
      >
        <div
          className={`rounded-full border-2 ${
            m.isHighlight
              ? "bg-foreground border-foreground"
              : "bg-background border-foreground"
          }`}
          style={{ width: dotSize, height: dotSize }}
        />
      </div>

      {m.isHighlight ? (
        /* ── Highlighted "New Era" card ── */
        <div className="bg-foreground text-background rounded-lg overflow-hidden max-w-2xl">
          {m.image && (
            <img
              src={m.image}
              alt={m.title}
              width={800}
              height={544}
              loading="lazy"
              className="w-full h-48 md:h-56 object-cover"
            />
          )}
          <div className="p-6 md:p-8">
            <span className="text-[10px] font-mono tracking-[0.15em] uppercase opacity-60">
              {m.year} · New Era
            </span>
            <h3 className="text-xl md:text-2xl font-semibold mt-2">{m.title}</h3>
            <p className="text-sm md:text-base opacity-80 mt-3 leading-relaxed">{m.body}</p>
          </div>
        </div>
      ) : m.image ? (
        /* ── Milestone with image ── */
        <div className="max-w-2xl">
          <div className="grid md:grid-cols-[1fr_1.2fr] gap-5 items-start">
            <div>
              <span className="text-xs font-mono tracking-[0.12em] text-muted-foreground">{m.year}</span>
              <h3 className="text-lg md:text-xl font-semibold text-foreground mt-1">{m.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{m.body}</p>
            </div>
            <div className="rounded-lg overflow-hidden aspect-[3/2]">
              <img
                src={m.image}
                alt={m.title}
                width={800}
                height={544}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      ) : (
        /* ── Standard text-only milestone ── */
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
