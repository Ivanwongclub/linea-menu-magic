import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface PrintImage {
  id: string;
  src: string;
  title: string;
  meta: string;
  tag: string;
}

const PRINT_IMAGES: PrintImage[] = [
  {
    id: "button",
    src: "/images/3dprint/3dprint-button-prototype.jpg",
    title: "4-Hole Button",
    meta: "SLA Resin · Scale 1:1 · 18mm diameter",
    tag: "Prototype 01",
  },
  {
    id: "buckle",
    src: "/images/3dprint/3dprint-buckle-prototype.jpg",
    title: "D-Ring Buckle",
    meta: "SLA Resin · Scale 1:1 · 32mm width",
    tag: "Prototype 02",
  },
  {
    id: "zipper",
    src: "/images/3dprint/3dprint-zipper-prototype.jpg",
    title: "Zipper Pull",
    meta: "SLA Resin · Scale 1:1 · 28mm length",
    tag: "Prototype 03",
  },
  {
    id: "snap",
    src: "/images/3dprint/3dprint-snap-prototype.jpg",
    title: "Snap Button Set",
    meta: "FDM Nylon · Cap + Socket · 15mm diameter",
    tag: "Prototype 07",
  },
];

interface PrintGalleryProps {
  open: boolean;
  onClose: () => void;
}

export default function PrintGallery({ open, onClose }: PrintGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const active = PRINT_IMAGES[activeIndex];

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + PRINT_IMAGES.length) % PRINT_IMAGES.length);
    setZoomed(false);
  }, []);

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % PRINT_IMAGES.length);
    setZoomed(false);
  }, []);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    },
    [onClose, prev, next]
  );

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onKeyDown={handleKey}
      tabIndex={-1}
      ref={(el) => el?.focus()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 flex flex-col bg-background border border-border shadow-2xl w-[95vw] max-w-[960px] max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              3D Printing Prototypes · {activeIndex + 1} / {PRINT_IMAGES.length}
            </p>
            <h3 className="text-[17px] font-semibold text-foreground mt-0.5 truncate">
              {active.title}
            </h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">{active.meta}</p>
          </div>

          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {/* Tag badge */}
            <span className="px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase border border-border text-muted-foreground">
              {active.tag}
            </span>
            {/* Zoom toggle */}
            <button
              onClick={() => setZoomed((v) => !v)}
              title={zoomed ? "Fit to window" : "Zoom in"}
              className={`w-8 h-8 flex items-center justify-center border transition-colors duration-150 ${
                zoomed
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              <ZoomIn size={14} />
            </button>
            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors duration-150"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Main image */}
        <div
          className={`flex-1 relative min-h-0 bg-secondary overflow-hidden ${
            zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
          }`}
        >
          <img
            src={active.src}
            alt={active.title}
            className={`w-full h-full transition-transform duration-300 ${
              zoomed ? "object-cover scale-150" : "object-contain"
            }`}
            onClick={() => setZoomed((v) => !v)}
          />

          {/* Prev / Next arrows */}
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-background/80 border border-border text-foreground hover:bg-background transition-colors duration-150"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-background/80 border border-border text-foreground hover:bg-background transition-colors duration-150"
          >
            <ChevronRight size={18} />
          </button>

          {/* Zoom hint */}
          {!zoomed && (
            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground bg-background/70 px-2 py-1 pointer-events-none">
              Click to zoom
            </p>
          )}
        </div>

        {/* Thumbnail strip */}
        <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 border-t border-border bg-background overflow-x-auto">
          {PRINT_IMAGES.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => { setActiveIndex(idx); setZoomed(false); }}
              className={`relative flex-shrink-0 w-[90px] h-[68px] overflow-hidden border-2 transition-all duration-200 ${
                idx === activeIndex
                  ? "border-foreground scale-105"
                  : "border-border opacity-60 hover:opacity-90 hover:border-foreground/30"
              }`}
            >
              <img src={img.src} alt={img.title} className="w-full h-full object-cover" />
            </button>
          ))}

          {/* Navigation hint */}
          <div className="ml-auto flex-shrink-0 text-right">
            <p className="text-[10px] text-muted-foreground">← → to navigate</p>
            <p className="text-[10px] text-muted-foreground">Esc to close</p>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-3 border-t border-border bg-secondary/50">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Prototypes are produced using SLA (stereolithography) and FDM (fused deposition modelling) 3D printing for rapid client review before tooling commitment. Typical turnaround: 24–48 hours from approved artwork.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
