import { useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Box } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useI18n } from "@/features/i18n/I18nProvider";
import { processThresholds } from "../lib/manufacturing";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useEditorProductBySlug, variantRatio, type EditorProduct } from "../hooks/useEditorProduct";
import { useEditorAppearance } from "../hooks/useEditorAppearance";
import { useDesignerStaffStatus } from "../hooks/useDesignerStaffStatus";
import { useCatalogueEditorStatus } from "@/features/admin/hooks/useCatalogueEditorStatus";
import { useEditorStore } from "../store/useEditorStore";
import { readAnonymousDraft, writeAnonymousDraft, clearAnonymousDraft } from "../lib/anonymousDraft";
import { emptyRecipe, isLogoLayer, type DraftRecipe } from "../lib/recipe";
import { uploadLogoAsset } from "../hooks/useLogoAssets";
import { WorkspaceShell } from "../components/workspace/WorkspaceShell";
import { EditorViewport } from "../components/EditorViewport";
import { EditorPanel } from "../components/EditorPanel";
import { ManufacturingStrip } from "../components/ManufacturingStrip";
import { SignInBanner } from "../components/SignInBanner";

function defaultSizeVariantId(product: EditorProduct): string | null {
  return product.size_variants.find((v) => v.is_default)?.id ?? product.size_variants[0]?.id ?? null;
}

function defaultColourId(product: EditorProduct): string | null {
  return product.colours[0]?.id ?? null;
}

function defaultRecipe(product: EditorProduct): DraftRecipe {
  return {
    ...emptyRecipe(),
    size_variant_id: defaultSizeVariantId(product),
    finish_id: product.default_finish_id,
    colour_id: defaultColourId(product),
  };
}

/** The anonymous draft's recipe, with any id it never chose filled from the product's defaults. */
function startingRecipe(product: EditorProduct): DraftRecipe {
  const draft = readAnonymousDraft(product.slug)?.recipe;
  const defaults = defaultRecipe(product);
  if (!draft) return defaults;
  return {
    ...draft,
    size_variant_id: draft.size_variant_id ?? defaults.size_variant_id,
    finish_id: draft.finish_id ?? defaults.finish_id,
    colour_id: draft.colour_id ?? defaults.colour_id,
  };
}

function LoadingShell() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="h-3 w-40 bg-secondary animate-pulse" />
    </div>
  );
}

/**
 * `/designer-studio/editor/new?product=<slug>`.
 *
 * Signed in: insert a `designs` row (claiming any anonymous draft already in
 * sessionStorage for this product) and move to `/:designId` — R4/Phase 2's
 * R4. Anonymous: render the editor on local state only, with the sign-in
 * banner; local selections are mirrored into sessionStorage so a sign-in
 * mid-session claims the in-progress configuration, not the defaults.
 */
