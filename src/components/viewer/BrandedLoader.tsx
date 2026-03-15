import { useState, useEffect, useRef } from "react";
import BrandLogo from "./BrandLogo";

interface BrandedLoaderProps {
  totalToLoad: number;
  loadedCount: number;
  onComplete: () => void;
}

const BrandedLoader = ({ totalToLoad, loadedCount, onComplete }: BrandedLoaderProps) => {
  const [fadingOut, setFadingOut] = useState(false);
  const done = loadedCount >= totalToLoad;
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (done && !hasTriggered.current) {
      hasTriggered.current = true;
      setFadingOut(true);
      const timer = setTimeout(onComplete, 300);
      return () => clearTimeout(timer);
    }
  }, [done, onComplete]);

  const progress = totalToLoad > 0 ? Math.round((loadedCount / totalToLoad) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background dark:bg-gray-950 transition-all duration-300"
      style={{
        opacity: fadingOut ? 0 : 1,
        transform: fadingOut ? "scale(1.02)" : "scale(1)",
      }}
    >
      {/* Logo */}
      <BrandLogo maxHeight={48} variant="dark" />

      {/* Progress bar */}
      <div
        className="mt-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700"
        style={{ width: 280, height: 4 }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: "hsl(var(--accent))",
          }}
        />
      </div>

      {/* Loading text */}
      <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
    </div>
  );
};

export default BrandedLoader;
