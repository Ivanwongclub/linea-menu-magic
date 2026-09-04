import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useI18n } from "@/features/i18n/I18nProvider";
import { localizedName } from "@/features/admin/lib/localize";
import { describeSupabaseError } from "@/components/admin/shared/supabaseError";
import { SELECT_NONE_VALUE } from "@/components/admin/shared/flatCrudFields";
import { FINISH_AXES, type AxisValues, type FinishRow } from "@/features/admin/hooks/useFinishes";
import { useFinishMutations, type FinishInsert, type FinishUpdate } from "@/features/admin/hooks/useFinishMutations";
import { FinishSwatch } from "@/features/finishes/FinishSwatch";

const NONE = SELECT_NONE_VALUE;
const HEX = /^#[0-9a-f]{6}$/i;
type SupabaseError = { message: string; code?: string };

interface FormValues {
  cyc_code: string;
  is_standard: boolean;
  factory_name_en: string;
  factory_name_zh_hant: string;
  factory_name_zh_hans: string;
  chart_page: string;
  marketing_name: string;
  marketing_name_zh_hant: string;
  marketing_name_zh_hans: string;
  swatch_url: string;
  hex_approx: string;
  status: string;
  is_public: boolean;
  notes: string;
  sort_order: string;
  axes: Record<(typeof FINISH_AXES)[number]["fk"], string>;
}

const emptyAxes = () =>
  Object.fromEntries(FINISH_AXES.map((a) => [a.fk, NONE])) as FormValues["axes"];

const EMPTY: FormValues = {
  cyc_code: "",
  is_standard: true,
  factory_name_en: "",
  factory_name_zh_hant: "",
  factory_name_zh_hans: "",
  chart_page: "",
  marketing_name: "",
  marketing_name_zh_hant: "",
  marketing_name_zh_hans: "",
  swatch_url: "",
  hex_approx: "",
  status: "active",
  is_public: false,
  notes: "",
  sort_order: "0",
  axes: emptyAxes(),
};

