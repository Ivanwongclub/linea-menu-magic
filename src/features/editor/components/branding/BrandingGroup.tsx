import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { GripVertical, ImagePlus, Plus, Redo2, Undo2, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { selectCanRedo, selectCanUndo, useEditorStore } from "../../store/useEditorStore";
import { BUNDLED_FONTS } from "../../lib/fonts";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FinishSelectionPicker } from "@/features/finishes/FinishSelectionPicker";
import { finishMarketingName } from "@/features/finishes/finishAxisLine";
import {
  isLogoLayer,
  isTextLayer,
  layerAppearance,
  layerRelief,
  newLogoLayer,
  newTextLayer,
  type AppearanceMode,
  type Layer,
  type LayerAppearance,
  type TextLayer,
  type TextLayout,
} from "../../lib/recipe";
import { finishesForGroup, usePublicFinishes, type AppearanceFinishGroup } from "../../hooks/usePublicFinishes";
import type { PickerFinish } from "../../hooks/useFinishOptions";
import { normalizeHex, normalizePantone, pantoneHex, resolveCustomColour } from "../../lib/pantone";
import { PrecisionNumberInput } from "../controls/PrecisionNumberInput";
import type { ProcessThresholds } from "../../lib/manufacturing";
import { MAX_LOGO_BYTES, MAX_RASTER_BYTES, RASTER_MIME_TYPES, asRejection, rejectionMessage, validateLogoSvg, validateRasterLogo } from "../../lib/logoSvg";
import { parseLogoSvg } from "../../lib/logoGeometry";
import { deleteLogoAsset, isRasterMime, uploadLogoAsset, useLogoSources, type LogoSource } from "../../hooks/useLogoAssets";
import { useAuth } from "@/features/auth/AuthProvider";
import { useDesignerStaffStatus } from "../../hooks/useDesignerStaffStatus";
import { recoveredDefaults, type BrandingReferenceRaw } from "../../lib/recoveredPlacement";
import { PositionAndCurve } from "./PositionAndCurve";

const FIELD_LABEL = "text-[11px] uppercase tracking-[0.12em] text-muted-foreground";

const LAYOUTS: { value: TextLayout; label: string }[] = [
  { value: "straight", label: "editor.branding.layoutStraight" },
  { value: "circle", label: "editor.branding.layoutCircular" },
];

function LayerRow({ layer, selected, logoSource }: { layer: Layer; selected: boolean; logoSource?: LogoSource }) {
  const { t } = useI18n();
  const selectLayer = useEditorStore((s) => s.selectLayer);
  const removeLayer = useEditorStore((s) => s.removeLayer);
  const onDelete = () => {
    // A logo's file goes with its layer (R7); an undo puts both back.
    if (isLogoLayer(layer) && layer.content.asset_id) void deleteLogoAsset(layer.content.asset_id);
    removeLayer(layer.id);
  };
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: layer.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-testid="text-layer-row"
      data-layer-id={layer.id}
      data-selected={selected}
      className={cn(
        "group flex flex-col border bg-background transition-colors",
        selected ? "border-foreground" : "border-border hover:border-foreground/40",
        isDragging && "relative z-10 shadow-sm",
      )}
    >
      <div className="flex items-center">
      <button
        type="button"
        ref={setActivatorNodeRef}
        data-testid="text-layer-handle"
        aria-label={t("editor.branding.reorder")}
        className="self-stretch px-1.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        data-testid="text-layer-select"
        aria-pressed={selected}
        onClick={() => selectLayer(layer.id)}
        className="flex-1 min-w-0 py-2 pr-2 text-left"
      >
        {isLogoLayer(layer) ? (
          <span className="flex items-center gap-2">
            <LogoThumbnail source={logoSource} />
            <span className="truncate text-sm tracking-wide text-foreground">{t("editor.branding.logoLayer")}</span>
          </span>
        ) : (
          <span className={cn("block truncate text-sm tracking-wide", layer.content.value ? "text-foreground" : "text-muted-foreground italic")}>
            {layer.content.value || t("editor.branding.emptyLayer")}
          </span>
        )}
      </button>
      <button
        type="button"
        data-testid="text-layer-delete"
        aria-label={t("editor.branding.delete")}
        onClick={onDelete}
        className="self-stretch px-2 text-muted-foreground hover:text-foreground"
      >
        <X className="w-3.5 h-3.5" strokeWidth={1.5} />
      </button>
      </div>
      <ReliefRow layer={layer} />
      <AppearanceRow layer={layer} />
    </li>
  );
}

