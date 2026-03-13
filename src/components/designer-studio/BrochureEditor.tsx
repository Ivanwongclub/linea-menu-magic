import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Upload,
  ImageOff,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import PageManager from "@/components/designer-studio/PageManager";
import Header from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { useQuery } from "@tanstack/react-query";
import { useBrochureMutations } from "@/features/flipbook/hooks/useBrochureMutations";
import { uploadFlipbookImage } from "@/features/flipbook/upload";
import type { Brochure, BrochureStatus } from "@/features/flipbook/types";

import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateId(): string {
  // Simple UUID v4 without external dep
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/* ------------------------------------------------------------------ */
/*  Form state                                                         */
/* ------------------------------------------------------------------ */

interface FormState {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: BrochureStatus;
  cover_image_url: string | null;
}

const emptyForm = (id?: string): FormState => ({
  id: id ?? generateId(),
  title: "",
  slug: "",
  description: "",
  status: "draft",
  cover_image_url: null,
});

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface BrochureEditorProps {
  brochureId?: string; // undefined = new
  onBack: () => void;
}

export default function BrochureEditor({ brochureId, onBack }: BrochureEditorProps) {
  const isNew = !brochureId;
  const idForNew = useMemo(() => generateId(), []);
  const effectiveId = brochureId ?? idForNew;

  // Load existing brochure (only when editing)
  const { data: existing, isLoading } = useQuery<Brochure | null>({
    queryKey: ["flipbook-brochure-by-id", brochureId],
    enabled: !!brochureId,
    queryFn: async () => {
      if (!brochureId) return null;
      const { data, error } = await supabase
        .from("flipbook_brochures")
        .select("*")
        .eq("id", brochureId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { ...data, status: data.status as BrochureStatus };
    },
  });

  const { createBrochure, updateBrochure } = useBrochureMutations();

  const [form, setForm] = useState<FormState>(emptyForm(effectiveId));
  const [savedForm, setSavedForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Seed form from loaded brochure
  useEffect(() => {
    if (existing) {
      const loaded: FormState = {
        id: existing.id,
        title: existing.title,
        slug: existing.slug,
        description: existing.description ?? "",
        status: existing.status,
        cover_image_url: existing.cover_image_url,
      };
      setForm(loaded);
      setSavedForm(loaded);
      setSlugManuallyEdited(true); // existing brochure — don't auto-slug
    }
  }, [existing]);

  // Dirty check
  const isDirty = useMemo(() => {
    if (!savedForm && isNew) {
      return form.title.length > 0;
    }
    if (!savedForm) return false;
    return JSON.stringify(form) !== JSON.stringify(savedForm);
  }, [form, savedForm, isNew]);

  // Auto-generate slug from title
  const handleTitleChange = useCallback(
    (title: string) => {
      setForm((f) => ({
        ...f,
        title,
        slug: slugManuallyEdited ? f.slug : toSlug(title),
      }));
    },
    [slugManuallyEdited]
  );

  const handleSlugChange = useCallback((slug: string) => {
    setSlugManuallyEdited(true);
    setForm((f) => ({ ...f, slug: toSlug(slug) }));
  }, []);

  // Cover image upload
  const handleCoverFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      setCoverUploading(true);
      try {
        const url = await uploadFlipbookImage(file, effectiveId, `cover.${file.name.split(".").pop()}`);
        setForm((f) => ({ ...f, cover_image_url: url }));
        toast.success("Cover image uploaded");
      } catch {
        toast.error("Failed to upload cover image");
      } finally {
        setCoverUploading(false);
      }
    },
    [effectiveId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleCoverFile(file);
    },
    [handleCoverFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Slug uniqueness check
  const validateSlug = useCallback(
    async (slug: string): Promise<boolean> => {
      if (!slug) return false;
      const { data } = await supabase
        .from("flipbook_brochures")
        .select("id")
        .eq("slug", slug)
        .neq("id", effectiveId)
        .maybeSingle();
      return !data;
    },
    [effectiveId]
  );

  // Save
  const handleSave = useCallback(async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    const slugUnique = await validateSlug(form.slug);
    if (!slugUnique) {
      toast.error("This slug is already in use — choose a different one");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        status: form.status,
        cover_image_url: form.cover_image_url,
      };

      if (isNew || !savedForm) {
        await createBrochure.mutateAsync({ id: effectiveId, ...payload });
        toast.success("Brochure created");
      } else {
        await updateBrochure.mutateAsync({ id: effectiveId, ...payload });
        toast.success("Changes saved");
      }

      setSavedForm({ ...form });
    } catch {
      toast.error("Failed to save brochure");
    } finally {
      setSaving(false);
    }
  }, [form, isNew, savedForm, effectiveId, createBrochure, updateBrochure, validateSlug]);

  if (isLoading && brochureId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-5" />
              <h1 className="text-sm font-medium text-foreground truncate max-w-[300px]">
                {isNew ? "New Brochure" : form.title || "Untitled"}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {form.status === "published" && form.slug && (
                <a
                  href={`/brochures/${form.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  View live
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="gap-1.5 relative"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save changes
                {isDirty && !saving && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-destructive border-2 border-background" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-6 py-6">
        <div className="flex gap-6">
          {/* Left panel — metadata */}
          <div className="w-[320px] shrink-0 space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-medium">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Spring Collection 2025"
                className="h-9 text-sm"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="slug" className="text-xs font-medium">
                Slug
              </Label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap">/brochures/</span>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="spring-collection-2025"
                  className="h-9 text-sm font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description…"
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as BrochureStatus }))}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Cover image */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Cover Image</Label>

              {form.cover_image_url ? (
                <div className="relative rounded-lg border border-border overflow-hidden group">
                  <img
                    src={form.cover_image_url}
                    alt="Cover"
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <button
                    onClick={() => setForm((f) => ({ ...f, cover_image_url: null }))}
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-foreground/80 text-background opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove cover"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  ref={dropZoneRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer aspect-[3/4]"
                >
                  {coverUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground text-center px-4">
                        Drag & drop or click to upload
                      </span>
                    </>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverFile(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          {/* Right panel — page manager */}
          <div className="flex-1 min-w-0">
            <PageManager brochureId={effectiveId} />
          </div>
        </div>
      </main>
    </div>
  );
}
