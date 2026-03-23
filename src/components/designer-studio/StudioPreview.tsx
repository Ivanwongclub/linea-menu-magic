import { MessageSquare, Layers, Share2 } from "lucide-react";

/**
 * A composed mock preview of a concept-board workspace.
 * Pure presentational — no interactivity or data dependencies.
 */
export default function StudioPreview() {
  return (
    <div className="relative w-full aspect-[4/3] select-none" aria-hidden="true">
      {/* Outer frame — workspace chrome */}
      <div className="absolute inset-0 border border-foreground/8 bg-background shadow-[0_8px_60px_-12px_hsl(var(--foreground)/0.08)]">
        
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-foreground/6 bg-secondary/60">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-foreground/10" />
            <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground/50 font-medium">
              Concept Board — SS26 Trim Review
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[8px] tracking-[0.12em] uppercase text-muted-foreground/30 font-medium flex items-center gap-1">
              <Share2 className="w-2.5 h-2.5" strokeWidth={1.5} />
              Shared
            </span>
            <span className="text-[8px] tracking-[0.12em] uppercase text-muted-foreground/30 font-medium">
              Variant 02
            </span>
          </div>
        </div>

        {/* Canvas area */}
        <div className="relative w-full" style={{ height: "calc(100% - 33px)" }}>
          {/* Faint grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Board background swatch — garment silhouette area */}
          <div className="absolute top-[10%] left-[6%] w-[52%] h-[75%] bg-secondary border border-foreground/5">
            {/* Faint garment silhouette suggestion */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[60%] h-[80%] border border-dashed border-foreground/6 flex items-center justify-center">
                <span className="text-[8px] tracking-[0.2em] uppercase text-muted-foreground/20 font-medium">
                  Placement zone
                </span>
              </div>
            </div>

            {/* Placed trim components */}
            <div className="absolute top-[18%] left-[22%] w-[22%] aspect-square bg-foreground/[0.04] border border-foreground/8 flex items-center justify-center">
              <div className="w-[70%] h-[70%] bg-foreground/[0.06] rounded-sm" />
            </div>
            <div className="absolute top-[52%] left-[35%] w-[16%] aspect-[3/2] bg-foreground/[0.04] border border-foreground/8 flex items-center justify-center">
              <div className="w-[60%] h-[50%] bg-foreground/[0.06] rounded-sm" />
            </div>
            <div className="absolute top-[30%] right-[12%] w-[14%] aspect-square bg-foreground/[0.04] border border-foreground/8 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-foreground/[0.07]" />
            </div>
          </div>

          {/* Annotation callout */}
          <div className="absolute top-[14%] right-[8%] max-w-[30%]">
            <div className="flex items-start gap-1.5">
              <MessageSquare className="w-3 h-3 text-foreground/20 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-[8px] font-medium text-foreground/40 leading-tight mb-0.5">
                  Collar trim — Option A
                </p>
                <p className="text-[7px] text-muted-foreground/30 leading-tight">
                  Nickel snap, brushed finish. Verify with sample lab before sign-off.
                </p>
              </div>
            </div>
            {/* Connector line */}
            <div className="w-px h-8 bg-foreground/8 ml-1.5 mt-1" />
          </div>

          {/* Review highlight marker */}
          <div className="absolute bottom-[22%] left-[62%] flex items-center gap-1.5">
            <div className="w-5 h-5 border-2 border-foreground/15 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
            </div>
            <span className="text-[7px] tracking-[0.1em] uppercase text-muted-foreground/30 font-medium">
              Review
            </span>
          </div>

          {/* Side panel — component library hint */}
          <div className="absolute top-[10%] right-[4%] w-[28%] h-[55%] border border-foreground/5 bg-background/80">
            <div className="px-3 py-2 border-b border-foreground/5">
              <div className="flex items-center gap-1.5">
                <Layers className="w-2.5 h-2.5 text-muted-foreground/30" strokeWidth={1.5} />
                <span className="text-[8px] tracking-[0.12em] uppercase text-muted-foreground/35 font-medium">
                  Components
                </span>
              </div>
            </div>
            <div className="p-2.5 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-foreground/[0.03] border border-foreground/6 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-1 bg-foreground/[0.06] w-3/4" />
                    <div className="h-1 bg-foreground/[0.04] w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom status bar */}
          <div className="absolute bottom-0 left-0 right-0 px-4 py-1.5 border-t border-foreground/5 bg-secondary/40 flex items-center justify-between">
            <span className="text-[7px] tracking-[0.12em] uppercase text-muted-foreground/25 font-medium">
              3 layers · 1 annotation
            </span>
            <span className="text-[7px] tracking-[0.12em] uppercase text-muted-foreground/25 font-medium">
              Shared presentation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
