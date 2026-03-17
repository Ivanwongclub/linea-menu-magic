import { Link } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import buttonsCategoryImg from "@/assets/products/buttons-category.jpg";
import hardwareCategoryImg from "@/assets/products/hardware-category.jpg";
import otherCategoryImg from "@/assets/products/other-category.jpg";
import zippersCategoryImg from "@/assets/products/zippers-category.jpg";
import laceCategoryImg from "@/assets/products/lace-category.jpg";

const slides = [
  {
    id: 1,
    label: "Products — Buttons",
    title: "Custom clothing",
    titleAccent: "buttons",
    subtitle: "unique, cost effective & sustainable",
    description:
      "From idea to finished trim. We successfully combine stylish trimming solutions, our own cost effective production facilities and a focus on fashion.",
    ctaText: "Learn More",
    ctaUrl: "/products?category=buttons",
    image: buttonsCategoryImg,
    bgColor: "#E8E4DC",
    textColor: "#1a1a1a",
  },
  {
    id: 2,
    label: "Products — Hardware",
    title: "Custom metal",
    titleAccent: "hardware",
    subtitle: "unique, cost effective & sustainable",
    description:
      "From idea to finished trim. We successfully combine stylish trimming solutions, our own cost effective production facilities and a focus on fashion.",
    ctaText: "Learn More",
    ctaUrl: "/products?category=hardware",
    image: hardwareCategoryImg,
    bgColor: "#D4D0C8",
    textColor: "#1a1a1a",
  },
  {
    id: 3,
    label: "Products — Webbing",
    title: "Custom webbing",
    titleAccent: "trims",
    subtitle: "unique, cost effective & sustainable",
    description:
      "From idea to finished trim. We successfully combine stylish trimming solutions, our own cost effective production facilities and a focus on fashion.",
    ctaText: "Learn More",
    ctaUrl: "/products?category=webbing",
    image: otherCategoryImg,
    bgColor: "#C8D4CC",
    textColor: "#1a1a1a",
  },
  {
    id: 4,
    label: "Products — Zippers",
    title: "Custom zipper",
    titleAccent: "pullers",
    subtitle: "unique, cost effective & sustainable",
    description:
      "From idea to finished trim. We successfully combine stylish trimming solutions, our own cost effective production facilities and a focus on fashion.",
    ctaText: "Learn More",
    ctaUrl: "/products?category=zipper-pullers",
    image: zippersCategoryImg,
    bgColor: "#D8D0C4",
    textColor: "#1a1a1a",
  },
  {
    id: 5,
    label: "Products — Lace",
    title: "Custom lace &",
    titleAccent: "trimmings",
    subtitle: "unique, cost effective & sustainable",
    description:
      "From idea to finished trim. We successfully combine stylish trimming solutions, our own cost effective production facilities and a focus on fashion.",
    ctaText: "Learn More",
    ctaUrl: "/products",
    image: laceCategoryImg,
    bgColor: "#E4DCD4",
    textColor: "#1a1a1a",
  },
  {
    id: 6,
    label: "Since 1979",
    title: "Timeless",
    titleAccent: "craftsmanship",
    subtitle: "匠心傳承 · 始於1979",
    description:
      "WIN-CYC Group has been crafting precision trims and accessories for the world's leading fashion brands since 1979.",
    ctaText: "Our Story",
    ctaUrl: "/about/our-story",
    image: null as string | null,
    bgColor: "#0a0a0a",
    textColor: "#ffffff",
  },
];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const parallaxOffset = scrollY * 0.4;
  const opacityFade = Math.max(0, 1 - scrollY / 600);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || index === current) return;
      setPrev(current);
      setCurrent(index);
      setIsTransitioning(true);
      setTimeout(() => {
        setPrev(null);
        setIsTransitioning(false);
      }, 700);
    },
    [isTransitioning, current]
  );

  const goNext = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, goTo]);

  const goPrev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, goTo]);

  useEffect(() => {
    if (isPaused || isTransitioning) return;
    intervalRef.current = setInterval(goNext, 5000);
    return () => clearInterval(intervalRef.current);
  }, [current, isPaused, isTransitioning, goNext]);

  return (
    <section
      className="relative w-full min-h-[90vh] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background color layer with transition */}
      <div
        className="absolute inset-0 transition-colors duration-700 ease-in-out"
        style={{ backgroundColor: slides[current].bgColor }}
      />
      {prev !== null && (
        <div
          className="absolute inset-0 animate-[fadeOut_700ms_ease-in-out_forwards]"
          style={{ backgroundColor: slides[prev].bgColor }}
        />
      )}

      {/* Slides */}
      {slides.map((slide, index) => {
        const isActive = index === current;
        const isPrevSlide = index === prev;
        const isVisible = isActive || isPrevSlide;

        return (
          <div
            key={slide.id}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{
              opacity: isActive ? 1 : isPrevSlide ? 0 : 0,
              pointerEvents: isActive ? "auto" : "none",
              zIndex: isActive ? 2 : isPrevSlide ? 1 : 0,
            }}
          >
            <div
              className="relative h-full min-h-[90vh] flex items-center"
              style={{
                transform: `translateY(${parallaxOffset * 0.15}px)`,
                opacity: opacityFade,
              }}
            >
              <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
                {/* LEFT: Text content */}
                <div className="lg:col-span-2 flex flex-col justify-center py-20 lg:py-0">
                  {/* Label */}
                  <p
                    className="text-xs font-medium uppercase tracking-[0.2em] mb-6 transition-all duration-500"
                    style={{
                      color: slide.textColor,
                      opacity: isVisible ? 0.5 : 0,
                      transform: isActive
                        ? "translateY(0)"
                        : "translateY(12px)",
                      transitionDelay: isActive ? "200ms" : "0ms",
                    }}
                  >
                    {slide.label}
                  </p>

                  {/* Title */}
                  <h1
                    className="text-4xl md:text-5xl lg:text-6xl font-light leading-[1.1] mb-2 transition-all duration-600"
                    style={{
                      color: slide.textColor,
                      opacity: isActive ? 1 : 0,
                      transform: isActive
                        ? "translateY(0)"
                        : "translateY(20px)",
                      transitionDelay: isActive ? "300ms" : "0ms",
                    }}
                  >
                    {slide.title}
                    <br />
                    <span className="font-bold italic">
                      {slide.titleAccent}
                    </span>
                  </h1>

                  {/* Subtitle */}
                  <p
                    className="text-sm uppercase tracking-[0.15em] mt-3 mb-6 transition-all duration-500"
                    style={{
                      color: slide.textColor,
                      opacity: isActive ? 0.6 : 0,
                      transform: isActive
                        ? "translateY(0)"
                        : "translateY(16px)",
                      transitionDelay: isActive ? "450ms" : "0ms",
                    }}
                  >
                    {slide.subtitle}
                  </p>

                  {/* Description */}
                  <p
                    className="text-sm leading-relaxed max-w-md mb-8 transition-all duration-500"
                    style={{
                      color: slide.textColor,
                      opacity: isActive ? 0.65 : 0,
                      transform: isActive
                        ? "translateY(0)"
                        : "translateY(16px)",
                      transitionDelay: isActive ? "550ms" : "0ms",
                    }}
                  >
                    {slide.description}
                  </p>

                  {/* CTA */}
                  <div
                    className="transition-all duration-500"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive
                        ? "translateY(0)"
                        : "translateY(16px)",
                      transitionDelay: isActive ? "650ms" : "0ms",
                    }}
                  >
                    <Link
                      to={slide.ctaUrl}
                      className="inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.1em] border-2 px-8 py-3 transition-all duration-200 hover:gap-5"
                      style={{
                        color: slide.textColor,
                        borderColor: slide.textColor,
                        background: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = slide.textColor;
                        e.currentTarget.style.color = slide.bgColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = slide.textColor;
                      }}
                    >
                      {slide.ctaText}
                      <span>→</span>
                    </Link>
                  </div>
                </div>

                {/* RIGHT: Image */}
                {slide.image && (
                  <div className="lg:col-span-3 relative flex items-center justify-center">
                    <img
                      src={slide.image}
                      alt={slide.label}
                      className="w-full h-auto max-h-[70vh] object-contain transition-all duration-700"
                      style={{
                        opacity: isActive ? 1 : 0,
                        transform: isActive
                          ? "translateX(0) scale(1)"
                          : "translateX(30px) scale(0.97)",
                        transitionDelay: isActive ? "200ms" : "0ms",
                      }}
                    />
                    {/* Left-edge gradient fade */}
                    <div
                      className="absolute inset-y-0 left-0 w-24 pointer-events-none"
                      style={{
                        background: `linear-gradient(to right, ${slide.bgColor}, transparent)`,
                      }}
                    />
                  </div>
                )}

                {/* Full-width text for image-less slides */}
                {!slide.image && <div className="lg:col-span-3" />}
              </div>
            </div>
          </div>
        );
      })}

      {/* LEFT ARROW */}
      <button
        onClick={goPrev}
        className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-200 hover:scale-110"
        style={{
          borderColor: slides[current].textColor + "33",
          color: slides[current].textColor,
          opacity: opacityFade * 0.7,
        }}
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>

      {/* RIGHT ARROW */}
      <button
        onClick={goNext}
        className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-200 hover:scale-110"
        style={{
          borderColor: slides[current].textColor + "33",
          color: slides[current].textColor,
          opacity: opacityFade * 0.7,
        }}
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* DOTS NAVIGATION */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2"
        style={{ opacity: opacityFade }}
      >
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            aria-label={`Go to slide ${index + 1}`}
            className="transition-all duration-300 rounded-full"
            style={{
              width: index === current ? "24px" : "6px",
              height: "6px",
              background: slides[current].textColor,
              opacity: index === current ? 0.9 : 0.3,
            }}
          />
        ))}
      </div>

      {/* SLIDE COUNTER */}
      <div
        className="absolute top-8 right-8 z-10 text-xs font-mono tracking-widest"
        style={{
          color: slides[current].textColor,
          opacity: opacityFade * 0.4,
        }}
      >
        {String(current + 1).padStart(2, "0")} /{" "}
        {String(slides.length).padStart(2, "0")}
      </div>
    </section>
  );
};

export default HeroSection;