export function EditorNewPage({ productSlug }: { productSlug: string | null }) {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const calibration = useSearchParams()[0].get("calibration") === "1";
  const { session, user, primaryBrand, loading: authLoading } = useAuth();
  const { isStaff, loading: staffLoading } = useDesignerStaffStatus();
  const { isEditor: isCatalogueEditor } = useCatalogueEditorStatus();
  const { data: product, isLoading, error } = useEditorProductBySlug(productSlug);
  const { finishOptions, selectedFinish, colours, selectedColour, isMetal, localModel, appearanceMode, setAppearanceMode, onSelectFinish, onSelectColour } = useEditorAppearance(product);

  const recipe = useEditorStore((s) => s.recipe);
  const hydratedFor = useEditorStore((s) => s.hydratedFor);
  const { size_variant_id: sizeVariantId } = recipe;
  const ruler = recipe.view.ruler;
  const setSizeVariantId = useEditorStore((s) => s.setSizeVariantId);
  const setRuler = useEditorStore((s) => s.setRuler);
  const initialize = useEditorStore((s) => s.initialize);
  const pendingLogos = useEditorStore((s) => s.pendingLogos);
  const catalogueSnapshot = useEditorStore((s) => s.localCatalogueSnapshot);
  const catalogueRecipe = catalogueSnapshot?.recipe ?? recipe;
  const catalogueLogos = catalogueSnapshot?.pendingLogos ?? pendingLogos;
  const setPendingLogos = useEditorStore((s) => s.setPendingLogos);

  const initializedFor = useRef<string | null>(null);
  const createStarted = useRef(false);

  useEffect(() => {
    if (!product || initializedFor.current === product.id) return;
    initializedFor.current = product.id;
    // The draft's files first: `initialize` keeps only those its layers use.
    setPendingLogos(readAnonymousDraft(product.slug)?.logos ?? {});
    initialize(startingRecipe(product), `new:${product.slug}`);
  }, [product, initialize, setPendingLogos]);

  // Only once the store holds this product's recipe — never a previous page's.
  useEffect(() => {
    if (session || !product || hydratedFor !== `new:${product.slug}`) return;
    writeAnonymousDraft({ productSlug: product.slug, recipe: catalogueRecipe, logos: catalogueLogos });
  }, [session, product, hydratedFor, catalogueRecipe, catalogueLogos]);

  useEffect(() => {
    if (!session || !user || !product || localModel || authLoading || staffLoading || createStarted.current) return;
    // Buyer refusal (E1 collision 6): an unconfirmed model never gets a
    // `designs` row — signed-in visits to /new see the same awaiting-setup
    // copy as anonymous, not a created-then-orphaned design.
    if (product.model_scale_status !== "confirmed") return;
    createStarted.current = true;
    const brand_id = isStaff ? null : primaryBrand?.id ?? null;
    const claim = async () => {
      const recipeToClaim = startingRecipe(product);
      // 4k R2: a logo the anonymous draft was holding is uploaded now, and
      // the layer that referenced nothing gets its `design_assets` id. Every
      // other field of the recipe is claimed verbatim (collision 23).
      const draftLogos = readAnonymousDraft(product.slug)?.logos ?? {};
      const layers = [];
      for (const layer of recipeToClaim.layers) {
        const file = isLogoLayer(layer) && !layer.content.asset_id ? draftLogos[layer.id] : undefined;
        if (!file) {
          layers.push(layer);
          continue;
        }
        const asset_id = await uploadLogoAsset({
          svg: file.svg,
          raster: file.raster,
          mimeType: file.mimeType,
          filename: file.filename,
          ownerId: user.id,
          brandId: brand_id,
        });
        layers.push({ ...layer, content: { ...layer.content, asset_id } });
      }
      const { data, error: insertError } = await supabase
        .from("designs")
        .insert({
          name: product.name,
          product_id: product.id,
          brand_id,
          owner_id: user.id,
          status: "draft",
          draft_recipe: { ...recipeToClaim, layers } as unknown as Json,
        })
        .select("id")
        .single();
      if (insertError || !data) {
        createStarted.current = false;
        return;
      }
      clearAnonymousDraft(product.slug);
      setPendingLogos({});
      navigate(`/designer-studio/editor/${data.id}`, { replace: true });
    };
    void claim();
  }, [session, user, product, localModel, authLoading, staffLoading, isStaff, primaryBrand, navigate, setPendingLogos]);

  if (!productSlug) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-sm text-center space-y-4">
          <div className="mx-auto w-12 h-12 flex items-center justify-center border border-foreground">
            <Box className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <h1 className="text-base font-light tracking-wide text-foreground">{t("editor.new.noProductTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("editor.new.noProductBody")}</p>
          <Link to="/products" className="inline-block text-xs uppercase tracking-[0.1em] underline underline-offset-4">
            {t("editor.new.browseProducts")}
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingShell />;
  }

  if (error || !product) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-sm text-center space-y-2">
          <h1 className="text-base font-light tracking-wide text-foreground">{t("editor.new.productNotFound")}</h1>
          <Link to="/products" className="inline-block text-xs uppercase tracking-[0.1em] underline underline-offset-4">
            {t("editor.new.browseProducts")}
          </Link>
        </div>
      </div>
    );
  }

  // Signed-in visits to /new create a design and move on, but only once the
  // model's scale is confirmed — an unconfirmed product falls through to the
  // same awaiting-setup viewport an anonymous visitor sees (E1 collision 6).
  if (session && !localModel && product.model_scale_status === "confirmed") {
    return <LoadingShell />;
  }

  const selectedSize = product.size_variants.find((v) => v.id === sizeVariantId) ?? product.size_variants[0] ?? null;
  const referenceVariant = product.size_variants.find((v) => v.id === product.model_scale_reference_variant_id) ?? null;
  const referenceMm = referenceVariant?.size_primary_mm ?? selectedSize?.size_primary_mm ?? 1;
  const variantScale = selectedSize && referenceMm > 0 ? selectedSize.size_primary_mm / referenceMm : 1;

  return (
    <WorkspaceShell
      banner={!session && !calibration ? <SignInBanner /> : undefined}
      viewport={
        <EditorViewport
          modelStoragePath={product.model_storage_path}
          scaleStatus={product.model_scale_status}
          scaleFactor={product.model_scale_factor}
          variantScale={variantScale}
          sizePrimaryMm={localModel ? 0 : selectedSize?.size_primary_mm ?? 0}
          sizeLigne={localModel ? null : selectedSize?.size_ligne ?? null}
          sizeLabel={localModel ? null : selectedSize?.size_label ?? null}
          isMetal={isMetal}
          finish={selectedFinish}
          colour={selectedColour}
          productId={product.id}
          isCatalogueEditor={isCatalogueEditor}
          ruler={ruler}
          onRulerToggle={() => setRuler(!ruler)}
          layers={recipe.layers}
          markedGroupIndices={product.model_branding_group_indices}
          process={processThresholds(selectedFinish?.process, language)}
        />
      }
      // E2 U10: the verdict spans the workspace, so the shell renders it under
      // both columns rather than the viewport carrying it in its own.
      strip={<ManufacturingStrip layers={recipe.layers} process={processThresholds(selectedFinish?.process, language)} />}
      panel={
        <EditorPanel
          product={product}
          localModelName={localModel?.name}
          appearanceMode={appearanceMode}
          onAppearanceModeChange={setAppearanceMode}
          sizeVariantId={sizeVariantId}
          onSizeVariantChange={(id) => setSizeVariantId(id, variantRatio(product, sizeVariantId, id))}
          finishOptions={finishOptions}
          selectedFinish={selectedFinish}
          onSelectFinish={onSelectFinish}
          colours={colours}
          selectedColour={selectedColour}
          onSelectColour={onSelectColour}
        />
      }
    />
  );
}