function fromRow(f: FinishRow): FormValues {
  return {
    cyc_code: f.cyc_code ?? "",
    is_standard: f.is_standard,
    factory_name_en: f.factory_name_en,
    factory_name_zh_hant: f.factory_name_zh_hant ?? "",
    factory_name_zh_hans: f.factory_name_zh_hans ?? "",
    chart_page: f.chart_page ?? "",
    marketing_name: f.marketing_name,
    marketing_name_zh_hant: f.marketing_name_zh_hant ?? "",
    marketing_name_zh_hans: f.marketing_name_zh_hans ?? "",
    swatch_url: f.swatch_url ?? "",
    hex_approx: f.hex_approx ?? "",
    status: f.status,
    is_public: f.is_public,
    notes: f.notes ?? "",
    sort_order: String(f.sort_order),
    axes: Object.fromEntries(FINISH_AXES.map((a) => [a.fk, f[a.fk] ?? NONE])) as FormValues["axes"],
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create */
  finish: FinishRow | null;
  axes: AxisValues;
}

function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Locked({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className={cn("text-sm px-3 py-2 border border-border bg-secondary/50 text-muted-foreground", mono && "font-mono")}>
        {value || "—"}
      </div>
    </div>
  );
}

/**
 * Create/edit one finish. Read-only after creation (factory identity,
 * chart page) is shown as such, not just disabled. cyc_code mirrors the
 * prevent_code_change trigger exactly: editable while null (a custom
 * finish can be promoted to a coded one once), locked once set.
 */
export function FinishEditDialog({ open, onOpenChange, finish, axes }: Props) {
  const { t, language } = useI18n();
  const { create, update } = useFinishMutations();
  const isNew = !finish;
  const codeLocked = !isNew && !!finish.cyc_code;

  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  useEffect(() => {
    if (open) {
      setValues(finish ? fromRow(finish) : EMPTY);
      setErrors({});
    }
  }, [open, finish]);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setValues((prev) => ({ ...prev, [key]: value }));
  const setAxis = (fk: keyof FormValues["axes"], value: string) =>
    setValues((prev) => ({ ...prev, axes: { ...prev.axes, [fk]: value } }));

  const handleSave = () => {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (isNew && !values.factory_name_en.trim()) next.factory_name_en = t("admin.finishes.validation.factoryRequired");
    if (!values.marketing_name.trim()) next.marketing_name = t("admin.finishes.validation.marketingRequired");
    // standard_finish_needs_code, in words, before the constraint fires.
    if (values.is_standard && !values.cyc_code.trim()) next.cyc_code = t("admin.finishes.validation.standardNeedsCode");
    if (values.hex_approx.trim() && !HEX.test(values.hex_approx.trim())) next.hex_approx = t("admin.finishes.validation.hex");
    const sort = Number(values.sort_order);
    if (!Number.isInteger(sort)) next.sort_order = t("admin.validation.wholeNumber");
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error(next.cyc_code ?? t("admin.finishes.validation.fix"));
      return;
    }

    const text = (s: string) => (s.trim() === "" ? null : s.trim());
    const ref = (s: string) => (s === NONE ? null : s);
    const axisCols = Object.fromEntries(FINISH_AXES.map((a) => [a.fk, ref(values.axes[a.fk])]));
    const editable: FinishUpdate = {
      marketing_name: values.marketing_name.trim(),
      marketing_name_zh_hant: text(values.marketing_name_zh_hant),
      marketing_name_zh_hans: text(values.marketing_name_zh_hans),
      swatch_url: text(values.swatch_url),
      hex_approx: values.hex_approx.trim() ? values.hex_approx.trim().toUpperCase() : null,
      status: values.status,
      is_public: values.is_public,
      notes: text(values.notes),
      sort_order: sort,
      is_standard: values.is_standard,
      ...axisCols,
    };
    const onError = (error: unknown) => toast.error(describeSupabaseError(error as SupabaseError, t));

    if (isNew) {
      const payload: FinishInsert = {
        ...editable,
        marketing_name: values.marketing_name.trim(),
        factory_name_en: values.factory_name_en.trim(),
        factory_name_zh_hant: text(values.factory_name_zh_hant),
        factory_name_zh_hans: text(values.factory_name_zh_hans),
        chart_page: text(values.chart_page),
        cyc_code: text(values.cyc_code),
      };
      create.mutate(payload, {
        onSuccess: () => {
          toast.success(t("admin.finishes.created"));
          onOpenChange(false);
        },
        onError,
      });
    } else {
      // First-time code set is allowed by the trigger; once set it never goes in the payload.
      const payload: FinishUpdate = codeLocked ? editable : { ...editable, cyc_code: text(values.cyc_code) };
      update.mutate(
        { id: finish.id, values: payload },
        {
          onSuccess: () => {
            toast.success(t("admin.finishes.saved"));
            onOpenChange(false);
          },
          onError,
        },
      );
    }
  };

  const busy = create.isPending || update.isPending;
  // Live preview: the material model comes from the saved row (the database
  // derives it from the axes on write), the colour/photo from the form.
  const preview = {
    hex_approx: HEX.test(values.hex_approx.trim()) ? values.hex_approx.trim() : null,
    swatch_url: values.swatch_url.trim() || null,
    metalness: finish?.metalness ?? 1,
    roughness: finish?.roughness ?? 0.08,
    anisotropy: finish?.anisotropy ?? 0,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t(isNew ? "admin.finishes.create" : "admin.finishes.edit")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {/* Identity — editable on create, read-only after */}
          <section className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {isNew ? t("admin.finishes.field.cycCode") : t("admin.finishes.readOnly")}
            </div>
            {!isNew && <p className="text-xs text-muted-foreground -mt-2">{t("admin.finishes.readOnlyHint")}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {codeLocked ? (
                <div data-testid="finish-cyc-code-locked">
                  <Locked label={t("admin.finishes.field.cycCode")} value={values.cyc_code} mono />
                  <p className="text-xs text-muted-foreground mt-1">{t("admin.finishes.codeLockedHint")}</p>
                </div>
              ) : (
                <Field
                  label={t("admin.finishes.field.cycCode")}
                  error={errors.cyc_code}
                  hint={isNew ? undefined : t("admin.finishes.codeUnsetHint")}
                >
                  <Input
                    data-testid="finish-cyc-code"
                    className="rounded-none font-mono"
                    value={values.cyc_code}
                    onChange={(e) => set("cyc_code", e.target.value)}
                  />
                </Field>
              )}
              <div className="flex items-start gap-3 border border-border p-3">
                <Switch data-testid="finish-is-standard" checked={values.is_standard} onCheckedChange={(v) => set("is_standard", v)} />
                <div className="space-y-1">
                  <Label className="text-sm text-foreground">{t("admin.finishes.field.isStandard")}</Label>
                  <p className="text-xs text-muted-foreground">{t("admin.finishes.field.isStandardHint")}</p>
                </div>
              </div>
              {isNew ? (
                <>
                  <Field label={t("admin.finishes.field.factoryEn")} error={errors.factory_name_en}>
                    <Input data-testid="finish-factory-en" className="rounded-none" value={values.factory_name_en} onChange={(e) => set("factory_name_en", e.target.value)} />
                  </Field>
                  <Field label={t("admin.finishes.field.chartPage")}>
                    <Input className="rounded-none" value={values.chart_page} onChange={(e) => set("chart_page", e.target.value)} />
                  </Field>
                  <Field label={t("admin.finishes.field.factoryHant")}>
                    <Input className="rounded-none" value={values.factory_name_zh_hant} onChange={(e) => set("factory_name_zh_hant", e.target.value)} />
                  </Field>
                  <Field label={t("admin.finishes.field.factoryHans")}>
                    <Input className="rounded-none" value={values.factory_name_zh_hans} onChange={(e) => set("factory_name_zh_hans", e.target.value)} />
                  </Field>
                </>
              ) : (
                <>
                  <Locked label={t("admin.finishes.field.factoryEn")} value={values.factory_name_en} />
                  <Locked label={t("admin.finishes.field.chartPage")} value={values.chart_page} />
                  <Locked label={t("admin.finishes.field.factoryHant")} value={values.factory_name_zh_hant} />
                  <Locked label={t("admin.finishes.field.factoryHans")} value={values.factory_name_zh_hans} />
                </>
              )}
            </div>
          </section>

          {/* Marketing names, three languages side by side */}
          <section className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t("admin.finishes.field.marketing")}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  ["marketing_name", t("admin.crud.english"), "finish-marketing-en"],
                  ["marketing_name_zh_hant", t("admin.crud.hant"), "finish-marketing-hant"],
                  ["marketing_name_zh_hans", t("admin.crud.hans"), "finish-marketing-hans"],
                ] as const
              ).map(([key, sub, testId]) => (
                <div key={key} className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">{sub}</span>
                  <Input data-testid={testId} className="rounded-none" value={values[key]} onChange={(e) => set(key, e.target.value)} />
                </div>
              ))}
            </div>
            {errors.marketing_name && <p className="text-xs text-destructive">{errors.marketing_name}</p>}
          </section>

          {/* Appearance */}
          <section className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr] gap-4 items-start">
            <FinishSwatch finish={preview} className="w-20 h-20 border border-border/60" />
            <Field label={t("admin.finishes.field.hex")} error={errors.hex_approx}>
              <Input data-testid="finish-hex" className="rounded-none font-mono" placeholder="#RRGGBB" value={values.hex_approx} onChange={(e) => set("hex_approx", e.target.value)} />
            </Field>
            <Field label={t("admin.finishes.field.swatchUrl")} hint={t("admin.finishes.field.swatchUrlHint")}>
              <Input className="rounded-none" value={values.swatch_url} onChange={(e) => set("swatch_url", e.target.value)} />
            </Field>
          </section>

          {/* Lifecycle */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label={t("admin.finishes.field.status")}>
              <Select value={values.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger className="rounded-none" data-testid="finish-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("admin.finishes.status.active")}</SelectItem>
                  <SelectItem value="discontinued">{t("admin.finishes.status.discontinued")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("admin.finishes.field.sort")} error={errors.sort_order}>
              <Input data-testid="finish-sort" className="rounded-none" type="number" step={1} value={values.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
            </Field>
            <div className="flex items-start gap-3 border border-border p-3">
              <Switch data-testid="finish-public" checked={values.is_public} onCheckedChange={(v) => set("is_public", v)} />
              <div className="space-y-1">
                <Label className="text-sm text-foreground">{t("admin.finishes.field.public")}</Label>
                <p className="text-xs text-muted-foreground">{t("admin.finishes.field.publicHint")}</p>
              </div>
            </div>
          </section>

          {/* Axes */}
          <section className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t("admin.finishes.field.axes")}</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {FINISH_AXES.map((axis) => (
                <div key={axis.key} className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">{t(`admin.axis.${axis.key}`)}</span>
                  <Select value={values.axes[axis.fk]} onValueChange={(v) => setAxis(axis.fk, v)}>
                    <SelectTrigger className="rounded-none h-9 text-xs" data-testid={`finish-axis-${axis.key}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>{t("admin.finishes.none")}</SelectItem>
                      {(axes[axis.key] ?? [])
                        .filter((v) => v.is_active || v.id === values.axes[axis.fk])
                        .map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {localizedName(v, language)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </section>

          <Field label={t("admin.finishes.field.notes")}>
            <Textarea data-testid="finish-notes" className="rounded-none min-h-[80px]" value={values.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-none" onClick={() => onOpenChange(false)}>
            {t("admin.common.cancel")}
          </Button>
          <Button className="rounded-none" disabled={busy} onClick={handleSave}>
            {busy ? t("admin.common.saving") : t("admin.common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
