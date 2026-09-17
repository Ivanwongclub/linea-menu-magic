import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { useI18n } from "@/features/i18n/I18nProvider";
import { supabase } from "@/integrations/supabase/client";
import { useEditorProductById } from "../hooks/useEditorProduct";
import { useFinishOptions, type PickerFinish } from "../hooks/useFinishOptions";
import { useAutosaveDraft } from "../hooks/useAutosaveDraft";
import { useEditorStore } from "../store/useEditorStore";
import { EditorShell } from "../components/EditorShell";
import { EditorViewport } from "../components/EditorViewport";
import { MeasurementLine } from "../components/MeasurementLine";
import { EditorPanel } from "../components/EditorPanel";

interface DesignRow {
  id: string;
  product_id: string | null;
  draft_recipe: { size_variant_id?: string; finish_id?: string; colour_id?: string } | null;
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

  const sizeVariantId = useEditorStore((s) => s.sizeVariantId);
  const finishId = useEditorStore((s) => s.finishId);
  const colourId = useEditorStore((s) => s.colourId);
  const setSizeVariantId = useEditorStore((s) => s.setSizeVariantId);
  const setFinishId = useEditorStore((s) => s.setFinishId);
  const setColourId = useEditorStore((s) => s.setColourId);
  const initialize = useEditorStore((s) => s.initialize);

  useEffect(() => {
    if (!product || !designQuery.data) return;
    const recipe = designQuery.data.draft_recipe ?? {};
    initialize({
      sizeVariantId: recipe.size_variant_id ?? product.size_variants.find((v) => v.is_default)?.id ?? product.size_variants[0]?.id ?? null,
      finishId: recipe.finish_id ?? product.default_finish_id,
      colourId: recipe.colour_id ?? product.colours[0]?.id ?? null,
    });
    // Read once at load; re-running on every field change would stomp the
    // buyer's in-progress local selections.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, designQuery.data?.id]);

  const saveStatus = useAutosaveDraft(designQuery.data ? designId : null, {
    size_variant_id: sizeVariantId,
    finish_id: finishId,
    colour_id: colourId,
  });

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

  return (
    <EditorShell
      viewport={
        <EditorViewport
          modelStoragePath={product.model_storage_path}
          sizePrimaryMm={selectedSize?.size_primary_mm ?? 0}
          isMetal={product.is_metal}
          finish={selectedFinish}
          colour={selectedColour}
        />
      }
      measurement={
        selectedSize ? (
          <MeasurementLine
            productName={product.name}
            sizePrimaryMm={selectedSize.size_primary_mm}
            sizeLigne={selectedSize.size_ligne}
            sizeLabel={selectedSize.size_label}
          />
        ) : undefined
      }
      panel={
        <EditorPanel
          product={product}
          sizeVariantId={sizeVariantId}
          onSizeVariantChange={setSizeVariantId}
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
