import { useState } from "react";
import type { HotLink } from "@/types/flipbook";

interface HotlinkOverlayProps {
  links: HotLink[];
  showHints: boolean;
}

const HotlinkOverlay = ({ links, showHints }: HotlinkOverlayProps) => {
  if (!links.length) return null;

  return (
    <div className="absolute inset-0 z-10">
      {links.map((link) => (
        <HotlinkItem key={link.id} link={link} showHint={showHints} />
      ))}
    </div>
  );
};

function HotlinkItem({ link, showHint }: { link: HotLink; showHint: boolean }) {
  const [hovered, setHovered] = useState(false);

  const isVisible = hovered || showHint;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute block transition-all duration-200"
      style={{
        left: `${link.x}%`,
        top: `${link.y}%`,
        width: `${link.width}%`,
        height: `${link.height}%`,
        border: isVisible ? "2px solid rgba(99, 102, 241, 0.6)" : "2px solid transparent",
        borderRadius: "4px",
        boxShadow: isVisible ? "0 0 12px rgba(99, 102, 241, 0.25), inset 0 0 8px rgba(99, 102, 241, 0.1)" : "none",
        backgroundColor: showHint ? "rgba(99, 102, 241, 0.08)" : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={link.label}
    >
      {/* Tooltip — shown above the hotlink */}
      {hovered && (
        <div
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none animate-fade-in"
          style={{
            bottom: "calc(100% + 6px)",
            backgroundColor: "rgba(15, 15, 26, 0.9)",
            color: "rgba(255,255,255,0.9)",
            fontSize: "11px",
            padding: "4px 10px",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {link.label}
        </div>
      )}
    </a>
  );
}

export default HotlinkOverlay;
