import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const isFirst = useRef(true);

  useEffect(() => {
    // Skip scroll on initial mount (page may have scroll restoration)
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    // Delay scroll until after the next paint so new content is rendered first
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
