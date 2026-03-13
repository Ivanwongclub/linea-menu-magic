import { useState, useRef, useCallback, useEffect } from "react";
import { Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useHotlinks, useHotlinkMutations } from "@/features/flipbook/hooks/useHotlinks";
import type { HotLink } from "@/features/flipbook/types";

/* ------------------------------------------------------------------ */
/*  Drawing rectangle state                                             */
/* ------------------------------------------------------------------ */

interface DrawRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

function rectToPercent(
  draw: DrawRect,
  bounds: DOMRect
): { x: number; y: number; width: number; height: number } {
  const left = Math.min(draw.startX, draw.currentX);
  const top = Math.min(draw.startY, draw.currentY);
  const w = Math.abs(draw.currentX - draw.startX);
  const h = Math.abs(draw.currentY - draw.startY);

  return {
    x: ((left - bounds.left) / bounds.width) * 100,
    y: ((top - bounds.top) / bounds.height) * 100,
    width: (w / bounds.width) * 100,
    height: (h / bounds.height) * 100,
  };
}

/* ------------------------------------------------------------------ */
/*  Inline link form                                                    */
/* ------------------------------------------------------------------ */

interface LinkFormData {
  label: string;
  url: string;
}

interface InlineFormProps {
  initial?: LinkFormData;
  onSave: (data: LinkFormData) => void;
  onCancel: () => void;
  saving?: boolean;
}

function InlineLinkForm({ initial, onSave, onCancel, saving }: InlineFormProps) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-card border border-border rounded-lg shadow-lg p-4 w-80 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
      <div className="space-y-1.5">
        <Label className="text-xs">Label</Label>
        <Input
          placeholder="e.g. Product detail"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="h-8 text-sm"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">URL</Label>
        <Input
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => onSave({ label, url })}
          disabled={saving || (!label && !url)}
        >
          {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hotlink overlay item (with edit/delete controls)                     */
/* ------------------------------------------------------------------ */

interface HotlinkItemProps {
  hl: HotLink;
  onEdit: (hl: HotLink) => void;
  onDelete: (id: string) => void;
}

function HotlinkItem({ hl, onEdit, onDelete }: HotlinkItemProps) {
  const [hovered, setHovered] = useState(false);

  if (hl.x == null || hl.y == null || hl.width == null || hl.height == null) return null;

  return (
    <div
      className="absolute rounded-sm group/hl"
      style={{
        left: `${hl.x}%`,
        top: `${hl.y}%`,
        width: `${hl.width}%`,
        height: `${hl.height}%`,
        backgroundColor: "hsl(var(--primary) / 0.18)",
        border: "2px solid hsl(var(--primary) / 0.5)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Label */}
      {hl.label && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-primary truncate px-1 pointer-events-none">
          {hl.label}
        </span>
      )}

      {/* Edit / Delete controls */}
      {hovered && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex gap-1 z-20">
          <button
            className="h-6 w-6 rounded bg-card border border-border shadow flex items-center justify-center hover:bg-accent transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(hl);
            }}
          >
            <Pencil className="w-3 h-3 text-foreground" />
          </button>
          <button
            className="h-6 w-6 rounded bg-card border border-border shadow flex items-center justify-center hover:bg-destructive/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(hl.id);
            }}
          >
            <X className="w-3 h-3 text-destructive" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main modal                                                          */
/* ------------------------------------------------------------------ */

interface HotlinkEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  imageUrl: string;
  pageNumber: number;
}

