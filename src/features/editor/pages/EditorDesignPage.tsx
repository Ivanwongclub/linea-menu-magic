import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { useI18n } from "@/features/i18n/I18nProvider";
import { supabase } from "@/integrations/supabase/client";
import { useEditorProductById, variantRatio } from "../hooks/useEditorProduct";
import { normalizeRecipe } from "../lib/recipe";
import { useFinishOptions, type PickerFinish } from "../hooks/useFinishOptions";
import { useAutosaveDraft } from "../hooks/useAutosaveDraft";
import { useDesignerStaffStatus } from "../hooks/useDesignerStaffStatus";
import { useCatalogueEditorStatus } from "@/features/admin/hooks/useCatalogueEditorStatus";
import { useEditorStore } from "../store/useEditorStore";
import { EditorShell } from "../components/EditorShell";
import { EditorViewport } from "../components/EditorViewport";
import { EditorPanel } from "../components/EditorPanel";

interface DesignRow {
  id: string;
  product_id: string | null;
  /** Any stored version; `normalizeRecipe` reads a v1 row as `layers: []`, ruler off (collision 27). */
  draft_recipe: unknown;
}

async function fetchDesign(designId: string): Promise<DesignRow | null> {
  const { data, error } = await supabase.from("designs").select("id, product_id, draft_recipe").eq("id", designId).maybeSingle();
  if (error) throw new Error(error.message);
  return data as DesignRow | null;
}

function LoadingShell() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="h-3 w-40 bg-secondary animate-pulse" />
    </div>
  );
}

/**
 * `/designer-studio/editor/:designId`. Anon has no grant on `designs`
 * (Phase 1 R5) — send them to sign in rather than let the RLS/grant denial
 * surface as an error.
 */
export function EditorDesignPage({ designId }: { designId: string }) {
  const location = useLocation();
  const { t } = useI18n();
  const { session, loading: authLoading } = useAuth();

  const designQuery = useQuery({
    queryKey: ["editor-design", designId],
    queryFn: () => fetchDesign(designId),
    enabled: !!session,
  });

  const { data: product, isLoading: productLoading } = useEditorProductById(designQuery.data?.product_id ?? null);
  const { data: finishOptions = [] } = useFinishOptions(product?.id ?? null, product?.is_metal ?? false);
  const { isEditor: isCatalogueEditor } = useCatalogueEditorStatus();
  const { isStaff } = useDesignerStaffStatus();

  const recipe = useEditorStore((s) => s.recipe);
  const hydratedFor = useEditorStore((s) => s.hydratedFor);
  const { size_variant_id: sizeVariantId, finish_id: finishId, colour_id: colourId } = recipe;
  const ruler = recipe.view.ruler;
  const setSizeVariantId = useEditorStore((s) => s.setSizeVariantId);
  const setFinishId = useEditorStore((s) => s.setFinishId);
  const setColourId = useEditorStore((s) => s.setColourId);
  const setRuler = useEditorStore((s) => s.setRuler);
  const initialize = useEditorStore((s) => s.initialize);

  useEffect(() => {
    if (!product || !designQuery.data) return;
    const stored = normalizeRecipe(designQuery.data.draft_recipe);
    initialize(
      {
        ...stored,
        size_variant_id: stored.size_variant_id ?? product.size_variants.find((v) => v.is_default)?.id ?? product.size_variants[0]?.id ?? null,
        finish_id: stored.finish_id ?? product.default_finish_id,
        colour_id: stored.colour_id ?? product.colours[0]?.id ?? null,
      },
      designId,
    );
    // Read once at load; re-running on every field change would stomp the
    // buyer's in-progress local selections.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, designQuery.data?.id]);

  const dragging = useEditorStore((s) => s.dragging);
  const flushSeq = useEditorStore((s) => s.flushSeq);
  const saveStatus = useAutosaveDraft(designQuery.data ? designId : null, recipe, hydratedFor, { paused: dragging, flushSeq });

  if (authLoading) {
    return <LoadingShell />;
  }

  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/designer-studio/login?next=${next}`} replace />;
  }

  if (designQuery.isLoading || (designQuery.data && productLoading)) {
    return <LoadingShell />;
  }

  if (!designQuery.data || !product) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-sm text-center space-y-2">
          <h1 className="text-base font-light tracking-wide text-foreground">{t("editor.design.notFoundTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("editor.design.notFoundBody")}</p>
        </div>
      </div>
    );
  }

  const selectedSize = product.size_variants.find((v) => v.id === sizeVariantId) ?? product.size_variants[0] ?? null;
  const selectedFinish: PickerFinish | null =
    finishOptions.find((f) => f.id === finishId) ?? finishOptions.find((f) => f.id === product.default_finish_id) ?? finishOptions[0] ?? null;
  const selectedColour = product.colours.find((c) => c.id === colourId) ?? product.colours[0] ?? null;
  const referenceVariant = product.size_variants.find((v) => v.id === product.model_scale_reference_variant_id) ?? null;
  const referenceMm = referenceVariant?.size_primary_mm ?? selectedSize?.size_primary_mm ?? 1;
  const variantScale = selectedSize && referenceMm > 0 ? selectedSize.size_primary_mm / referenceMm : 1;

  return (
    <EditorShell
      viewport={
        <EditorViewport
          modelStoragePath={product.model_storage_path}
          scaleStatus={product.model_scale_status}
          scaleFactor={product.model_scale_factor}
          variantScale={variantScale}
          sizePrimaryMm={selectedSize?.size_primary_mm ?? 0}
          sizeLigne={selectedSize?.size_ligne ?? null}
          sizeLabel={selectedSize?.size_label ?? null}
          isMetal={product.is_metal}
          finish={selectedFinish}
          colour={selectedColour}
          productId={product.id}
          isCatalogueEditor={isCatalogueEditor}
          ruler={ruler}
          onRulerToggle={() => setRuler(!ruler)}
          layers={recipe.layers}
          markedGroupIndices={product.model_branding_group_indices}
          canShowOriginal={isCatalogueEditor || isStaff}
        />
      }
      panel={
        <EditorPanel
          product={product}
          sizeVariantId={sizeVariantId}
          onSizeVariantChange={(id) => setSizeVariantId(id, variantRatio(product, sizeVariantId, id))}
          finishOptions={finishOptions}
          selectedFinish={selectedFinish}
          onSelectFinish={(f) => setFinishId(f.id)}
          colours={product.colours}
          selectedColour={selectedColour}
          onSelectColour={(c) => setColourId(c.id)}
          saveStatus={saveStatus}
        />
      }
    />
  );
}
