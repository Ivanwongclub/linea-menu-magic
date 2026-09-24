import { useRef, useState } from "react";
import { ImagePlus, Plus } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useEditorStore } from "../../store/useEditorStore";
import { newTextLayer } from "../../lib/recipe";
import { RASTER_MIME_TYPES } from "../../lib/logoSvg";
import { useLogoSources } from "../../hooks/useLogoAssets";
import { useLogoUpload } from "../../hooks/useLogoUpload";
import { recoveredDefaults, type BrandingReferenceRaw } from "../../lib/recoveredPlacement";
import type { ProcessThresholds } from "../../lib/manufacturing";
import { AddZoneButton, ZoneList } from "../branding/ZonesSection";
import { LayerList } from "../branding/LayerList";
import { PartsGroup } from "../PartsGroup";
import { DockSection } from "./DockSection";

/**
 * The layers dock (E2 U5): everything that is on the part, in three sections
 * with a count each — Branding, Zones, Parts — instead of one column that ran
 * the buyer's two text layers into the model's 33 OBJ groups.
 *
 * This is also what retires standing ruling 3. The dock has a height of its
 * own and scrolls inside it, so Properties sits *below the dock* rather than
 * below however many rows the model happens to have: opening Parts no longer
 * pushes the selected layer's controls off the bottom of the panel. It is the
 * single-column answer to E2 §3.1's two docks — U4 shipped fixed zones with one
 * panel, so the split is vertical, not a second edge.
 *
 * Its header carries the panel's heading, which is all `workspace-chrome` had
 * left after U7 moved the chrome buttons into the document bar.
 */
export function LayersDock({
  faceDiameterMm,
  reference,
  scaleFactor,
  process,
  markedGroupIndices,
}: {
  faceDiameterMm: number;
  /** The product's recovered branding (raw units, C8); null → E1 §3.3 fallbacks. */
  reference: BrandingReferenceRaw | null;
  scaleFactor: number | null;
  /** The selected finish's process: a new layer's depth starts at its minimum (Phase 5 R1). */
  process: ProcessThresholds | null;
  markedGroupIndices: number[];
}) {
  const { t } = useI18n();
  const body = useRef<HTMLDivElement>(null);
  // Parts closed, the rest open (E2 §3.4 item 3). Section state is the
  // workspace's, not the design's, and a reload starts here again — see U5's
  // open question on persisting it.
  const [open, setOpen] = useState({ branding: true, zones: true, parts: false });
  const toggle = (key: keyof typeof open) => () => setOpen((s) => ({ ...s, [key]: !s[key] }));

  // Where a new plane zone cuts by default: half way up the part (6b R2).
  const partsReport = useEditorStore((s) => s.partsReport);
  const defaultPlaneMm = partsReport ? (partsReport.bounds.minY + partsReport.bounds.maxY) / 2 : 0;
  const layers = useEditorStore((s) => s.recipe.layers);
  const zones = useEditorStore((s) => s.recipe.zones);
  const addLayer = useEditorStore((s) => s.addLayer);
  const modelFrame = useEditorStore((s) => s.modelFrame);
  const logoSources = useLogoSources(layers);
  const minDepthMm = process?.min_deboss_depth_mm ?? null;
  const { fileInput, logoError, uploading, onLogoFile, signedIn } = useLogoUpload({ faceDiameterMm, minDepthMm });

  return (
    <div className="border border-border" data-testid="layers-dock">
      <div className="border-b border-border px-3 py-1.5" data-testid="layers-dock-header">
        <h3 className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{t("editor.layers.title")}</h3>
      </div>

      {/* The dock's own height, which is what keeps Properties on screen. A
          share of the viewport rather than a row count: the rows are three
          different heights, and the panel is as tall as the window is. */}
      <div ref={body} data-testid="layers-dock-body" className="max-h-[40vh] overflow-y-auto overflow-x-hidden">
        <DockSection
          testId="branding-group"
          toggleTestId="branding-toggle"
          title={t("editor.panel.branding")}
          count={layers.length}
          open={open.branding}
          onToggle={toggle("branding")}
          actions={
            <>
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
                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                {t("editor.branding.addText")}
              </button>
              <button
                type="button"
                data-testid="add-logo"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
                className="flex items-center gap-1 text-xs tracking-[0.05em] text-foreground underline-offset-4 hover:underline disabled:text-muted-foreground"
              >
                <ImagePlus className="h-3.5 w-3.5" strokeWidth={1.5} />
                {t("editor.branding.addLogo")}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept={signedIn ? `image/svg+xml,.svg,${RASTER_MIME_TYPES.join(",")},.png,.jpg,.jpeg` : "image/svg+xml,.svg"}
                data-testid="logo-input"
                className="hidden"
                onChange={(event) => void onLogoFile(event)}
              />
            </>
          }
        >
          {logoError && (
            <p className="pb-2 text-xs text-destructive" data-testid="logo-error">
              {logoError}
            </p>
          )}
          {!signedIn && (
            <p className="pb-2 text-[11px] text-muted-foreground" data-testid="logo-anonymous-note">
              {t("editor.branding.logoSignInForImages")}
            </p>
          )}
          <LayerList layers={layers} logoSources={logoSources} />
        </DockSection>

        <DockSection
          testId="zones-section"
          toggleTestId="zones-toggle"
          title={t("editor.zones.title")}
          count={zones?.length ?? 0}
          open={open.zones}
          onToggle={toggle("zones")}
          actions={<AddZoneButton defaultPlaneMm={defaultPlaneMm} />}
        >
          <ZoneList />
        </DockSection>

        <PartsGroup markedGroupIndices={markedGroupIndices} open={open.parts} onToggle={toggle("parts")} scrollerRef={body} />
      </div>
    </div>
  );
}
