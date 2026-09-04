import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useI18n } from "@/features/i18n/I18nProvider";
import { localizedName } from "@/features/admin/lib/localize";
import { describeSupabaseError } from "@/components/admin/shared/supabaseError";
import { SELECT_NONE_VALUE } from "@/components/admin/shared/flatCrudFields";
import { useFlatCrudTable } from "@/features/admin/hooks/useFlatCrudTable";
import { useAdminProduct, type AdminProductDetail, type SaveProductInput } from "@/features/admin/hooks/useAdminProduct";
import { StatusBadge } from "@/pages/admin/AdminProducts";
import { SizeVariantsEditor } from "@/components/admin/product-editor/SizeVariantsEditor";
import { ColourFinishSection } from "@/components/admin/product-editor/ColourFinishSection";
import type { Database } from "@/integrations/supabase/types";

type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
type SupabaseError = { message: string; code?: string };
type Translate = (key: string, vars?: Record<string, string | number>) => string;

const NONE = SELECT_NONE_VALUE;

/* ------------------------------------------------------------------ */
/*  Form state — strings for everything typed, parsed on save           */
/* ------------------------------------------------------------------ */

interface FormValues {
  name: string;
  name_en: string;
  slug: string;
  item_code: string;
  description: string;
  description_en: string;
  is_public: boolean;
  category_id: string;
  material_id: string;
  attachment_id: string;
  face_style: string;
  hole_count: string;
  logo_customisable: boolean;
  moq_qty: string;
  moq_unit: string;
  lead_time_min_days: string;
  lead_time_max_days: string;
  sample_time_days: string;
  origin: string;
  tensile_strength: string;
  wash_resistance: string;
  nickel_release_compliant: "unknown" | "yes" | "no";
  compliance_standard_ids: string[];
}

const EMPTY: FormValues = {
  name: "",
  name_en: "",
  slug: "",
  item_code: "",
  description: "",
  description_en: "",
  is_public: false,
  category_id: NONE,
  material_id: NONE,
  attachment_id: NONE,
  face_style: "",
  hole_count: "",
  logo_customisable: false,
  moq_qty: "",
  moq_unit: "pcs",
  lead_time_min_days: "",
  lead_time_max_days: "",
  sample_time_days: "",
  origin: "",
  tensile_strength: "",
  wash_resistance: "",
  nickel_release_compliant: "unknown",
  compliance_standard_ids: [],
};

