import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { getProductImageUrl } from '@/lib/productImage';
import { useI18n } from '@/features/i18n/I18nProvider';
import type { ProductImage } from '@/features/products/types';

interface Props {
  images: ProductImage[];
  productName: string;
  itemCode?: string | null;
  categoryName?: string | null;
  has3D?: boolean;
  onOpen3D?: () => void;
}

const ZOOM = 2.5;

/**
 * Product gallery: a hero, a thumbnail strip beneath it, and a lightbox
 * that zooms. Trim buyers judge surface texture and edge finish, so the
 * lightbox requests the full 1600px master rather than the 800px hero.
 *
 * Order comes from `sort_order`; the hero opens on the image flagged
 * `is_primary`. The two fields are independent in the CMS, so neither
 * overrides the other. `alt_text` is used when an editor wrote one.
 *
 * With no images the gallery renders a deliberate empty state, never a
 * stand-in photograph of another product. Most of the catalogue is in that
 * position until photography arrives.
 */
export default function ProductGallery({ images, productName, itemCode, categoryName, has3D = false, onOpen3D }: Props) {
  const { t } = useI18n();

  const ordered = useMemo(() => [...images].sort((a, b) => a.sort_order - b.sort_order), [images]);
  const primaryIndex = Math.max(0, ordered.findIndex((img) => img.is_primary));
  const [active, setActive] = useState(primaryIndex);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  // A different product (or a newly loaded gallery) reopens on its primary.
  useEffect(() => setActive(primaryIndex), [primaryIndex, ordered.length]);

  const describe = useCallback(
    (img: ProductImage, i: number) => img.alt_text?.trim() || `${productName} — ${t('product.gallery.view')} ${i + 1}`,
    [productName, t],
  );

  // Changing image resets the zoom in the SAME update, so the incoming
  // image never renders zoomed for a frame before snapping back.
  const goTo = useCallback((next: number) => {
    setZoomed(false);
    setOrigin({ x: 50, y: 50 });
    setActive(next);
  }, []);

  const step = useCallback(
    (delta: number) => {
      setZoomed(false);
      setOrigin({ x: 50, y: 50 });
      setActive((i) => (ordered.length ? (i + delta + ordered.length) % ordered.length : 0));
    },
    [ordered.length],
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, step]);

  // Opening or closing the lightbox always starts unzoomed.
  useEffect(() => {
    setZoomed(false);
    setOrigin({ x: 50, y: 50 });
  }, [lightboxOpen]);

  /* ── No photography yet ───────────────────────────────── */
  if (ordered.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div
          data-testid="gallery-empty"
          className="aspect-square border border-border bg-secondary flex flex-col items-center justify-center text-center px-8 gap-4"
        >
          <div className="h-11 w-11 border border-foreground/20 flex items-center justify-center">
            <Camera className="h-4 w-4 text-foreground/40" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t('product.gallery.noPhotography')}
            </p>
            {categoryName && <p className="text-sm text-foreground">{categoryName}</p>}
            {itemCode && <p className="text-[11px] font-mono text-muted-foreground">{itemCode}</p>}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[30ch]">
            {t('product.gallery.sampleOnRequest')}
          </p>
        </div>
        {has3D && onOpen3D && (
          <button
            type="button"
            onClick={onOpen3D}
            className="h-16 w-16 flex flex-col items-center justify-center gap-1 border border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <Box className="h-4 w-4" aria-hidden="true" />
            <span className="text-[8px] uppercase tracking-wider font-medium">3D</span>
          </button>
        )}
      </div>
    );
  }

  const current = ordered[active] ?? ordered[0];
  const showStrip = ordered.length > 1 || (has3D && !!onOpen3D);

  return (
    <div className="flex flex-col gap-3">
      {/* Hero */}
      <button
        type="button"
        data-testid="gallery-hero"
        onClick={() => setLightboxOpen(true)}
        aria-label={t('product.gallery.viewLarger')}
        className="group aspect-square overflow-hidden bg-secondary/30 border border-border relative cursor-zoom-in"
      >
        <img
          src={getProductImageUrl(current.url, 'pdp')}
          alt={describe(current, active)}
          loading="eager"
          decoding="async"
          className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute bottom-3 right-3 text-[10px] uppercase tracking-[0.12em] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-background/85 px-2 py-1">
          {t('product.gallery.viewLarger')}
        </span>
      </button>

      {/* Thumbnails — below the hero, never rendered empty */}
      {showStrip && (
        <div data-testid="gallery-strip" className="flex gap-2 overflow-x-auto pb-1">
          {ordered.map((img, i) => (
            <button
              key={img.id}
              type="button"
              data-testid="gallery-thumb"
              onClick={() => goTo(i)}
              aria-label={describe(img, i)}
              aria-current={i === active}
              className={`shrink-0 h-16 w-16 overflow-hidden border transition-all duration-200 ${
                i === active ? 'border-foreground' : 'border-border opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={getProductImageUrl(img.url, 'thumb')}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
          {has3D && onOpen3D && (
            <button
              type="button"
              onClick={onOpen3D}
              className="shrink-0 h-16 w-16 flex flex-col items-center justify-center gap-1 border border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              <Box className="h-4 w-4" aria-hidden="true" />
              <span className="text-[8px] uppercase tracking-wider font-medium">3D</span>
            </button>
          )}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[94vw] w-[94vw] h-[92vh] p-0 bg-background flex flex-col gap-0">
          <DialogTitle className="sr-only">{describe(current, active)}</DialogTitle>

          <div
            data-testid="gallery-lightbox"
            className="flex-1 overflow-hidden flex items-center justify-center bg-secondary/20"
          >
            <img
              src={getProductImageUrl(current.url, 'zoom')}
              alt={describe(current, active)}
              data-zoomed={zoomed}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setOrigin({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
                setZoomed((z) => !z);
              }}
              onMouseMove={(e) => {
                if (!zoomed) return;
                const r = e.currentTarget.getBoundingClientRect();
                setOrigin({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
              }}
              style={{ transformOrigin: `${origin.x}% ${origin.y}%`, transform: `scale(${zoomed ? ZOOM : 1})` }}
              className={`max-h-full max-w-full object-contain transition-transform duration-300 ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            />
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-3 shrink-0">
            <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {zoomed ? t('product.gallery.zoomOutHint') : t('product.gallery.zoomInHint')}
            </span>
            {ordered.length > 1 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label={t('product.gallery.previous')}
                  className="p-1.5 border border-border hover:border-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span data-testid="gallery-counter" className="text-[11px] font-mono text-muted-foreground tabular-nums">
                  {active + 1} / {ordered.length}
                </span>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label={t('product.gallery.next')}
                  className="p-1.5 border border-border hover:border-foreground transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