const RELIEF_TYPES = [
  { value: "emboss", label: "editor.branding.raised" },
  { value: "deboss", label: "editor.branding.engraved" },
  // Phase 6a R1: printed is a relief type of its own — flat, no depth.
  { value: "printed", label: "editor.branding.printed" },
] as const;

/**
 * R1: raised or engraved, and the depth, on the layer's own row — the panel's
 * only real decision (v3-review §3, MVP item 8/9). Typed, because the factory
 * quotes from it; the bevel sits behind "Position and curve".
 */
function ReliefRow({ layer }: { layer: Layer }) {
  const { t } = useI18n();
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const commit = useEditorStore((s) => s.commit);
  const relief = layerRelief(layer);

  return (
    <div className="flex items-center gap-2 border-t border-border px-1.5 py-1.5" data-testid="layer-relief" data-layer-id={layer.id} data-type={relief.type}>
      <div role="radiogroup" aria-label={t("editor.branding.relief")} className="flex border border-border" data-testid="relief-type">
        {RELIEF_TYPES.map((option) => {
          const active = relief.type === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              data-value={option.value}
              onClick={() => {
                updateLayer(layer.id, { relief: { type: option.value } });
                commit();
              }}
              className={cn(
                "px-2 py-0.5 text-[11px] tracking-[0.05em] transition-colors",
                active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(option.label)}
            </button>
          );
        })}
      </div>
      {/* Printed ink has no depth to quote. */}
      {relief.type !== "printed" && (
        <>
          <span className={cn(FIELD_LABEL, "ml-auto")} id={`depth-label-${layer.id}`}>
            {t("editor.branding.depth")}
          </span>
          <PrecisionNumberInput
            value={relief.depth_mm}
            unit="mm"
            min={0}
            exclusiveMin
            max={5}
            ariaLabelledBy={`depth-label-${layer.id}`}
            testId="relief-depth-input"
            className="w-20 shrink-0"
            onChange={(depth_mm) => updateLayer(layer.id, { relief: { depth_mm } })}
            onCommit={commit}
          />
        </>
      )}
    </div>
  );
}

/** A raster file as a data URL: what the draft holds and what the texture loads. */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

/** The artwork's own width / height, so the layer keeps its proportions. */
function rasterAspect(dataUrl: string): Promise<number | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth > 0 && image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : null);
    image.onerror = () => resolve(null);
    image.src = dataUrl;
  });
}

/** A raster layer is printed from the start (R2): flat, in the ink colour. */
function printedLayer<T extends Layer>(layer: T): T {
  return { ...layer, relief: { ...layer.relief!, type: "printed" }, appearance: { mode: "printed", finish_id: null, custom: null } };
}

const APPEARANCE_MODES: { value: AppearanceMode; label: string }[] = [
  { value: "part", label: "editor.appearance.part" },
  { value: "plated", label: "editor.appearance.plated" },
  { value: "paint", label: "editor.appearance.paint" },
  { value: "printed", label: "editor.appearance.printed" },
];

/** The colour a layer reads as on the row: a finish's own swatch colour, a custom colour, or the part's. */
function appearanceSwatchHex(appearance: LayerAppearance, finish: PickerFinish | null): string | null {
  if (appearance.custom) return appearance.custom.hex;
  if (finish) return finish.base_color_hex ?? finish.hex_approx ?? null;
  return null;
}

/**
 * Appearance, per layer (Phase 6a R1): the part's own finish, a plated finish
 * of its own, a paint colour — the fill of axis-design §3 — or printed ink.
 * One control; the finish behind it is chosen in the same picker the button
 * uses, filtered to the processes that can do the job (R2).
 */
