import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface StudioCapabilityTileProps {
  icon: LucideIcon;
  title: string;
  body: string;
  to?: string;
}

export default function StudioCapabilityTile({ icon: Icon, title, body, to }: StudioCapabilityTileProps) {
  const content = (
    <div
      className={`group relative border border-border bg-background p-6 lg:p-7 transition-all duration-300${
        to ? " hover:border-foreground hover:-translate-y-0.5" : ""
      }`}
    >
      <div
        className={`w-9 h-9 border border-border flex items-center justify-center mb-5 transition-colors duration-300${
          to ? " group-hover:bg-foreground group-hover:border-foreground" : ""
        }`}
      >
        <Icon
          className={`w-4 h-4 text-foreground transition-colors duration-300${
            to ? " group-hover:text-background" : ""
          }`}
          strokeWidth={1.5}
        />
      </div>
      <h3 className="text-sm font-semibold tracking-tight text-foreground mb-2">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );

  return to ? (
    <Link
      to={to}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  ) : (
    content
  );
}
