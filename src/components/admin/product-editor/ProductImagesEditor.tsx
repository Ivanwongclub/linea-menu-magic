import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { GripVertical, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useI18n } from "@/features/i18n/I18nProvider";
import { getProductImageUrl } from "@/lib/productImage";
import { SortableList } from "@/components/admin/shared/SortableList";
import { describeSupabaseError } from "@/components/admin/shared/supabaseError";
import { useProductImages, type ProductImageRow } from "@/features/admin/hooks/useProductImages";

interface Draft {
  id: string;
  url: string;
  is_primary: boolean;
  alt_text: string;
}

const fromRow = (r: ProductImageRow): Draft => ({ id: r.id, url: r.url, is_primary: r.is_primary, alt_text: r.alt_text ?? "" });

/**
 * Product gallery: drop-zone upload (resized client-side), drag-to-reorder
 * grid, one primary, per-image alt text, delete that removes the file too.
 * Upload / primary / delete write immediately; order and alt text are
 * batched behind "Save images", like sizes and colours.
 */
export function ProductImagesEditor({ productId, productName }: { productId: string; productName: string }) {
  const { t } = useI18n();
  const { query, upload, setPrimary, saveOrderAndAlt, remove } = useProductImages(productId);

  const initial = useMemo(() => (query.data ?? []).map(fromRow), [query.data]);
  // Unsaved edits live apart from server rows so a refetch (after an upload,
  // a primary change or a delete — all immediate writes) never discards
  // alt text someone is still typing or an order they have just dragged.
  const [altEdits, setAltEdits] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<string[] | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProductImageRow | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // When the set of images changes (upload/delete), fall back to server
  // order but keep alt edits for images that still exist.
  useEffect(() => {
    const ids = new Set(initial.map((d) => d.id));
    setAltEdits((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => ids.has(id))));
    setOrder((prev) => (prev && prev.length === initial.length && prev.every((id) => ids.has(id)) ? prev : null));
  }, [initial]);

  const drafts: Draft[] = useMemo(() => {
    const byId = new Map(initial.map((d) => [d.id, d]));
    const ids = order ?? initial.map((d) => d.id);
    return ids
      .map((id) => byId.get(id))
      .filter((d): d is Draft => !!d)
      .map((d) => (d.id in altEdits ? { ...d, alt_text: altEdits[d.id] } : d));
  }, [initial, order, altEdits]);
  const setDrafts = (next: Draft[]) => setOrder(next.map((d) => d.id));
  const dirty = Object.keys(altEdits).length > 0;

  const onError = (error: unknown) => toast.error(describeSupabaseError(error as { message: string; code?: string }, t));

  const handleFiles = (list: FileList | File[] | null) => {
    const files = Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
    const rejected = Array.from(list ?? []).filter((f) => !f.type.startsWith("image/"));
    rejected.forEach((f) => toast.error(t("admin.images.rejected", { name: f.name })));
    if (files.length === 0) return;
    upload.mutate(
      { files, productName },
      {
        onSuccess: (outcomes) => {
          const ok = outcomes.filter((o) => o.ok).length;
          if (ok > 0) toast.success(t("admin.images.uploaded", { count: ok }));
          outcomes.filter((o) => !o.ok).forEach((o) => toast.error(`${o.name}: ${o.error}`));
        },
        onError,
      },
    );
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSave = () => {
    saveOrderAndAlt.mutate(
      drafts.map((d, i) => ({ id: d.id, sort_order: i, alt_text: d.alt_text.trim() || null })),
      {
        onSuccess: () => {
          setAltEdits({});
          setOrder(null);
          toast.success(t("admin.images.saved"));
        },
        onError,
      },
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const row = pendingDelete;
    setPendingDelete(null);
    remove.mutate(row, {
      onSuccess: ({ fileWasGone }) => toast.success(t(fileWasGone ? "admin.images.deletedRowOnly" : "admin.images.deleted")),
      onError,
    });
  };

  const busy = upload.isPending || setPrimary.isPending || remove.isPending || saveOrderAndAlt.isPending;

  return (
    <div className="space-y-4" data-testid="images-section">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        data-testid="image-dropzone"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "border border-dashed p-6 text-center cursor-pointer transition-colors",
          dragOver ? "border-foreground bg-secondary/40" : "border-border hover:border-foreground/50",
        )}
      >
        <input
          ref={inputRef}
          data-testid="image-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {upload.isPending ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> {t("admin.images.uploading")}
          </div>
        ) : (
          <div className="space-y-1">
            <ImagePlus className="w-5 h-5 mx-auto text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-foreground">{t("admin.images.drop")}</p>
            <p className="text-xs text-muted-foreground">{t("admin.images.resizeNote")}</p>
          </div>
        )}
      </div>

      {/* Grid */}
      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("admin.common.loading")}</p>
      ) : drafts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.images.empty")}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <SortableList
            items={drafts}
            getId={(d) => d.id}
            onReorder={setDrafts}
            layout="grid"
            renderItem={(d, dragHandleProps) => {
              const row = (query.data ?? []).find((r) => r.id === d.id);
              return (
                <div data-testid="product-image" data-image-id={d.id} className={cn("border p-2 space-y-2 bg-background", d.is_primary ? "border-foreground" : "border-border")}>
                  <div className="relative aspect-square bg-secondary/40 overflow-hidden">
                    <img src={getProductImageUrl(d.url, "thumb")} alt={d.alt_text} className="w-full h-full object-contain" loading="lazy" />
                    <button
                      type="button"
                      className="absolute top-1 left-1 p-1 bg-background/80 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
                      aria-label={t("admin.common.dragToReorder")}
                      {...dragHandleProps}
                    >
                      <GripVertical className="w-4 h-4" />
                    </button>
                    {d.is_primary && (
                      <span className="absolute top-1 right-1 text-[10px] uppercase tracking-wider bg-foreground text-background px-1.5 py-0.5">
                        {t("admin.images.primary")}
                      </span>
                    )}
                  </div>
                  <Input
                    data-testid="image-alt"
                    className="rounded-none h-8 text-xs"
                    placeholder={t("admin.images.alt")}
                    value={d.alt_text}
                    onChange={(e) => setAltEdits((prev) => ({ ...prev, [d.id]: e.target.value }))}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name={`primary-image-${productId}`}
                        checked={d.is_primary}
                        disabled={busy}
                        onChange={() => setPrimary.mutate(d.id, { onSuccess: () => toast.success(t("admin.images.primarySet")), onError })}
                        className="accent-foreground"
                        aria-label={t("admin.images.makePrimary")}
                      />
                      {t("admin.images.primary")}
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      aria-label={t("admin.images.delete")}
                      disabled={busy}
                      onClick={() => row && setPendingDelete(row)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            }}
          />
        </div>
      )}

      {drafts.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{t("admin.images.altHint")}</p>
          <Button size="sm" className="rounded-none" disabled={!dirty && !orderChanged(drafts, initial) || busy} onClick={handleSave}>
            {saveOrderAndAlt.isPending ? t("admin.common.saving") : t("admin.images.save")}
          </Button>
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.images.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.images.deleteBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("admin.common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function orderChanged(drafts: Draft[], initial: Draft[]): boolean {
  return drafts.map((d) => d.id).join() !== initial.map((d) => d.id).join();
}
