import type { HotLink } from "../types";

interface PageHotlinksProps {
  hotlinks: HotLink[];
  editHints?: boolean;
}

/**
 * Renders hotlink overlay areas on a flipbook page.
 * Reusable in both the viewer and CMS editor.
 */
const PageHotlinks = ({ hotlinks, editHints = false }: PageHotlinksProps) => {
  if (!hotlinks.length) return null;

  return (
    <>
      {hotlinks.map((hl) => {
        if (hl.x == null || hl.y == null || hl.width == null || hl.height == null) return null;

        if (editHints) {
          return (
            <div
              key={hl.id}
              className="absolute rounded-sm flex items-center justify-center pointer-events-none"
              style={{
                left: `${hl.x}%`,
                top: `${hl.y}%`,
                width: `${hl.width}%`,
                height: `${hl.height}%`,
                backgroundColor: "hsl(var(--primary) / 0.18)",
                border: "2px solid hsl(var(--primary) / 0.5)",
              }}
            >
              {hl.label && (
                <span className="text-[10px] font-medium text-primary truncate px-1">
                  {hl.label}
                </span>
              )}
            </div>
          );
        }

        return (
          <a
            key={hl.id}
            href={hl.url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute rounded-sm cursor-pointer group/hl"
            style={{
              left: `${hl.x}%`,
              top: `${hl.y}%`,
              width: `${hl.width}%`,
              height: `${hl.height}%`,
            }}
            title={hl.label ?? undefined}
          >
            {/* Hover border + glow */}
            <div
              className="absolute inset-0 rounded-sm opacity-0 group-hover/hl:opacity-100 transition-opacity duration-200"
              style={{
                border: "2px solid hsl(var(--primary) / 0.8)",
                boxShadow: "0 0 12px hsl(var(--primary) / 0.6)",
              }}
            />
            {/* Tooltip */}
            {hl.label && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-foreground text-background text-[11px] whitespace-nowrap opacity-0 group-hover/hl:opacity-100 transition-opacity duration-200 pointer-events-none">
                {hl.label}
              </div>
            )}
          </a>
        );
      })}
    </>
  );
};

export default PageHotlinks;