export default function HotlinkEditorModal({
  open,
  onOpenChange,
  pageId,
  imageUrl,
  pageNumber,
}: HotlinkEditorModalProps) {
  const { data: hotlinks = [], isLoading } = useHotlinks(pageId);
  const { insertHotlink, updateHotlink, deleteHotlink } = useHotlinkMutations(pageId);

  const imageRef = useRef<HTMLImageElement>(null);
  const [drawing, setDrawing] = useState<DrawRect | null>(null);
  const [pendingRect, setPendingRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [editingHotlink, setEditingHotlink] = useState<HotLink | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setDrawing(null);
      setPendingRect(null);
      setEditingHotlink(null);
    }
  }, [open]);

  /* ---------- Drawing handlers ---------- */

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (editingHotlink || pendingRect) return;
      setDrawing({
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
      });
    },
    [editingHotlink, pendingRect]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!drawing) return;
      setDrawing((d) => (d ? { ...d, currentX: e.clientX, currentY: e.clientY } : null));
    },
    [drawing]
  );

  const handleMouseUp = useCallback(() => {
    if (!drawing || !imageRef.current) {
      setDrawing(null);
      return;
    }

    const bounds = imageRef.current.getBoundingClientRect();
    const rect = rectToPercent(drawing, bounds);

    // Ignore tiny accidental clicks (< 2% in either dimension)
    if (rect.width < 2 || rect.height < 2) {
      setDrawing(null);
      return;
    }

    setPendingRect(rect);
    setDrawing(null);
  }, [drawing]);

  /* ---------- Save new hotlink ---------- */

  const handleSaveNew = useCallback(
    async (form: LinkFormData) => {
      if (!pendingRect) return;
      setSaving(true);
      try {
        await insertHotlink.mutateAsync({
          page_id: pageId,
          label: form.label || null,
          url: form.url || null,
          ...pendingRect,
        });
        setPendingRect(null);
        toast.success("Hotlink added");
      } catch {
        toast.error("Failed to save hotlink");
      } finally {
        setSaving(false);
      }
    },
    [pendingRect, pageId, insertHotlink]
  );

  /* ---------- Update existing hotlink ---------- */

  const handleSaveEdit = useCallback(
    async (form: LinkFormData) => {
      if (!editingHotlink) return;
      setSaving(true);
      try {
        await updateHotlink.mutateAsync({
          id: editingHotlink.id,
          label: form.label || null,
          url: form.url || null,
        });
        setEditingHotlink(null);
        toast.success("Hotlink updated");
      } catch {
        toast.error("Failed to update hotlink");
      } finally {
        setSaving(false);
      }
    },
    [editingHotlink, updateHotlink]
  );

  /* ---------- Delete hotlink ---------- */

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteHotlink.mutateAsync(id);
        toast.success("Hotlink deleted");
      } catch {
        toast.error("Failed to delete hotlink");
      }
    },
    [deleteHotlink]
  );

  /* ---------- Drawing preview ---------- */

  const drawingPreview = drawing && imageRef.current
    ? (() => {
        const bounds = imageRef.current.getBoundingClientRect();
        const r = rectToPercent(drawing, bounds);
        return r;
      })()
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base">
              Edit hotlinks — Page {pageNumber}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Click and drag on the image to draw a hotlink area. Hover existing links to edit or delete.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          ) : (
            <div
              className="relative select-none"
              style={{ maxHeight: "80vh", cursor: pendingRect || editingHotlink ? "default" : "crosshair" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt={`Page ${pageNumber}`}
                className="max-h-[80vh] w-auto object-contain rounded border border-border pointer-events-none"
                draggable={false}
              />

              {/* Existing hotlinks */}
              {hotlinks.map((hl) => (
                <HotlinkItem
                  key={hl.id}
                  hl={hl}
                  onEdit={(h) => {
                    setPendingRect(null);
                    setEditingHotlink(h);
                  }}
                  onDelete={handleDelete}
                />
              ))}

              {/* Drawing preview */}
              {drawingPreview && (
                <div
                  className="absolute rounded-sm pointer-events-none"
                  style={{
                    left: `${drawingPreview.x}%`,
                    top: `${drawingPreview.y}%`,
                    width: `${drawingPreview.width}%`,
                    height: `${drawingPreview.height}%`,
                    backgroundColor: "hsl(var(--primary) / 0.15)",
                    border: "2px dashed hsl(var(--primary) / 0.7)",
                  }}
                />
              )}

              {/* Pending new rect */}
              {pendingRect && (
                <div
                  className="absolute rounded-sm pointer-events-none"
                  style={{
                    left: `${pendingRect.x}%`,
                    top: `${pendingRect.y}%`,
                    width: `${pendingRect.width}%`,
                    height: `${pendingRect.height}%`,
                    backgroundColor: "hsl(var(--primary) / 0.2)",
                    border: "2px solid hsl(var(--primary) / 0.8)",
                  }}
                />
              )}

              {/* Inline form for new hotlink */}
              {pendingRect && !editingHotlink && (
                <InlineLinkForm
                  onSave={handleSaveNew}
                  onCancel={() => setPendingRect(null)}
                  saving={saving}
                />
              )}

              {/* Inline form for editing existing hotlink */}
              {editingHotlink && (
                <InlineLinkForm
                  initial={{
                    label: editingHotlink.label ?? "",
                    url: editingHotlink.url ?? "",
                  }}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditingHotlink(null)}
                  saving={saving}
                />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
