import { useLayoutEffect, useRef, useState, useCallback } from "react";

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  disableTopOnRouteEntry?: boolean;
  topZonePx?: number;
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const {
    threshold = 0.12,
    rootMargin = "0px 0px -40px 0px",
    triggerOnce = true,
    disableTopOnRouteEntry = true,
    topZonePx = 600,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Respect prefers-reduced-motion — show immediately
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    // Route-entry UX: anything in the viewport at first layout shows immediately,
    // so above-the-fold content doesn't flash opacity 0 → 1 between paint and the
    // IntersectionObserver's first async callback. Below-fold content still fades in.
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const isRouteEntry = window.scrollY <= 8;
    const isInViewport = rect.top < viewportHeight && rect.bottom > 0;
    // topZonePx is retained as a stricter override (in case a caller wants only the
    // very top of the page bailed out); when omitted, viewport-fold is the boundary.
    const topZoneThreshold = Math.max(topZonePx, Math.floor(viewportHeight * 0.28));
    const isInTopZone = rect.top <= topZoneThreshold && rect.bottom > 0;
    if (triggerOnce && disableTopOnRouteEntry && isRouteEntry && (isInViewport || isInTopZone)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) observer.unobserve(element);
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, disableTopOnRouteEntry, topZonePx]);

  return { ref, isVisible };
};

// Stagger hook — pre-computes delay map, no new objects per render
export const useStaggeredAnimation = (itemCount: number, baseDelay = 80) => {
  const { ref, isVisible } = useScrollAnimation();

  // Static delay map — computed once, never reallocated
  const delays = useRef(
    Array.from({ length: Math.max(itemCount, 20) }, (_, i) => ({
      transitionDelay: `${i * baseDelay}ms`,
    }))
  );

  const getDelay = useCallback(
    (index: number) => delays.current[index] ?? delays.current[0],
    []
  );

  return { ref, isVisible, getDelay };
};
