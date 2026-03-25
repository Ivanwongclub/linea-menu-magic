/**
 * Compact brand logo matching the site header's text-based logo.
 * Used in the flipbook viewer toolbar and loading screen.
 */

interface BrandLogoProps {
  maxHeight?: number;
  variant?: "light" | "dark";
  className?: string;
}

const BRAND_NAME = "WIN-CYC";
const BRAND_SUBTITLE = "Group Limited";

const BrandLogo = ({ maxHeight = 28, variant = "light", className = "" }: BrandLogoProps) => {
  const textColor = variant === "light" ? "text-white" : "text-foreground";
  const bgColor = variant === "light" ? "bg-white/15" : "bg-primary";
  const subtitleColor = variant === "light" ? "text-white/80" : "text-primary-foreground";
  const mainColor = variant === "light" ? "text-white" : "text-primary-foreground";

  // Scale font sizes proportionally to maxHeight
  const scale = maxHeight / 28;
  const mainSize = Math.max(10, Math.round(12 * scale));
  const subSize = Math.max(5, Math.round(7 * scale));

  return (
    <div
      className={`inline-flex items-center justify-center ${bgColor} ${className}`}
      style={{
        height: `${maxHeight}px`,
        paddingLeft: `${Math.round(12 * scale)}px`,
        paddingRight: `${Math.round(12 * scale)}px`,
      }}
    >
      <div className="flex flex-col items-center justify-center leading-none">
        <span
          className={`${mainColor} font-semibold`}
          style={{
            fontFamily: "'Poppins', sans-serif", fontWeight: 700, letterSpacing: '0.04em',
            fontSize: `${mainSize}px`,
          }}
        >
          {BRAND_NAME}
        </span>
        <span
          className={`${subtitleColor} uppercase`}
          style={{
            fontSize: `${subSize}px`,
            letterSpacing: "0.12em",
          }}
        >
          {BRAND_SUBTITLE}
        </span>
      </div>
    </div>
  );
};

export { BRAND_NAME };
export default BrandLogo;
