import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useI18n } from "@/features/i18n/I18nProvider";
import { supabase } from "@/integrations/supabase/client";
import { useEditorProductBySlug, type EditorProduct } from "../hooks/useEditorProduct";
import { useFinishOptions, type PickerFinish } from "../hooks/useFinishOptions";
import { useDesignerStaffStatus } from "../hooks/useDesignerStaffStatus";
import { useEditorStore } from "../store/useEditorStore";
import { readAnonymousDraft, writeAnonymousDraft, clearAnonymousDraft } from "../lib/anonymousDraft";
import { EditorShell } from "../components/EditorShell";
import { EditorViewport } from "../components/EditorViewport";
import { MeasurementLine } from "../components/MeasurementLine";
import { EditorPanel } from "../components/EditorPanel";
import { SignInBanner } from "../components/SignInBanner";

function defaultSizeVariantId(product: EditorProduct): string | null {
  return product.size_variants.find((v) => v.is_default)?.id ?? product.size_variants[0]?.id ?? null;
}

function defaultColourId(product: EditorProduct): string | null {
  return product.colours[0]?.id ?? null;
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
  const { t } = useI18n();
  const { session, user, primaryBrand, loading: authLoading } = useAuth();
  const { isStaff, loading: staffLoading } = useDesignerStaffStatus();
  const { data: product, isLoading, error } = useEditorProductBySlug(productSlug);
  const { data: finishOptions = [] } = useFinishOptions(product?.id ?? null, product?.is_metal ?? false);

  const sizeVariantId = useEditorStore((s) => s.sizeVariantId);
  const finishId = useEditorStore((s) => s.finishId);
  const colourId = useEditorStore((s) => s.colourId);
  const setSizeVariantId = useEditorStore((s) => s.setSizeVariantId);
  const setColourId = useEditorStore((s) => s.setColourId);
  const setFinishId = useEditorStore((s) => s.setFinishId);
  const initialize = useEditorStore((s) => s.initialize);

  const initializedFor = useRef<string | null>(null);
  const createStarted = useRef(false);

  useEffect(() => {
    if (!product || initializedFor.current === product.id) return;
    initializedFor.current = product.id;
    const draft = readAnonymousDraft(product.slug);
    initialize({
      sizeVariantId: draft?.sizeVariantId ?? defaultSizeVariantId(product),
      finishId: draft?.finishId ?? product.default_finish_id,
      colourId: draft?.colourId ?? defaultColourId(product),
    });
  }, [product, initialize]);

  useEffect(() => {
    if (session || !product) return;
    writeAnonymousDraft({ productSlug: product.slug, sizeVariantId, finishId, colourId });
  }, [session, product, sizeVariantId, finishId, colourId]);

  useEffect(() => {
    if (!session || !user || !product || authLoading || staffLoading || createStarted.current) return;
    createStarted.current = true;
    const draft = readAnonymousDraft(product.slug);
    const brand_id = isStaff ? null : primaryBrand?.id ?? null;
    supabase
      .from("designs")
      .insert({
        name: product.name,
        product_id: product.id,
        brand_id,
        owner_id: user.id,
        status: "draft",
        draft_recipe: {
          size_variant_id: draft?.sizeVariantId ?? defaultSizeVariantId(product),
          finish_id: draft?.finishId ?? product.default_finish_id,
          colour_id: draft?.colourId ?? defaultColourId(product),
        },
      })
      .select("id")
      .single()
      .then(({ data, error: insertError }) => {
        if (insertError || !data) {
          createStarted.current = false;
          return;
        }
        clearAnonymousDraft(product.slug);
        navigate(`/designer-studio/editor/${data.id}`, { replace: true });
      });
  }, [session, user, product, authLoading, staffLoading, isStaff, primaryBrand, navigate]);

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

  // Signed-in visits to /new always create a design and move on — this
  // page never renders the live editor for a signed-in user.
  if (session) {
    return <LoadingShell />;
  }

  const selectedSize = product.size_variants.find((v) => v.id === sizeVariantId) ?? product.size_variants[0] ?? null;
  const selectedFinish: PickerFinish | null =
    finishOptions.find((f) => f.id === finishId) ?? finishOptions.find((f) => f.id === product.default_finish_id) ?? finishOptions[0] ?? null;
  const selectedColour = product.colours.find((c) => c.id === colourId) ?? product.colours[0] ?? null;

  return (
    <EditorShell
      banner={<SignInBanner />}
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
        />
      }
    />
  );
}
