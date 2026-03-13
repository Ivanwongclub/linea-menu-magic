import { useState, useCallback, useRef } from "react";
import HotlinkEditorModal from "@/components/designer-studio/HotlinkEditorModal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  Link2,
  Upload,
  Loader2,
  FileText,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

import { usePages, usePageMutations, type PageWithCount } from "@/features/flipbook/hooks/usePages";
import { uploadFlipbookImage, convertPdfToImages } from "@/features/flipbook/upload";

/* ------------------------------------------------------------------ */
/*  Sortable page row                                                   */
/* ------------------------------------------------------------------ */

interface SortablePageRowProps {
  page: PageWithCount;
  onDelete: (id: string) => void;
  onEditLinks: (id: string) => void;
}

function SortablePageRow({ page, onDelete, onEditLinks }: SortablePageRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hotlinkCount = page.hotlink_count ?? 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 group"
    >
      {/* Drag handle */}
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Page number */}
      <span className="text-xs font-medium text-muted-foreground w-6 text-center shrink-0">
        {page.page_number}
      </span>

      {/* Thumbnail */}
      <img
        src={page.image_url}
        alt={`Page ${page.page_number}`}
        className="w-[60px] aspect-[3/4] object-cover rounded border border-border shrink-0 bg-muted"
      />

      {/* Info */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {hotlinkCount > 0 && (
          <Badge variant="secondary" className="text-[10px] gap-1 shrink-0">
            <Link2 className="w-3 h-3" />
            {hotlinkCount} link{hotlinkCount !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={() => onEditLinks(page.id)}
        >
          <Link2 className="w-3 h-3" />
          Edit links
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(page.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Upload progress state                                               */
/* ------------------------------------------------------------------ */

interface UploadProgress {
  phase: "extracting" | "uploading";
  current: number;
  total: number;
  label: string;
}

/* ------------------------------------------------------------------ */
/*  Page Manager                                                        */
/* ------------------------------------------------------------------ */

interface PageManagerProps {
  brochureId: string;
  onEditLinks?: (pageId: string) => void;
}

export default function PageManager({ brochureId, onEditLinks }: PageManagerProps) {
  const { data: pages = [], isLoading } = usePages(brochureId);
  const { insertPage, deletePage, reorderPages } = usePageMutations(brochureId);

  // Hotlink editor modal state
  const [hotlinkPageId, setHotlinkPageId] = useState<string | null>(null);
  const hotlinkPage = hotlinkPageId ? pages.find((p) => p.id === hotlinkPageId) : null;

  const [localPages, setLocalPages] = useState<PageWithCount[] | null>(null);
  const displayPages = localPages ?? pages;

  // Keep localPages in sync when server data changes (and we're not mid-drag)
  const [isDragging, setIsDragging] = useState(false);
  if (!isDragging && localPages && JSON.stringify(localPages) !== JSON.stringify(pages)) {
    setLocalPages(null);
  }

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* ---------- Drag & drop reorder ---------- */

  const handleDragStart = useCallback(() => setIsDragging(true), []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDragging(false);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const current = localPages ?? pages;
      const oldIndex = current.findIndex((p) => p.id === active.id);
      const newIndex = current.findIndex((p) => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(current, oldIndex, newIndex).map((p, i) => ({
        ...p,
        page_number: i + 1,
      }));

      setLocalPages(reordered);

      reorderPages.mutate(
        reordered.map((p) => ({ id: p.id, page_number: p.page_number })),
        {
          onError: () => {
            setLocalPages(null);
            toast.error("Failed to reorder pages");
          },
          onSuccess: () => setLocalPages(null),
        }
      );
    },
    [localPages, pages, reorderPages]
  );

  /* ---------- Delete ---------- */

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deletePage.mutate(deleteTarget, {
      onSuccess: () => toast.success("Page deleted"),
      onError: () => toast.error("Failed to delete page"),
    });
    setDeleteTarget(null);
  }, [deleteTarget, deletePage]);

  /* ---------- File upload ---------- */

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArr = Array.from(files);
      const isPdf =
        fileArr.length === 1 && fileArr[0].type === "application/pdf";

      const currentMax = Math.max(0, ...pages.map((p) => p.page_number));

      try {
        if (isPdf) {
          // PDF flow
          setUploadProgress({
            phase: "extracting",
            current: 0,
            total: 1,
            label: "Preparing PDF…",
          });

          const blobs = await convertPdfToImages(fileArr[0], (cur, tot) => {
            setUploadProgress({
              phase: "extracting",
              current: cur,
              total: tot,
              label: `Extracting page ${cur} of ${tot}…`,
            });
          });

          // Upload extracted pages
          for (let i = 0; i < blobs.length; i++) {
            const pageNum = currentMax + i + 1;
            setUploadProgress({
              phase: "uploading",
              current: i + 1,
              total: blobs.length,
              label: `Uploading page ${i + 1} of ${blobs.length}…`,
            });

            const file = new File([blobs[i]], `page-${pageNum}.jpg`, {
              type: "image/jpeg",
            });
            const url = await uploadFlipbookImage(
              file,
              brochureId,
              `page-${pageNum}.jpg`
            );
            await insertPage.mutateAsync({
              brochure_id: brochureId,
              image_url: url,
              page_number: pageNum,
            });
          }

          toast.success(`${blobs.length} pages added from PDF`);
        } else {
          // Image files flow
          const imageFiles = fileArr.filter((f) =>
            ["image/jpeg", "image/png", "image/webp"].includes(f.type)
          );

          if (imageFiles.length === 0) {
            toast.error("Please upload JPG, PNG, or WebP images, or a single PDF");
            return;
          }

          for (let i = 0; i < imageFiles.length; i++) {
            const pageNum = currentMax + i + 1;
            setUploadProgress({
              phase: "uploading",
              current: i + 1,
              total: imageFiles.length,
              label: `Uploading image ${i + 1} of ${imageFiles.length}…`,
            });

            const ext = imageFiles[i].name.split(".").pop() ?? "jpg";
            const url = await uploadFlipbookImage(
              imageFiles[i],
              brochureId,
              `page-${pageNum}.${ext}`
            );
            await insertPage.mutateAsync({
              brochure_id: brochureId,
              image_url: url,
              page_number: pageNum,
            });
          }

          toast.success(
            `${imageFiles.length} page${imageFiles.length !== 1 ? "s" : ""} added`
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Upload failed — please try again");
      } finally {
        setUploadProgress(null);
      }
    },
    [brochureId, pages, insertPage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  /* ---------- Render ---------- */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const progressPercent = uploadProgress
    ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          Pages{" "}
          <span className="text-muted-foreground font-normal">
            ({displayPages.length})
          </span>
        </h3>
      </div>

      {/* Page list */}
      {displayPages.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayPages.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {displayPages.map((page) => (
                <SortablePageRow
                  key={page.id}
                  page={page}
                  onDelete={setDeleteTarget}
                  onEditLinks={(id) => setHotlinkPageId(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center py-12 text-center">
          <FileText className="w-8 h-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No pages yet</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            Upload images or a PDF below
          </p>
        </div>
      )}

      {/* Upload zone */}
      {uploadProgress ? (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs text-foreground font-medium">
              {uploadProgress.label}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 py-8"
        >
          <ImagePlus className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground text-center px-4">
            Drop images or a PDF here, or click to browse
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            JPG, PNG, WebP, or PDF
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete page?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this page and all its hotlinks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
