import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useI18n } from "@/features/i18n/I18nProvider";
import LetterReveal from "@/components/ui/LetterReveal";
import heritageCraftsmanship from "@/assets/heritage-craftsmanship.jpg";
import aboutShowroom from "@/assets/about-showroom.jpg";

const HeritageSection = () => {
  const { t } = useI18n();
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: imageRef, isVisible: imageVisible } = useScrollAnimation({ threshold: 0.3 });

  return (
    <section className="section-light overflow-hidden">
      <div className="section-inner">
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-16 items-center">
          {/* LEFT: Image column */}
          <div ref={imageRef} className="order-2 lg:order-1 relative">

            {/* Primary image */}
            <div
               className={`aspect-[3/4] overflow-hidden rounded-[var(--radius)] transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
                 imageVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.96]"
              }`}
            >
              <img
                src={heritageCraftsmanship}
                alt="Artisan craftsmanship"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>

            {/* Floating stat card — bottom-right overlapping */}
            <div
               className={`absolute -bottom-5 -right-5 bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] p-5 shadow-card hover-card transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
                 imageVisible ? "opacity-100 translate-x-0 translate-y-0" : "opacity-0 translate-x-4 translate-y-4"
              }`}
              style={{ transitionDelay: "400ms" }}
            >
              <span className="text-3xl font-semibold text-foreground block">45+</span>
              <p className="text-xs text-muted-foreground uppercase tracking-[0.08em] mt-1">
                {t("home.heritage.stat")}
              </p>
            </div>
          </div>

          {/* RIGHT: Text column */}
          <div ref={contentRef} className="order-1 lg:order-2">
            <span
               className={`section-label transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
                 contentVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
              }`}
            >
              {t("home.heritage.label")}
            </span>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
              <LetterReveal
                text={t("home.heritage.our")}
                as="span"
                className="text-outline inline-block mr-4"
                isVisible={contentVisible}
                startDelay={100}
                letterDelay={60}
              />
              <LetterReveal
                text={t("home.heritage.story")}
                as="span"
                className="inline-block font-serif-display"
                isVisible={contentVisible}
                startDelay={300}
                letterDelay={60}
              />
            </h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p
                 className={`transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
                   contentVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                }`}
                style={{ transitionDelay: "200ms" }}
              >
                {t("home.heritage.p1")}
              </p>
              <p
                 className={`transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
                   contentVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                }`}
                style={{ transitionDelay: "300ms" }}
              >
                {t("home.heritage.p2")}
              </p>
            </div>
            <div
               className={`mt-8 transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
                 contentVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
              }`}
              style={{ transitionDelay: "400ms" }}
            >
              <Link
                to="/about"
                className="group inline-flex items-center text-sm tracking-wider text-foreground link-elegant"
              >
                {t("home.heritage.discover")}
                <svg
                  className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Second image below text */}
            <div
               className={`mt-8 aspect-[16/9] overflow-hidden rounded-[var(--radius)] transition-[opacity,transform] duration-[680ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
                 contentVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.96]"
              }`}
              style={{ transitionDelay: "500ms" }}
            >
              <img
                src={aboutShowroom}
                alt="Showroom"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeritageSection;
