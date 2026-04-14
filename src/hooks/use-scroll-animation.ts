import { useEffect, useRef, useState, useCallback } from "react";

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const {
    threshold = 0.12,
    rootMargin = "0px 0px -40px 0px",
    triggerOnce = true,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Respect prefers-reduced-motion — show immediately
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
  }, [threshold, rootMargin, triggerOnce]);

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
