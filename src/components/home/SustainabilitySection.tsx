import { Link } from "react-router-dom";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import { useI18n } from "@/features/i18n/I18nProvider";
import LetterReveal from "@/components/ui/LetterReveal";
import { Button } from "@/components/ui/button";
import sustainabilityImage from "@/assets/sustainability.jpg";
import heritageCraftsmanship from "@/assets/heritage-craftsmanship.jpg";

const SustainabilitySection = () => {
  const { t } = useI18n();
  const { ref: imageRef, isVisible: imageVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: certRef, isVisible: certVisible, getDelay } = useStaggeredAnimation(4, 100);

  const certifications = [
    {
      abbreviation: t("home.sustainability.cert1.abbr"),
      name: t("home.sustainability.cert1.name"),
      description: t("home.sustainability.cert1.desc"),
    },
    {
      abbreviation: t("home.sustainability.cert2.abbr"),
      name: t("home.sustainability.cert2.name"),
      description: t("home.sustainability.cert2.desc"),
    },
    {
      abbreviation: t("home.sustainability.cert3.abbr"),
      name: t("home.sustainability.cert3.name"),
      description: t("home.sustainability.cert3.desc"),
    },
    {
      abbreviation: t("home.sustainability.cert4.abbr"),
      name: t("home.sustainability.cert4.name"),
      description: t("home.sustainability.cert4.desc"),
    },
  ];

  return (
    <section className="section-inverse overflow-hidden">
      <div className="section-inner">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image column — two stacked images */}
          <div ref={imageRef} className="flex flex-col gap-4">
            <div
              className={`aspect-[4/3] overflow-hidden rounded-[var(--radius)] transition-all duration-1000 ease-out ${
                imageVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <img
                src={sustainabilityImage}
                alt="Sustainability"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div
              className={`aspect-[16/9] overflow-hidden rounded-[var(--radius)] transition-all duration-1000 ease-out ${
                imageVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
              style={{ transitionDelay: "200ms" }}
            >
              <img
                src={heritageCraftsmanship}
                alt="Craftsmanship detail"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>

          {/* Content column */}
          <div ref={contentRef}>
            <span
              className={`section-label transition-all duration-700 ease-out ${
                contentVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
            >
              {t("home.sustainability.label")}
            </span>
            <div className="flex items-start gap-4 mb-6">
              <span
                className={`w-1 bg-white/30 self-stretch transition-all duration-700 ${
                  contentVisible ? "opacity-100" : "opacity-0"
                }`}
                style={{ transitionDelay: "300ms" }}
              />
              <div className="text-5xl md:text-6xl lg:text-7xl text-white leading-[0.9]">
                <LetterReveal
                  text={t("home.sustainability.our")}
                  as="span"
                  className="font-light block"
                  isVisible={contentVisible}
                  startDelay={100}
                  letterDelay={60}
                />
                <LetterReveal
                  text={t("home.sustainability.commitment")}
                  as="span"
                  className="font-bold block"
                  isVisible={contentVisible}
                  startDelay={300}
                  letterDelay={40}
                />
              </div>
            </div>
            <p
              className={`text-white/70 leading-relaxed mb-8 transition-all duration-700 ease-out ${
                contentVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
              style={{ transitionDelay: "600ms" }}
            >
              {t("home.sustainability.body")}
            </p>

            {/* Certification cards */}
            <div ref={certRef} className="grid grid-cols-2 gap-4 mb-8">
              {certifications.map((cert, index) => (
                <div
                  key={cert.abbreviation}
                  className={`bg-white/[0.08] border border-white/[0.12] rounded-[var(--radius)] p-6 flex flex-col gap-3 transition-all duration-500 ease-out hover:bg-white/[0.12] hover:border-white/20 ${
                    certVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={getDelay(index)}
                >
                  <span className="text-3xl font-bold tracking-tight text-white/20">
                    {cert.abbreviation}
                  </span>
                  <span className="text-sm font-medium text-white/80">
                    {cert.name}
                  </span>
                  <span className="text-xs text-white/45 leading-relaxed">
                    {cert.description}
                  </span>
                </div>
              ))}
            </div>

            <Link
              to="/sustainability"
              className={`transition-all duration-700 ease-out inline-block ${
                contentVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
              style={{ transitionDelay: "700ms" }}
            >
              <Button variant="outline-inverse">{t("home.sustainability.learnMore")}</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SustainabilitySection;
