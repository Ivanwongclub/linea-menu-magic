import { ImagePlus, Plus, Redo2, Undo2 } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { selectCanRedo, selectCanUndo, selectSelectedLayerId, useEditorStore } from "../../store/useEditorStore";
import { newTextLayer } from "../../lib/recipe";
import { RASTER_MIME_TYPES } from "../../lib/logoSvg";
import { useLogoSources } from "../../hooks/useLogoAssets";
import { useLogoUpload } from "../../hooks/useLogoUpload";
import { useUndoShortcuts } from "../../hooks/useUndoShortcuts";
import { recoveredDefaults, type BrandingReferenceRaw } from "../../lib/recoveredPlacement";
import type { ProcessThresholds } from "../../lib/manufacturing";
import { AddZoneButton, ZoneList } from "./ZonesSection";
import { LayerList } from "./LayerList";
import { LayerProperties } from "./LayerProperties";

/**
 * BRANDING (v3-review §3): what is on the part and what is selected. Since
 * E2 U2 this component only composes — the list is `LayerList`, the selected
 * layer's fields are `LayerProperties`, the row controls are
 * `LayerRowControls`, and the upload is `useLogoUpload`. U6 mounts the
 * properties in the Properties panel instead; nothing here has to move with
 * them.
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
  // Where a new plane zone cuts by default: half way up the part (6b R2).
  const partsReport = useEditorStore((s) => s.partsReport);
  const defaultPlaneMm = partsReport ? (partsReport.bounds.minY + partsReport.bounds.maxY) / 2 : 0;
  const layers = useEditorStore((s) => s.recipe.layers);
  const selectedLayerId = useEditorStore(selectSelectedLayerId);
  const addLayer = useEditorStore((s) => s.addLayer);
  const modelFrame = useEditorStore((s) => s.modelFrame);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore(selectCanUndo);
  const canRedo = useEditorStore(selectCanRedo);
  const logoSources = useLogoSources(layers);
  const minDepthMm = process?.min_deboss_depth_mm ?? null;
  const { fileInput, logoError, uploading, onLogoFile, signedIn } = useLogoUpload({ faceDiameterMm, minDepthMm });
  useUndoShortcuts();

  const selected = layers.find((l) => l.id === selectedLayerId) ?? null;

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
                minDepthMm,
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
        <AddZoneButton defaultPlaneMm={defaultPlaneMm} />
        <input
          ref={fileInput}
          type="file"
          accept={signedIn ? `image/svg+xml,.svg,${RASTER_MIME_TYPES.join(",")},.png,.jpg,.jpeg` : "image/svg+xml,.svg"}
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

      {!signedIn && (
        <p className="text-[11px] text-muted-foreground" data-testid="logo-anonymous-note">
          {t("editor.branding.logoSignInForImages")}
        </p>
      )}

      <ZoneList />

      <LayerList layers={layers} logoSources={logoSources} />

      {selected && <LayerProperties key={selected.id} layer={selected} faceDiameterMm={faceDiameterMm} />}
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