function AppearanceRow({ layer }: { layer: Layer }) {
  const { t, language } = useI18n();
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const commit = useEditorStore((s) => s.commit);
  const { data: finishes } = usePublicFinishes();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const appearance = layerAppearance(layer);
  const group: AppearanceFinishGroup = appearance.mode === "plated" ? "plated" : "paint";
  const options = useMemo(() => finishesForGroup(finishes ?? [], group), [finishes, group]);
  const selected = (finishes ?? []).find((f) => f.id === appearance.finish_id) ?? null;
  const needsColour = appearance.mode === "plated" || appearance.mode === "paint" || appearance.mode === "printed";
  const swatchHex = appearanceSwatchHex(appearance, selected);

  const setMode = (mode: AppearanceMode) => {
    // Leaving a colour behind clears it: a plated layer never carries a custom
    // colour (R3), and the part's own finish carries none either.
    const custom = mode === "paint" || mode === "printed" ? appearance.custom : null;
    const finish_id = mode === "part" ? null : appearance.finish_id;
    updateLayer(layer.id, { appearance: { mode, custom, finish_id } });
    commit();
  };

  const label = selected
    ? finishMarketingName(selected, language)
    : appearance.custom
      ? t("editor.appearance.customSummary", { colour: appearance.custom.pantone ?? appearance.custom.hex })
      : t("editor.appearance.choose");

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border px-1.5 py-1.5" data-testid="layer-appearance" data-layer-id={layer.id} data-mode={appearance.mode} data-finish-id={appearance.finish_id ?? undefined} data-custom={appearance.custom?.hex ?? undefined}>
      <span className={FIELD_LABEL} id={`appearance-${layer.id}`}>
        {t("editor.appearance.label")}
      </span>
      <span
        data-testid="appearance-swatch"
        data-hex={swatchHex ?? undefined}
        aria-hidden="true"
        className={cn("h-4 w-4 shrink-0 border border-border", !swatchHex && "border-dashed bg-secondary")}
        style={swatchHex ? { backgroundColor: swatchHex } : undefined}
      />
      <Select value={appearance.mode} onValueChange={(mode) => setMode(mode as AppearanceMode)}>
        <SelectTrigger aria-labelledby={`appearance-${layer.id}`} data-testid="appearance-mode" className="h-7 w-[140px] rounded-none border-0 border-b border-border px-0 text-[11px] shadow-none focus:ring-0 focus:border-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-none">
          {APPEARANCE_MODES.map((option) => (
            <SelectItem key={option.value} value={option.value} className="rounded-none text-xs">
              {t(option.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {needsColour && (
        <button
          type="button"
          data-testid="appearance-choose"
          onClick={() => setPickerOpen(true)}
          className="text-[11px] tracking-[0.05em] text-foreground underline-offset-4 hover:underline truncate max-w-[140px]"
        >
          {label}
        </button>
      )}
      {(appearance.mode === "paint" || appearance.mode === "printed") && (
        <button
          type="button"
          data-testid="appearance-custom-open"
          onClick={() => setCustomOpen((v) => !v)}
          className="text-[11px] tracking-[0.05em] text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
        >
          {t("editor.appearance.custom")}
        </button>
      )}

      {customOpen && (appearance.mode === "paint" || appearance.mode === "printed") && (
        <CustomColourPanel
          layer={layer}
          onDone={() => setCustomOpen(false)}
        />
      )}

      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
          <SheetHeader>
            <SheetTitle>{t(group === "paint" ? "editor.appearance.paintPickerTitle" : "editor.appearance.platedPickerTitle")}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0 mt-4" data-testid="appearance-picker">
            <FinishSelectionPicker
              finishes={options}
              selectedId={appearance.finish_id}
              onSelect={(finish) => {
                updateLayer(layer.id, { appearance: { finish_id: finish.id, custom: null } });
                commit();
                setPickerOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * "Custom…" (R3): a Pantone code from the solid coated range, or a colour
 * picked on screen. An unknown code keeps the code and takes the buyer's own
 * hex beside it; either way the layer is labelled "to be confirmed".
 */
function CustomColourPanel({ layer, onDone }: { layer: Layer; onDone: () => void }) {
  const { t } = useI18n();
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const commit = useEditorStore((s) => s.commit);
  const existing = layerAppearance(layer).custom;
  const [pantone, setPantone] = useState(existing?.pantone ?? "");
  const [hex, setHex] = useState(existing?.hex ?? "#000000");
  const resolved = resolveCustomColour({ pantone, hex });
  const known = pantone.trim() !== "" && !!pantoneHex(pantone);
  const codeInvalid = pantone.trim() !== "" && normalizePantone(pantone) === null;

  return (
    <div className="w-full space-y-2 border border-border p-2" data-testid="custom-colour-panel">
      <div className="flex items-center gap-2">
        <label className={FIELD_LABEL} htmlFor={`pantone-${layer.id}`}>
          {t("editor.appearance.pantone")}
        </label>
        <input
          id={`pantone-${layer.id}`}
          data-testid="custom-pantone"
          value={pantone}
          autoComplete="off"
          onChange={(e) => {
            setPantone(e.target.value);
            const found = pantoneHex(e.target.value);
            if (found) setHex(found);
          }}
          placeholder="185 C"
          className="w-24 border-b border-border bg-transparent py-0.5 text-sm text-foreground outline-none focus:border-foreground"
        />
        <input
          type="color"
          data-testid="custom-pick"
          aria-label={t("editor.appearance.pick")}
          value={normalizeHex(hex) ?? "#000000"}
          onChange={(e) => setHex(e.target.value)}
          className="h-6 w-8 shrink-0 border border-border bg-transparent p-0"
        />
        <input
          data-testid="custom-hex"
          aria-label={t("editor.appearance.hex")}
          value={hex}
          autoComplete="off"
          onChange={(e) => setHex(e.target.value)}
          className="w-24 border-b border-border bg-transparent py-0.5 font-mono text-xs text-foreground outline-none focus:border-foreground"
        />
      </div>
      <p className="text-[11px] text-muted-foreground" data-testid="custom-colour-hint">
        {codeInvalid
          ? t("editor.appearance.pantoneInvalid")
          : known
            ? t("editor.appearance.pantoneKnown")
            : pantone.trim()
              ? t("editor.appearance.pantoneUnknown")
              : t("editor.appearance.customHint")}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="custom-apply"
          disabled={!resolved}
          onClick={() => {
            if (!resolved) return;
            updateLayer(layer.id, { appearance: { custom: resolved, finish_id: null } });
            commit();
            onDone();
          }}
          className="border border-foreground px-2 py-0.5 text-[11px] tracking-[0.05em] text-foreground disabled:border-border disabled:text-muted-foreground"
        >
          {t("editor.appearance.applyCustom")}
        </button>
        <button type="button" data-testid="custom-cancel" onClick={onDone} className="text-[11px] text-muted-foreground hover:text-foreground">
          {t("editor.common.cancel")}
        </button>
      </div>
    </div>
  );
}

/** The uploaded artwork itself, at row size (4k R4) — vector or raster (6a). */
function LogoThumbnail({ source }: { source?: LogoSource }) {
  if (!source) return <span className="h-5 w-5 shrink-0 border border-border bg-secondary" data-testid="logo-thumbnail" data-loaded="false" />;
  const src = source.kind === "raster" ? source.url : `data:image/svg+xml;utf8,${encodeURIComponent(source.svg)}`;
  return (
    <img src={src} alt="" data-testid="logo-thumbnail" data-loaded="true" data-kind={source.kind} className="h-5 w-5 shrink-0 object-contain" />
  );
}

function LayerEditor({ layer, faceDiameterMm }: { layer: Layer; faceDiameterMm: number }) {
  const { t } = useI18n();
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const commit = useEditorStore((s) => s.commit);

  if (isLogoLayer(layer)) {
    // A logo has no content to type: its placement is all there is (R3).
    return (
      <div className="space-y-4 pt-1" data-testid="logo-layer-editor">
        <PositionAndCurve layer={layer} faceDiameterMm={faceDiameterMm} />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1" data-testid="text-layer-editor">
      <div className="space-y-1">
        <label htmlFor={`text-${layer.id}`} className={FIELD_LABEL}>
          {t("editor.branding.text")}
        </label>
        <input
          id={`text-${layer.id}`}
          data-testid="text-layer-content"
          autoComplete="off"
          spellCheck={false}
          value={layer.content.value}
          onChange={(e) => updateLayer(layer.id, { content: { value: e.target.value } })}
          onBlur={commit}
          className="w-full border-b border-border bg-transparent py-1 text-base tracking-wide text-foreground outline-none focus:border-foreground transition-colors"
        />
      </div>
      <div className="space-y-1.5">
        <span id={`layout-${layer.id}`} className={FIELD_LABEL}>
          {t("editor.branding.layout")}
        </span>
        <div role="radiogroup" aria-labelledby={`layout-${layer.id}`} className="grid grid-cols-2 border border-border" data-testid="text-layer-layout">
          {LAYOUTS.map(({ value, label }) => {
            const active = layer.placement.layout === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                data-value={value}
                onClick={() => {
                  updateLayer(layer.id, { placement: { layout: value } });
                  commit();
                }}
                className={cn(
                  "py-1.5 text-xs tracking-[0.05em] transition-colors",
                  active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(label)}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-1 min-w-0">
        <span id={`font-${layer.id}`} className={FIELD_LABEL}>
          {t("editor.branding.font")}
        </span>
        <Select
          value={layer.content.font.key}
          onValueChange={(key) => {
            updateLayer(layer.id, { content: { font: { source: "bundled", key } } });
            commit();
          }}
        >
          <SelectTrigger
            aria-labelledby={`font-${layer.id}`}
            data-testid="text-layer-font"
            className="h-8 rounded-none border-0 border-b border-border px-0 shadow-none focus:ring-0 focus:border-foreground"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {BUNDLED_FONTS.map((f) => (
              <SelectItem key={f.key} value={f.key} className="rounded-none">
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <PositionAndCurve layer={layer} faceDiameterMm={faceDiameterMm} />
    </div>
  );
}

function HistoryButton({
  testId,
  label,
  disabled,
  onClick,
  children,
}: {
  testId: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center text-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:text-muted-foreground/40"
    >
      {children}
    </button>
  );
}

/**
 * Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z (4i R2), anywhere in the editor. A focused
 * field is blurred first so its edit commits as its own entry, then undone.
 */
function useUndoShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) active.blur();
      const { undo, redo } = useEditorStore.getState();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

/**
 * BRANDING (v3-review §3): the text and its font are panel-first; spatial
 * values sit behind "Position and curve" (4h) and arrive on the model in 4i. Emboss/deboss and fill are absent
 * until their phases (rulings §6) — no placeholder controls. Undo / redo
 * (4i) cover every recipe change on this page.
 */
export function BrandingGroup({
  faceDiameterMm,
  reference,
  scaleFactor,
  process,
}: {
  faceDiameterMm: number;
  /** The product's recovered branding (raw units, C8); null → E1 §3.3 fallbacks. */
  reference: BrandingReferenceRaw | null;
  scaleFactor: number | null;
  /** The selected finish's process: a new layer's depth starts at its minimum (Phase 5 R1). */
  process: ProcessThresholds | null;
}) {
  const { t } = useI18n();
  const layers = useEditorStore((s) => s.recipe.layers);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const addLayer = useEditorStore((s) => s.addLayer);
  const modelFrame = useEditorStore((s) => s.modelFrame);
  const moveLayer = useEditorStore((s) => s.moveLayer);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore(selectCanUndo);
  const canRedo = useEditorStore(selectCanRedo);
  const logoSources = useLogoSources(layers);
  const { user, primaryBrand } = useAuth();
  const { isStaff } = useDesignerStaffStatus();
  const fileInput = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  useUndoShortcuts();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const selected = layers.find((l) => l.id === selectedLayerId) ?? null;

  /**
   * Add logo (4k R1/R2, 6a R2): an SVG is validated as text before anything is
   * stored — ≤ 200 KB, outlines only, every path closed — then parsed for its
   * aspect. A PNG or JPEG (≤ 2 MB) is accepted too, for printing only: there
   * is no outline to extrude, so the layer lands as a printed one. Signed in,
   * the file uploads to `design-uploads` and becomes a `design_assets` row;
   * anonymously it waits in the draft for the claim.
   */
  const onLogoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setLogoError(null);
    setUploading(true);
    const reject = (rejection: Parameters<typeof rejectionMessage>[0]) => {
      const { key, vars } = rejectionMessage(rejection);
      setLogoError(t(key, vars));
    };
    try {
      const raster = isRasterMime(file.type);
      const layerId = crypto.randomUUID();
      const brandId = isStaff ? null : primaryBrand?.id ?? null;
      const minDepth = process?.min_deboss_depth_mm ?? null;

      if (raster) {
        const validation = validateRasterLogo(file.type, file.size);
        const rejection = asRejection(validation);
        if (rejection) return reject(rejection);
        const dataUrl = await readAsDataUrl(file);
        const aspect = await rasterAspect(dataUrl);
        if (!aspect) return reject({ reason: "empty" });
        // A raster can only be printed (R2): it lands printed, in the ink
        // colour the buyer picks next.
        const layer = printedLayer(newLogoLayer(layerId, faceDiameterMm, aspect, null, minDepth));
        if (user) {
          const assetId = await uploadLogoAsset({ raster: dataUrl, mimeType: file.type, filename: file.name, ownerId: user.id, brandId });
          addLayer({ ...layer, content: { ...layer.content, asset_id: assetId } });
        } else {
          addLayer(layer, { filename: file.name, raster: dataUrl, mimeType: file.type });
        }
        return;
      }

      if (file.size > MAX_LOGO_BYTES) return reject({ reason: "tooLarge", limitKb: MAX_LOGO_BYTES / 1024 });
      const svg = await file.text();
      const rejection = asRejection(validateLogoSvg(svg, file.size));
      if (rejection) return reject(rejection);
      const artwork = parseLogoSvg(svg);
      if (!artwork) return reject({ reason: "empty" });
      if (user) {
        const assetId = await uploadLogoAsset({ svg, mimeType: "image/svg+xml", filename: file.name, ownerId: user.id, brandId });
        addLayer(newLogoLayer(layerId, faceDiameterMm, artwork.aspect, assetId, minDepth));
      } else {
        addLayer(newLogoLayer(layerId, faceDiameterMm, artwork.aspect, null, minDepth), { filename: file.name, svg, mimeType: "image/svg+xml" });
      }
    } catch (error) {
      setLogoError(t("editor.branding.logoFailed", { reason: String((error as Error)?.message ?? error) }));
    } finally {
      setUploading(false);
    }
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    moveLayer(
      layers.findIndex((l) => l.id === active.id),
      layers.findIndex((l) => l.id === over.id),
    );
  };

  return (
    <div className="border border-border p-4 space-y-3" data-testid="branding-group">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{t("editor.panel.branding")}</h3>
        <div className="ml-auto flex items-center">
          <HistoryButton testId="undo" label={t("editor.branding.undo")} disabled={!canUndo} onClick={undo}>
            <Undo2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          </HistoryButton>
          <HistoryButton testId="redo" label={t("editor.branding.redo")} disabled={!canRedo} onClick={redo}>
            <Redo2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          </HistoryButton>
        </div>
        <button
          type="button"
          data-testid="add-text"
          onClick={() =>
            // 4j: where the factory lettering was, once the model is on screen; E1 §3.3 fallbacks otherwise.
            addLayer(
              newTextLayer(
                crypto.randomUUID(),
                faceDiameterMm,
                "",
                recoveredDefaults(reference, modelFrame?.transform ?? null, scaleFactor, modelFrame?.markedGlyphCentres ?? []),
                process?.min_deboss_depth_mm ?? null,
              ),
            )
          }
          className="flex items-center gap-1 text-xs tracking-[0.05em] text-foreground underline-offset-4 hover:underline"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          {t("editor.branding.addText")}
        </button>
        <button
          type="button"
          data-testid="add-logo"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
          className="flex items-center gap-1 text-xs tracking-[0.05em] text-foreground underline-offset-4 hover:underline disabled:text-muted-foreground"
        >
          <ImagePlus className="w-3.5 h-3.5" strokeWidth={1.5} />
          {t("editor.branding.addLogo")}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={`image/svg+xml,.svg,${RASTER_MIME_TYPES.join(",")}`}
          data-testid="logo-input"
          className="hidden"
          onChange={(event) => void onLogoFile(event)}
        />
      </div>

      {logoError && (
        <p className="text-xs text-destructive" data-testid="logo-error">
          {logoError}
        </p>
      )}

      {layers.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("editor.branding.empty")}</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={layers.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-1.5" aria-label={t("editor.branding.layers")} data-testid="text-layers">
              {layers.map((layer) => (
                <LayerRow key={layer.id} layer={layer} selected={layer.id === selectedLayerId} logoSource={logoSources[layer.id]} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {selected && <LayerEditor key={selected.id} layer={selected} faceDiameterMm={faceDiameterMm} />}
    </div>
  );
}
