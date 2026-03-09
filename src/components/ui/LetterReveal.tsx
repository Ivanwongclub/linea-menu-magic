import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useRef, useMemo } from "react";

interface LetterRevealProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
  className?: string;
  /** Delay in ms before the first letter starts revealing */
  startDelay?: number;
  /** Delay in ms between each letter */
  letterDelay?: number;
  /** IntersectionObserver threshold */
  threshold?: number;
  /** If provided, uses an external visibility flag instead of its own observer */
  isVisible?: boolean;
  /** Ref to attach the observer to (use with isVisible) */
  observerRef?: React.RefObject<HTMLDivElement>;
}

const LetterReveal = ({
  text,
  as: Tag = "h2",
  className = "",
  startDelay = 0,
  letterDelay = 30,
  threshold = 0.2,
  isVisible: externalVisible,
  observerRef,
}: LetterRevealProps) => {
  const { ref: internalRef, isVisible: internalVisible } = useScrollAnimation({ threshold });

  const isVisible = externalVisible !== undefined ? externalVisible : internalVisible;
  const ref = observerRef || internalRef;

  // Split text into lines (by \n) then characters, preserving spaces
  const lines = useMemo(() => {
    return text.split("\n").map((line) =>
      line.split("").map((char) => char)
    );
  }, [text]);

  let globalIndex = 0;

  return (
    <Tag ref={ref as any} className={className} aria-label={text}>
      {lines.map((chars, lineIndex) => (
        <span key={lineIndex} className={lineIndex > 0 ? "block" : undefined}>
          {chars.map((char, charIndex) => {
            const currentIndex = globalIndex++;
            const delay = startDelay + currentIndex * letterDelay;
            return (
              <span
                key={`${lineIndex}-${charIndex}`}
                className="inline-block transition-all duration-500 ease-out"
                style={{
                  transitionDelay: `${delay}ms`,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(0.3em)",
                  // Preserve spaces
                  ...(char === " " ? { width: "0.3em" } : {}),
                }}
                aria-hidden="true"
              >
                {char === " " ? "\u00A0" : char}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
};

export default LetterReveal;
