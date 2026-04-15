interface BrandWordmarkProps {
  compact?: boolean;
  className?: string;
}

const BrandWordmark = ({ compact = false, className = "" }: BrandWordmarkProps) => {
  const primarySizeClass = compact
    ? "text-[22px] sm:text-[26px]"
    : "text-[22px] sm:text-[26px] lg:text-[28px]";
  const secondarySizeClass = compact
    ? "text-[10px] sm:text-[12px]"
    : "text-[10px] sm:text-[12px] lg:text-[16px]";

  return (
    <div className={`flex flex-col items-center leading-none select-none ${className}`.trim()}>
      <span className={`${primarySizeClass} font-extrabold tracking-[0.06em] text-black transition-colors duration-300`}>
        WIN-CYC
      </span>
      <span className={`${secondarySizeClass} tracking-[0.12em] uppercase text-black transition-colors duration-300`}>
        Group Limited
      </span>
    </div>
  );
};

export default BrandWordmark;
