import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Save, Loader2, Plus, Trash2, GripVertical, Star, ImagePlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { useProductTaxonomy } from "@/features/products/hooks/useProductTaxonomy";

/* ── Key-value editor ────────────────────────────────────── */

function KeyValueEditor({
  label,
  data,
  onChange,
}: {
  label: string;
  data: Record<string, string>;
  onChange: (d: Record<string, string>) => void;
}) {
  const entries = Object.entries(data);

  const updateKey = (oldKey: string, newKey: string) => {
    const next: Record<string, string> = {};
    for (const [k, v] of entries) {
      next[k === oldKey ? newKey : k] = v;
    }
    onChange(next);
  };

  const updateValue = (key: string, value: string) => {
    onChange({ ...data, [key]: value });
  };

  const addRow = () => {
    onChange({ ...data, "": "" });
  };

  const removeRow = (key: string) => {
    const next = { ...data };
    delete next[key];
    onChange(next);
  };

  return (
    <div>
      <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</Label>
      <div className="space-y-2 mt-2">
        {entries.map(([key, value], i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder="Key"
              value={key}
              onChange={(e) => updateKey(key, e.target.value)}
              className="h-8 text-sm flex-1"
            />
            <Input
              placeholder="Value"
              value={value}
              onChange={(e) => updateValue(key, e.target.value)}
              className="h-8 text-sm flex-[2]"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeRow(key)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={addRow}>
          <Plus className="w-3 h-3" /> Add field
        </Button>
      </div>
    </div>
  );
}

/* ── Slug generator ──────────────────────────────────────── */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ── Main editor ─────────────────────────────────────────── */

interface ProductEditorProps {
  productId?: string; // undefined = new
  onBack: () => void;
}

export default function ProductEditor({ productId, onBack }: ProductEditorProps) {
  const taxonomy = useProductTaxonomy();
  const isNew = !productId;

  // Form state
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!productId);
  const [itemCode, setItemCode] = useState("");
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "archived">("draft");
  const [isPublic, setIsPublic] = useState(true);
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [specifications, setSpecifications] = useState<Record<string, string>>({});
  const [production, setProduction] = useState<Record<string, string>>({});
  const [modelUrl, setModelUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  // Taxonomy selections
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string>("");
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [selectedIndustries, setSelectedIndustries] = useState<Set<string>>(new Set());
  const [selectedCertifications, setSelectedCertifications] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // Images
  const [images, setImages] = useState<{ id: string; url: string; sort_order: number; is_primary: boolean }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  // Auto-generate slug from nameEn
  useEffect(() => {
    if (isNew && nameEn) {
      setSlug(slugify(nameEn));
    }
  }, [nameEn, isNew]);

  // Load existing product
  useEffect(() => {
    if (!productId) return;
    (async () => {
      setLoading(true);
      const { data: row, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (error || !row) {
        toast.error("Failed to load product");
        onBack();
        return;
      }

      setItemCode(row.item_code ?? "");
      setName(row.name ?? "");
      setNameEn(row.name_en ?? "");
      setSlug(row.slug ?? "");
      setDescription(row.description ?? "");
      setDescriptionEn(row.description_en ?? "");
      setStatus(row.status as typeof status);
      setIsPublic(row.is_public);
      setIsCustomizable(row.is_customizable);
      setSpecifications((row.specifications as Record<string, string>) ?? {});
      setProduction((row.production as Record<string, string>) ?? {});
      setModelUrl(row.model_url ?? "");
      setThumbnailUrl(row.thumbnail_url ?? "");

      // Load relations
      const [catRes, matRes, indRes, certRes, tagRes, imgRes] = await Promise.all([
        supabase.from("product_category_map").select("category_id, is_primary").eq("product_id", productId),
        supabase.from("product_material_map").select("material_id").eq("product_id", productId),
        supabase.from("product_industry_map").select("industry_id").eq("product_id", productId),
        supabase.from("product_certification_map").select("certification_id").eq("product_id", productId),
        supabase.from("product_tag_map").select("tag_id").eq("product_id", productId),
        supabase.from("product_images").select("id, url, sort_order, is_primary").eq("product_id", productId).order("sort_order"),
      ]);

      if (catRes.data) {
        setSelectedCategories(new Set(catRes.data.map((r) => r.category_id)));
        const primary = catRes.data.find((r) => r.is_primary);
        if (primary) setPrimaryCategoryId(primary.category_id);
      }
      if (matRes.data) setSelectedMaterials(new Set(matRes.data.map((r) => r.material_id)));
      if (indRes.data) setSelectedIndustries(new Set(indRes.data.map((r) => r.industry_id)));
      if (certRes.data) setSelectedCertifications(new Set(certRes.data.map((r) => r.certification_id)));
      if (tagRes.data) setSelectedTags(new Set(tagRes.data.map((r) => r.tag_id)));
      if (imgRes.data) setImages(imgRes.data);

      setLoading(false);
    })();
  }, [productId]);

  // Save
  const handleSave = async () => {
    if (!name || !slug) {
      toast.error("Name and slug are required");
      return;
    }
    setSaving(true);

    try {
      let pid = productId;

      const productData = {
        item_code: itemCode || null,
        name,
        name_en: nameEn || null,
        slug,
        description: description || null,
        description_en: descriptionEn || null,
        status,
        is_public: isPublic,
        is_customizable: isCustomizable,
        specifications: Object.keys(specifications).length ? specifications : null,
        production: Object.keys(production).length ? production : null,
        model_url: modelUrl || null,
        thumbnail_url: thumbnailUrl || null,
      };

      if (isNew) {
        const { data, error } = await supabase
          .from("products")
          .insert(productData)
          .select("id")
          .single();
        if (error) throw error;
        pid = data.id;
      } else {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", pid!);
        if (error) throw error;
      }

      // Sync junction tables
      await Promise.all([
        syncJunction("product_category_map", "category_id", pid!, selectedCategories, primaryCategoryId),
        syncSimpleJunction("product_material_map", "material_id", pid!, selectedMaterials),
        syncSimpleJunction("product_industry_map", "industry_id", pid!, selectedIndustries),
        syncSimpleJunction("product_certification_map", "certification_id", pid!, selectedCertifications),
        syncSimpleJunction("product_tag_map", "tag_id", pid!, selectedTags),
      ]);

      toast.success(isNew ? "Product created" : "Product saved");
      onBack();
    } catch (err: unknown) {
      toast.error(`Save failed: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !productId) return;
    setUploadingImage(true);

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `images/${productId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-assets")
        .upload(path, file, { upsert: true, cacheControl: "31536000" });
      if (uploadError) {
        toast.error(`Upload failed: ${file.name}`);
        continue;
      }
      const { data: urlData } = supabase.storage.from("product-assets").getPublicUrl(path);
      const newSortOrder = images.length;
      const { data: imgRow, error: insertError } = await supabase
        .from("product_images")
        .insert({
          product_id: productId,
          url: urlData.publicUrl,
          sort_order: newSortOrder,
          is_primary: images.length === 0,
        })
        .select("id, url, sort_order, is_primary")
        .single();
      if (!insertError && imgRow) {
        setImages((prev) => [...prev, imgRow]);
      }
    }
    setUploadingImage(false);
    e.target.value = "";
  };

  // Thumbnail upload
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !productId) return;
    setUploadingThumb(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `thumbnails/${productId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("product-assets")
      .upload(path, file, { upsert: true, cacheControl: "31536000" });
    if (error) {
      toast.error("Thumbnail upload failed");
    } else {
      const { data: urlData } = supabase.storage.from("product-assets").getPublicUrl(path);
      setThumbnailUrl(urlData.publicUrl);
    }
    setUploadingThumb(false);
    e.target.value = "";
  };

  // Delete image
  const handleDeleteImage = async (imgId: string) => {
    await supabase.from("product_images").delete().eq("id", imgId);
    setImages((prev) => prev.filter((i) => i.id !== imgId));
  };

  // Set primary image
  const handleSetPrimary = async (imgId: string) => {
    if (!productId) return;
    await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
    await supabase.from("product_images").update({ is_primary: true }).eq("id", imgId);
    setImages((prev) =>
      prev.map((i) => ({ ...i, is_primary: i.id === imgId }))
    );
  };

  const toggleSet = (set: Set<string>, id: string): Set<string> => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-20 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-sm font-semibold">{isNew ? "New Product" : "Edit Product"}</h1>
          </div>
          <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isNew ? "Create" : "Save"}
          </Button>
        </div>
      </div>

      {/* Editor body */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* LEFT */}
          <div className="space-y-6">
            {/* Basic info */}
            <section className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Item Code</Label>
                  <Input value={itemCode} onChange={(e) => setItemCode(e.target.value)} className="h-9 text-sm font-mono" placeholder="Auto-generated or manual" />
                </div>
                <div>
                  <Label className="text-xs">Slug</Label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="h-9 text-sm font-mono" placeholder="product-slug" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Name (Chinese)</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Name (English)</Label>
                  <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="h-9 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="text-sm min-h-[80px]" />
              </div>
              <div>
                <Label className="text-xs">Description (English)</Label>
                <Textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} className="text-sm min-h-[80px]" />
              </div>
            </section>

            <Separator />

            {/* Status & toggles */}
            <section className="flex items-center gap-6 flex-wrap">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger className="w-32 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                <Label className="text-xs">Public</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isCustomizable} onCheckedChange={setIsCustomizable} />
                <Label className="text-xs">Customizable</Label>
              </div>
            </section>

            <Separator />

            {/* Specifications */}
            <KeyValueEditor label="Specifications" data={specifications} onChange={setSpecifications} />

            <Separator />

            {/* Production */}
            <KeyValueEditor label="Production Info" data={production} onChange={setProduction} />

            <Separator />

            {/* Taxonomy assignment */}
            <section className="space-y-4">
              <TaxonomyCheckboxGroup
                label="Categories"
                items={taxonomy.categories.map((c) => ({ id: c.id, label: c.name }))}
                selected={selectedCategories}
                onChange={setSelectedCategories}
                primaryId={primaryCategoryId}
                onPrimaryChange={setPrimaryCategoryId}
                showPrimary
              />
              <TaxonomyCheckboxGroup
                label="Materials"
                items={taxonomy.materials.map((m) => ({ id: m.id, label: `${m.name}${m.is_sustainable ? " ♻" : ""}` }))}
                selected={selectedMaterials}
                onChange={setSelectedMaterials}
              />
              <TaxonomyCheckboxGroup
                label="Industries"
                items={taxonomy.industries.map((i) => ({ id: i.id, label: i.name }))}
                selected={selectedIndustries}
                onChange={setSelectedIndustries}
              />
              <TaxonomyCheckboxGroup
                label="Certifications"
                items={taxonomy.certifications.map((c) => ({ id: c.id, label: `${c.abbreviation ?? ""} ${c.name}`.trim() }))}
                selected={selectedCertifications}
                onChange={setSelectedCertifications}
              />
              <TaxonomyCheckboxGroup
                label="Tags"
                items={taxonomy.tags.map((t) => ({ id: t.id, label: t.name }))}
                selected={selectedTags}
                onChange={setSelectedTags}
              />
            </section>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* Thumbnail */}
            <section>
              <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2 block">Thumbnail</Label>
              <div className="aspect-square bg-secondary border border-border rounded-[var(--radius)] overflow-hidden relative">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImagePlus className="w-8 h-8" />
                  </div>
                )}
              </div>
              {productId && (
                <div className="mt-2">
                  <label>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs w-full" asChild disabled={uploadingThumb}>
                      <span>
                        {uploadingThumb ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        Upload Thumbnail
                      </span>
                    </Button>
                    <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
                  </label>
                </div>
              )}
              {!productId && (
                <p className="text-xs text-muted-foreground mt-2">Save the product first to upload images.</p>
              )}
            </section>

            {/* Images */}
            <section>
              <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2 block">
                Images ({images.length})
              </Label>
              <div className="space-y-2">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={`flex items-center gap-2 p-2 border rounded-[var(--radius)] ${
                      img.is_primary ? "border-foreground" : "border-border"
                    }`}
                  >
                    <div className="w-12 h-12 bg-secondary rounded overflow-hidden shrink-0">
                      <img src={img.url} alt="" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate text-muted-foreground">{img.url.split("/").pop()}</p>
                      {img.is_primary && <Badge className="text-[9px] mt-0.5">Primary</Badge>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSetPrimary(img.id)}>
                      <Star className={`w-3 h-3 ${img.is_primary ? "fill-current" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteImage(img.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {productId && (
                <div className="mt-2">
                  <label>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs w-full" asChild disabled={uploadingImage}>
                      <span>
                        {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        Add Images
                      </span>
                    </Button>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              )}
            </section>

            {/* 3D Model URL */}
            <section>
              <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">3D Model URL</Label>
              <Input value={modelUrl} onChange={(e) => setModelUrl(e.target.value)} className="h-8 text-sm mt-1" placeholder="/models/my-model.obj" />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Taxonomy checkbox group ─────────────────────────────── */

function TaxonomyCheckboxGroup({
  label,
  items,
  selected,
  onChange,
  showPrimary,
  primaryId,
  onPrimaryChange,
}: {
  label: string;
  items: { id: string; label: string }[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
  showPrimary?: boolean;
  primaryId?: string;
  onPrimaryChange?: (id: string) => void;
}) {
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  return (
    <div>
      <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={selected.has(item.id)}
              onCheckedChange={() => toggle(item.id)}
            />
            <span className="truncate">{item.label}</span>
            {showPrimary && selected.has(item.id) && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onPrimaryChange?.(item.id);
                }}
                className={`ml-auto text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                  primaryId === item.id
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:border-foreground"
                }`}
              >
                Primary
              </button>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

/* ── Junction table sync helpers ─────────────────────────── */

async function syncJunction(
  _table: "product_category_map",
  _fkCol: string,
  productId: string,
  selectedIds: Set<string>,
  primaryId: string
) {
  await supabase.from("product_category_map").delete().eq("product_id", productId);
  const rows = [...selectedIds].map((id) => ({
    product_id: productId,
    category_id: id,
    is_primary: id === primaryId,
  }));
  if (rows.length) await supabase.from("product_category_map").insert(rows);
}

async function syncSimpleJunction(
  table: "product_material_map" | "product_industry_map" | "product_certification_map" | "product_tag_map",
  fkCol: string,
  productId: string,
  selectedIds: Set<string>
) {
  if (table === "product_material_map") {
    await supabase.from("product_material_map").delete().eq("product_id", productId);
    const rows = [...selectedIds].map((id) => ({ product_id: productId, material_id: id }));
    if (rows.length) await supabase.from("product_material_map").insert(rows);
  } else if (table === "product_industry_map") {
    await supabase.from("product_industry_map").delete().eq("product_id", productId);
    const rows = [...selectedIds].map((id) => ({ product_id: productId, industry_id: id }));
    if (rows.length) await supabase.from("product_industry_map").insert(rows);
  } else if (table === "product_certification_map") {
    await supabase.from("product_certification_map").delete().eq("product_id", productId);
    const rows = [...selectedIds].map((id) => ({ product_id: productId, certification_id: id }));
    if (rows.length) await supabase.from("product_certification_map").insert(rows);
  } else if (table === "product_tag_map") {
    await supabase.from("product_tag_map").delete().eq("product_id", productId);
    const rows = [...selectedIds].map((id) => ({ product_id: productId, tag_id: id }));
    if (rows.length) await supabase.from("product_tag_map").insert(rows);
  }
}
