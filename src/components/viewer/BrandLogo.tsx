/**
 * Compact brand logo matching the site header's image-based logo.
 * Used in the flipbook viewer toolbar and loading screen.
 */

interface BrandLogoProps {
  maxHeight?: number;
  variant?: "light" | "dark";
  className?: string;
}

const BRAND_NAME = "WIN-CYC";

const BrandLogo = ({ maxHeight = 28, variant = "light", className = "" }: BrandLogoProps) => {
  const src = variant === "light" ? "/wincyc-white.svg" : "/wincyc.svg";

  return (
    <img
      src={src}
      alt="WIN-CYC Group Limited"
      className={className}
      style={{ height: `${maxHeight}px`, width: "auto" }}
    />
  );
};

export { BRAND_NAME };
export default BrandLogo;