function fromDetail(p: AdminProductDetail): FormValues {
  const num = (v: number | null) => (v === null || v === undefined ? "" : String(v));
  return {
    name: p.name ?? "",
    name_en: p.name_en ?? "",
    slug: p.slug ?? "",
    item_code: p.item_code ?? "",
    description: p.description ?? "",
    description_en: p.description_en ?? "",
    is_public: p.is_public,
    category_id: p.primary_category_id ?? NONE,
    material_id: p.material_id ?? NONE,
    attachment_id: p.attachment_id ?? NONE,
    face_style: p.face_style ?? "",
    hole_count: num(p.hole_count),
    logo_customisable: p.logo_customisable,
    moq_qty: num(p.moq_qty),
    moq_unit: p.moq_unit ?? "pcs",
    lead_time_min_days: num(p.lead_time_min_days),
    lead_time_max_days: num(p.lead_time_max_days),
    sample_time_days: num(p.sample_time_days),
    origin: p.origin ?? "",
    tensile_strength: p.tensile_strength ?? "",
    wash_resistance: p.wash_resistance ?? "",
    nickel_release_compliant: p.nickel_release_compliant === null ? "unknown" : p.nickel_release_compliant ? "yes" : "no",
    compliance_standard_ids: p.compliance_standard_ids,
  };
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function validate(v: FormValues, { forPublish }: { forPublish: boolean }, t: Translate) {
  const errors: Partial<Record<keyof FormValues, string>> = {};
  if (!v.name.trim()) errors.name = t("admin.validation.required");
  if (!v.slug.trim()) errors.slug = t("admin.validation.required");
  // published_needs_item_code: check here, in words, before the constraint does.
  if (forPublish && !v.item_code.trim()) errors.item_code = t("admin.validation.itemCodeBeforePublish");
  const int = (s: string) => (s.trim() === "" ? null : Number(s));
  for (const k of ["hole_count", "moq_qty", "lead_time_min_days", "lead_time_max_days", "sample_time_days"] as const) {
    const n = int(v[k]);
    if (n !== null && (!Number.isInteger(n) || n < 0)) errors[k] = t("admin.validation.wholeNumber");
  }
  const min = int(v.lead_time_min_days);
  const max = int(v.lead_time_max_days);
  if (min !== null && max !== null && min > max) errors.lead_time_max_days = t("admin.validation.maxAtLeastMin");
  return errors;
}

function toPayload(v: FormValues): ProductUpdate {
  const int = (s: string) => (s.trim() === "" ? null : Number(s));
  const text = (s: string) => (s.trim() === "" ? null : s.trim());
  const ref = (s: string) => (s === NONE || s === "" ? null : s);
  return {
    name: v.name.trim(),
    name_en: text(v.name_en),
    slug: v.slug.trim(),
    item_code: text(v.item_code),
    description: text(v.description),
    description_en: text(v.description_en),
    is_public: v.is_public,
    material_id: ref(v.material_id),
    attachment_id: ref(v.attachment_id),
    face_style: text(v.face_style),
    hole_count: int(v.hole_count),
    logo_customisable: v.logo_customisable,
    moq_qty: int(v.moq_qty),
    moq_unit: text(v.moq_unit) ?? "pcs",
    lead_time_min_days: int(v.lead_time_min_days),
    lead_time_max_days: int(v.lead_time_max_days),
    sample_time_days: int(v.sample_time_days),
    origin: text(v.origin),
    tensile_strength: text(v.tensile_strength),
    wash_resistance: text(v.wash_resistance),
    nickel_release_compliant: v.nickel_release_compliant === "unknown" ? null : v.nickel_release_compliant === "yes",
  };
}

/* ------------------------------------------------------------------ */
/*  Small layout helpers                                                */
/* ------------------------------------------------------------------ */

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border border-border p-6 space-y-4">
      <div>
        <h2 className="text-sm font-medium tracking-wide text-foreground">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className ?? "space-y-2"}>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminProductEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const { t, language } = useI18n();

  const { query, save, create } = useAdminProduct(id);
  const { query: familiesQuery } = useFlatCrudTable("product_families", { orderBy: "sort_order" });
  const { query: categoriesQuery } = useFlatCrudTable("product_categories", { orderBy: "sort_order" });
  const { query: materialsQuery } = useFlatCrudTable("product_materials");
  const { query: attachmentsQuery } = useFlatCrudTable("product_attachments", { orderBy: "sort_order" });
  const { query: standardsQuery } = useFlatCrudTable("compliance_standards", { orderBy: "sort_order" });

  const product = query.data;
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [slugTouched, setSlugTouched] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => {
    if (product) setValues(fromDetail(product));
  }, [product]);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  // New products get a slug from the name until the slug is edited by hand.
  useEffect(() => {
    if (isNew && !slugTouched) setValues((prev) => ({ ...prev, slug: slugify(prev.name) }));
  }, [values.name, isNew, slugTouched]);

  /* ---------- option lists: active rows, plus whatever is currently set ---------- */

  const archivedSuffix = t("admin.common.archivedSuffix");
  const families = useMemo(() => familiesQuery.data ?? [], [familiesQuery.data]);
  const categoryGroups = useMemo(() => {
    const cats = (categoriesQuery.data ?? []).filter((c) => c.is_active || c.id === values.category_id);
    const groups = families
      .filter((f) => f.is_active || cats.some((c) => c.family_id === f.id))
      .map((f) => ({ label: localizedName(f, language), items: cats.filter((c) => c.family_id === f.id) }))
      .filter((g) => g.items.length > 0);
    const orphans = cats.filter((c) => !c.family_id || !families.some((f) => f.id === c.family_id));
    if (orphans.length > 0) groups.push({ label: t("admin.field.noFamilyGroup"), items: orphans });
    return groups;
  }, [categoriesQuery.data, families, values.category_id, language, t]);

  const materials = useMemo(
    () =>
      [...(materialsQuery.data ?? [])]
        .filter((m) => m.is_active || m.id === values.material_id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [materialsQuery.data, values.material_id],
  );
  const attachments = useMemo(
    () => (attachmentsQuery.data ?? []).filter((a) => a.is_active || a.id === values.attachment_id),
    [attachmentsQuery.data, values.attachment_id],
  );
  const standards = useMemo(
    () => (standardsQuery.data ?? []).filter((s) => s.is_active || values.compliance_standard_ids.includes(s.id)),
    [standardsQuery.data, values.compliance_standard_ids],
  );
  const selectedMaterial = materials.find((m) => m.id === values.material_id);

  /* ---------- save + status actions ---------- */

  const busy = save.isPending || create.isPending;
  const onError = (error: unknown) => toast.error(describeSupabaseError(error as SupabaseError, t));

  /**
   * Every action saves the whole form in one write, so the status change and
   * the field edits can't drift apart (and the triggers see one consistent row).
   */
  const commit = (
    statusChange: { status?: string; is_public?: boolean } | null,
    { forPublish = false, successMessage }: { forPublish?: boolean; successMessage: string },
  ) => {
    const nextErrors = validate(values, { forPublish }, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(forPublish && nextErrors.item_code ? nextErrors.item_code : t("admin.validation.fixFields"));
      return;
    }
    const input: SaveProductInput = {
      product: { ...toPayload(values), ...(statusChange ?? {}) },
      primaryCategoryId: values.category_id === NONE ? null : values.category_id,
      complianceStandardIds: values.compliance_standard_ids,
    };
    if (isNew) {
      create.mutate(
        { ...input, product: { ...input.product, name: values.name.trim(), slug: values.slug.trim() } },
        {
          onSuccess: (newId) => {
            toast.success(successMessage);
            navigate(`/admin/products/${newId}`, { replace: true });
          },
          onError,
        },
      );
    } else {
      save.mutate(input, { onSuccess: () => toast.success(successMessage), onError });
    }
  };

  // The 25 M2 seed products are placeholders so every category has a sample
  // in the CMS. They stay draft — never published from here.
  const isSeed = (product?.slug ?? values.slug).startsWith("sample-");

  const handleSave = () => commit(null, { successMessage: t(isNew ? "admin.editor.created" : "admin.editor.saved") });
  const handlePublish = () => {
    if (isSeed) {
      toast.error(t("admin.editor.seedRefuse"));
      return;
    }
    commit({ status: "active", is_public: true }, { forPublish: true, successMessage: t("admin.editor.published") });
  };
  const handleUnpublish = () => commit({ status: "draft" }, { successMessage: t("admin.editor.movedToDraft") });
  const handleRestore = () => commit({ status: "draft" }, { successMessage: t("admin.editor.restored") });
  const handleArchive = () => {
    setConfirmArchive(false);
    commit({ status: "archived", is_public: false }, { successMessage: t("admin.editor.archived") });
  };

  /* ---------- render ---------- */

  if (!isNew && query.isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="h-3 w-40 bg-secondary animate-pulse rounded" />
      </div>
    );
  }
  if (!isNew && query.isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{describeSupabaseError(query.error as SupabaseError, t)}</p>
        <Button asChild variant="outline" className="rounded-none">
          <Link to="/admin/products">{t("admin.editor.backToProducts")}</Link>
        </Button>
      </div>
    );
  }

  const status = product?.status ?? "draft";
  const isBrandOwned = !!product?.brand_id;
  const numberField = (key: keyof FormValues & string, label: string) => (
    <Field label={label} error={errors[key]}>
      <Input
        className="rounded-none"
        type="number"
        min={0}
        step={1}
        value={String(values[key])}
        onChange={(e) => set(key, e.target.value as never)}
      />
    </Field>
  );
  const textField = (key: keyof FormValues & string, label: string, extra?: { hint?: string; mono?: boolean }) => (
    <Field label={label} error={errors[key]} hint={extra?.hint}>
      <Input
        className={extra?.mono ? "rounded-none font-mono" : "rounded-none"}
        value={String(values[key])}
        onChange={(e) => set(key, e.target.value as never)}
      />
    </Field>
  );

  return (
    <div className="space-y-6">
      {/* Header + actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link to="/admin/products" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3 h-3" /> {t("admin.nav.products")}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-light tracking-wide text-foreground">{isNew ? t("admin.editor.new") : product?.name}</h1>
            {!isNew && <StatusBadge status={status} isPublic={product?.is_public ?? false} />}
            {isBrandOwned && <span className="text-xs text-muted-foreground">{t("admin.editor.brandOwned")}</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="rounded-none" disabled={busy} onClick={handleSave}>
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {t(isNew ? "admin.editor.createDraft" : "admin.common.save")}
          </Button>
          {!isNew && status === "draft" && !isSeed && (
            <Button className="rounded-none" disabled={busy} onClick={handlePublish}>
              <Globe className="w-3.5 h-3.5 mr-2" />
              {t("admin.editor.publish")}
            </Button>
          )}
          {!isNew && status === "active" && (
            <Button variant="outline" className="rounded-none" disabled={busy} onClick={handleUnpublish}>
              {t("admin.editor.backToDraft")}
            </Button>
          )}
          {!isNew && status === "archived" && (
            <Button variant="outline" className="rounded-none" disabled={busy} onClick={handleRestore}>
              {t("admin.editor.restore")}
            </Button>
          )}
          {!isNew && status !== "archived" && !isBrandOwned && (
            <Button
              variant="ghost"
              className="rounded-none text-muted-foreground hover:text-destructive"
              disabled={busy}
              onClick={() => setConfirmArchive(true)}
            >
              {t("admin.common.archive")}
            </Button>
          )}
        </div>
      </div>

      {!isNew && status === "draft" && !isSeed && <p className="text-xs text-muted-foreground">{t("admin.editor.publishHint")}</p>}
      {!isNew && isSeed && <p className="text-xs text-muted-foreground">{t("admin.editor.seedHint")}</p>}

      {/* Identity */}
      <Section title={t("admin.editor.section.identity")} hint={t("admin.editor.section.identityHint")}>
        {textField("name", t("admin.field.name"))}
        {textField("name_en", t("admin.field.nameEn"))}
        <Field
          label={t("admin.field.slug")}
          error={errors.slug}
          hint={t(isNew ? "admin.field.slugHintNew" : "admin.field.slugHintExisting")}
        >
          <Input
            className="rounded-none font-mono"
            value={values.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value);
            }}
          />
        </Field>
        {textField("item_code", t("admin.field.itemCode"), { hint: t("admin.field.itemCodeHint"), mono: true })}
        <Field label={t("admin.field.description")}>
          <Textarea className="rounded-none min-h-[100px]" value={values.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <Field label={t("admin.field.descriptionEn")}>
          <Textarea className="rounded-none min-h-[100px]" value={values.description_en} onChange={(e) => set("description_en", e.target.value)} />
        </Field>
        <div className="flex items-start gap-3 border border-border p-3 md:col-span-2">
          <Switch checked={values.is_public} onCheckedChange={(v) => set("is_public", v)} />
          <div className="space-y-1">
            <Label className="text-sm text-foreground">{t("admin.field.visible")}</Label>
            <p className="text-xs text-muted-foreground">{t("admin.field.visibleHint")}</p>
          </div>
        </div>
      </Section>

      {/* Classification */}
      <Section title={t("admin.editor.section.classification")}>
        <Field label={t("admin.field.category")} hint={t("admin.field.categoryHint")}>
          <Select value={values.category_id} onValueChange={(v) => set("category_id", v)}>
            <SelectTrigger className="rounded-none">
              <SelectValue placeholder={t("admin.field.selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t("admin.field.noCategory")}</SelectItem>
              {categoryGroups.map((g) => (
                <SelectGroup key={g.label}>
                  <SelectLabel>{g.label}</SelectLabel>
                  {g.items.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {localizedName(c, language)}
                      {!c.is_active ? archivedSuffix : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          label={t("admin.field.material")}
          hint={t(
            selectedMaterial
              ? selectedMaterial.is_metal
                ? "admin.field.materialHintMetal"
                : "admin.field.materialHintNonMetal"
              : "admin.field.materialHintNone",
          )}
        >
          <Select value={values.material_id} onValueChange={(v) => set("material_id", v)}>
            <SelectTrigger className="rounded-none" data-testid="material-select">
              <SelectValue placeholder={t("admin.field.selectMaterial")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t("admin.field.noMaterial")}</SelectItem>
              {materials.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {localizedName(m, language)}
                  {m.is_metal ? t("admin.field.metalSuffix") : ""}
                  {!m.is_active ? archivedSuffix : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("admin.field.attachment")}>
          <Select value={values.attachment_id} onValueChange={(v) => set("attachment_id", v)}>
            <SelectTrigger className="rounded-none">
              <SelectValue placeholder={t("admin.field.selectAttachment")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t("admin.field.none")}</SelectItem>
              {attachments.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {localizedName(a, language)}
                  {!a.is_active ? archivedSuffix : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      {/* Physical */}
      <Section title={t("admin.editor.section.physical")}>
        {textField("face_style", t("admin.field.faceStyle"))}
        {numberField("hole_count", t("admin.field.holeCount"))}
        <div className="flex items-start gap-3 border border-border p-3">
          <Switch checked={values.logo_customisable} onCheckedChange={(v) => set("logo_customisable", v)} />
          <Label className="text-sm text-foreground">{t("admin.field.logoCustomisable")}</Label>
        </div>
      </Section>

      {/* Commercial */}
      <Section title={t("admin.editor.section.commercial")}>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          {numberField("moq_qty", t("admin.field.moq"))}
          <Field label={t("admin.field.unit")}>
            <Input className="rounded-none w-24" value={values.moq_unit} onChange={(e) => set("moq_unit", e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {numberField("lead_time_min_days", t("admin.field.leadMin"))}
          {numberField("lead_time_max_days", t("admin.field.leadMax"))}
        </div>
        {numberField("sample_time_days", t("admin.field.sampleTime"))}
        {textField("origin", t("admin.field.origin"))}
      </Section>

      {/* Technical */}
      <Section title={t("admin.editor.section.technical")}>
        {textField("tensile_strength", t("admin.field.tensile"))}
        {textField("wash_resistance", t("admin.field.wash"))}
        <Field label={t("admin.field.nickel")}>
          <Select
            value={values.nickel_release_compliant}
            onValueChange={(v) => set("nickel_release_compliant", v as FormValues["nickel_release_compliant"])}
          >
            <SelectTrigger className="rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unknown">{t("admin.field.nickel.unknown")}</SelectItem>
              <SelectItem value="yes">{t("admin.field.nickel.yes")}</SelectItem>
              <SelectItem value="no">{t("admin.field.nickel.no")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("admin.field.compliance")} className="space-y-2 md:col-span-2">
          {standards.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("admin.field.complianceEmpty")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {standards.map((s) => {
                const checked = values.compliance_standard_ids.includes(s.id);
                return (
                  <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) =>
                        set(
                          "compliance_standard_ids",
                          next
                            ? [...values.compliance_standard_ids, s.id]
                            : values.compliance_standard_ids.filter((x) => x !== s.id),
                        )
                      }
                    />
                    <span className="font-mono text-xs text-muted-foreground w-20">{s.code}</span>
                    <span>{localizedName(s, language)}</span>
                    {!s.is_active && <span className="text-xs text-muted-foreground">{archivedSuffix}</span>}
                  </label>
                );
              })}
            </div>
          )}
        </Field>
      </Section>

      {/* Size variants — need a saved product to attach to */}
      <section className="border border-border p-6 space-y-4">
        <div>
          <h2 className="text-sm font-medium tracking-wide text-foreground">{t("admin.editor.section.sizes")}</h2>
          <p className="text-xs text-muted-foreground">{t("admin.editor.section.sizesHint")}</p>
        </div>
        {isNew || !id ? (
          <p className="text-xs text-muted-foreground">{t("admin.editor.createFirstSizes")}</p>
        ) : (
          <SizeVariantsEditor productId={id} />
        )}
      </section>

      {/* Colour & finish — branches on the saved material */}
      <section className="border border-border p-6 space-y-4">
        <div>
          <h2 className="text-sm font-medium tracking-wide text-foreground">{t("admin.editor.section.colourFinish")}</h2>
          <p className="text-xs text-muted-foreground">{t("admin.editor.section.colourFinishHint")}</p>
        </div>
        {isNew || !product ? (
          <p className="text-xs text-muted-foreground">{t("admin.editor.createFirstColours")}</p>
        ) : (
          <ColourFinishSection
            product={product}
            formMaterialId={values.material_id === NONE ? null : values.material_id}
            materials={materialsQuery.data ?? []}
          />
        )}
      </section>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.editor.archiveTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.editor.archiveBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>{t("admin.common.archive")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
