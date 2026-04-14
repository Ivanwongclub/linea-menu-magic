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
import valueQualityImg from "@/assets/value-quality.jpg";
import valuePartnershipImg from "@/assets/value-partnership.jpg";
import valueInnovationImg from "@/assets/value-innovation.jpg";

interface Milestone {
  year: string;
  title: string;
  body: string;
  image?: string;
  isHighlight?: boolean;
  isVintage?: boolean;
}

const milestones: Milestone[] = [
  {
    year: "1979",
    title: "Founded in Hong Kong",
    body: "WIN-CYC GROUP LIMITED was established in Hong Kong, beginning as a specialist workshop dedicated to the production of premium garment trims, buttons, and fastening accessories.",
    image: milestoneFoundingImg,
    isVintage: true,
  },
  {
    year: "1990s",
    title: "Building Craft & Manufacturing Depth",
    body: "A decade of refining production techniques, investing in tooling capabilities, and building the deep manufacturing expertise that would become the foundation of our global reputation.",
    image: milestoneCraftImg,
    isVintage: true,
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
    <>
      <PageBreadcrumb
        segments={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Our Story" },
        ]}
      />
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

          {/* Heritage & Growth — compact horizontal images */}
          <div
            ref={section2Ref}
            className={`transition-all duration-700 ${
              section2Visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "150ms" }}
          >
            <ContentSection title="Heritage & Growth">
              {/* Two horizontal images in one row */}
              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="aspect-[16/9] rounded-lg overflow-hidden">
                  <img
                    src={heritageImg}
                    alt="Heritage craftsmanship and precision manufacturing"
                    width={800}
                    height={450}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[16/9] rounded-lg overflow-hidden">
                  <img
                    src={aboutHeritageImg}
                    alt="WinCYC production facility and team"
                    width={800}
                    height={450}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-10">
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
            </ContentSection>
          </div>

          {/* Core Values — with imagery */}
          <div
            ref={section3Ref}
            className={`transition-all duration-700 ${
              section3Visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "300ms" }}
          >
            <ContentSection title="Core Values">
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Quality First",
                    desc: "Adhering to international quality standards, ensuring every product passes rigorous testing and certification.",
                    image: valueQualityImg,
                    alt: "Quality inspection of precision metal components",
                  },
                  {
                    title: "Client Focus",
                    desc: "Understanding client needs in depth, providing expert product recommendations and customisation services.",
                    image: valuePartnershipImg,
                    alt: "Client partnership and collaboration",
                  },
                  {
                    title: "Innovation",
                    desc: "Continuously developing new styles and materials, keeping pace with fashion trends and market demands.",
                    image: valueInnovationImg,
                    alt: "Innovation in product design and development",
                  },
                ].map((v) => (
                  <div key={v.title} className="group">
                    <div className="aspect-[3/2] rounded-lg overflow-hidden mb-5">
                      <img
                        src={v.image}
                        alt={v.alt}
                        width={768}
                        height={512}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">{v.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                ))}
              </div>
            </ContentSection>
          </div>

          {/* ─── Milestone Timeline — centered ─── */}
          <div className="mt-16 mb-8 bg-[#F7F5F2] rounded-lg px-8 py-12">
            <div ref={timelineHeaderRef} className="mb-12 text-center">
              <span
                className={`section-label inline-block transition-all duration-700 ease-out ${
                  timelineHeaderVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
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

            {/* Centered vertical timeline */}
            <div className="max-w-3xl mx-auto relative">
              {/* Center vertical line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-foreground/20 -translate-x-1/2" />

              {milestones.map((m, i) => (
                <CenteredMilestoneItem key={m.year} milestone={m} index={i} isLeft={i % 2 === 0} />
              ))}
            </div>
          </div>
        </div>
    </>
  );
};

/* ── Centered alternating milestone row ── */

const CenteredMilestoneItem = ({
  milestone: m,
  index,
  isLeft,
}: {
  milestone: Milestone;
  index: number;
  isLeft: boolean;
}) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });

  // dot sizes now inline

  return (
    <div
      ref={ref}
      className={`relative pb-16 last:pb-0 transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      {/* Dot — centered on the vertical line */}
      <div
        className={`absolute left-1/2 top-2 -translate-x-1/2 z-10 transition-all duration-500 ${
          isVisible ? "scale-100" : "scale-0"
        }`}
        style={{ transitionDelay: `${index * 120 + 200}ms` }}
      >
        <div
          className={`rounded-full border-2 ${
            m.isHighlight
              ? "bg-foreground border-foreground"
              : "bg-[#F7F5F2] border-foreground/60"
          }`}
          style={{ width: m.isHighlight ? 16 : 14, height: m.isHighlight ? 16 : 14 }}
        />
      </div>

      {/* Content — alternates left/right */}
      <div className={`grid grid-cols-2 gap-8 ${isLeft ? "" : ""}`}>
        {isLeft ? (
          <>
            <div className="text-right pr-8">
              {m.isHighlight ? (
                <HighlightCard milestone={m} />
              ) : (
                <MilestoneContent milestone={m} align="right" />
              )}
            </div>
            <div />
          </>
        ) : (
          <>
            <div />
            <div className="pl-8">
              {m.isHighlight ? (
                <HighlightCard milestone={m} />
              ) : (
                <MilestoneContent milestone={m} align="left" />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

const MilestoneContent = ({
  milestone: m,
  align,
}: {
  milestone: Milestone;
  align: "left" | "right";
}) => (
  <div>
    <span className="text-[32px] lg:text-[38px] font-bold text-foreground/70 leading-none tracking-tight block mb-2">{m.year}</span>
    <h3 className="text-lg font-semibold text-foreground mt-1">{m.title}</h3>
    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{m.body}</p>
    {m.image && (
      <div className={`mt-4 rounded-lg overflow-hidden aspect-[3/2] max-w-xs ${align === "right" ? "ml-auto" : ""}`}>
        <img
          src={m.image}
          alt={m.title}
          width={400}
          height={267}
          loading="lazy"
          className={`w-full h-full object-cover ${m.isVintage ? "grayscale sepia-[0.2] brightness-95" : ""}`}
        />
      </div>
    )}
  </div>
);

const HighlightCard = ({ milestone: m }: { milestone: Milestone }) => (
  <div className="bg-foreground text-background rounded-lg overflow-hidden">
    {m.image && (
      <img
        src={m.image}
        alt={m.title}
        width={800}
        height={400}
        loading="lazy"
        className="w-full h-44 object-cover"
      />
    )}
    <div className="p-5">
      <span className="text-[10px] font-mono tracking-[0.15em] uppercase opacity-60">
        {m.year} · New Era
      </span>
      <h3 className="text-lg font-semibold mt-1.5">{m.title}</h3>
      <p className="text-sm opacity-80 mt-2 leading-relaxed">{m.body}</p>
    </div>
  </div>
);

export default OurStory;
