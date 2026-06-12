import { Link } from "react-router-dom";
import {
  ArrowRight,
  Library,
  Layers,
  Box,
  Link2,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import StudioHero3D, { HERO_EDITOR_URL } from "@/components/designer-studio/StudioHero3D";
import StudioCapabilityTile from "@/components/designer-studio/StudioCapabilityTile";
import StudioWorkflowRail from "@/components/designer-studio/StudioWorkflowRail";
import { useProducts } from "@/features/products/hooks/useProducts";
import {
  pickFamilyFeatured,
  getFamilyNameForProduct,
} from "@/features/products/utils/pickFamilyFeatured";
import { getProductImageUrl } from "@/lib/productImage";
import { getProductThumbnailUrl } from "@/features/products/utils/productImagePlaceholder";

const REVEAL_BASE = "transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]";

const trustWordmarks = [
  { name: "GLOBAL APPAREL BRANDS" },
  { name: "PREMIUM DENIM HOUSES" },
  { name: "OUTDOOR & PERFORMANCE" },
  { name: "LUXURY READY-TO-WEAR" },
  { name: "HERITAGE SPORTSWEAR" },
];

const DesignerStudio = () => {
  const { t } = useI18n();
  const { session } = useAuth();

  // SAME data + SAME picker as the trim library — guarantees parity.
  const { products } = useProducts({
    visibility: session ? "brand" : "public",
  });
  const featuredProducts = pickFamilyFeatured(products);

  const workspaceHref = session
    ? "/designer-studio/dashboard?tab=library"
    : "/designer-studio/login";

  const trust = useScrollAnimation();
  const featured = useScrollAnimation();
  const caps = useScrollAnimation();
  const flow = useScrollAnimation();
  const metrics = useScrollAnimation();
  const faq = useScrollAnimation();
  const bottom = useScrollAnimation();

  const capabilities = [
    { icon: Library, t: "cap1", to: "/designer-studio/trim-library" },
    { icon: Layers, t: "cap2", to: "/designer-studio/editor" },
    { icon: Box, t: "cap3", to: HERO_EDITOR_URL },
    { icon: Link2, t: "cap4", to: "/ecollections" },
    { icon: ClipboardList, t: "cap5", to: "/contact" },
    { icon: ShieldCheck, t: "cap6", to: workspaceHref },
  ] as const;

  return (
    <>
      {/* 1. HERO */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-secondary/40 via-background to-background py-20 lg:py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-5">
              {t("studioIntro.eyebrow")}
            </p>
            <h1 className="text-4xl lg:text-6xl font-semibold tracking-tight text-foreground leading-[1.05] mb-6">
              {t("studioIntro.title")}
            </h1>
            <p className="text-sm lg:text-base text-muted-foreground max-w-xl leading-relaxed mb-8">
              {t("studioIntro.subtitle")}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to={HERO_EDITOR_URL}>
                <Button size="lg" className="tracking-[0.05em] text-xs px-8 uppercase">
                  {t("studioIntro.heroCta3d")}
                </Button>
              </Link>
              <Link to="/designer-studio/trim-library">
                <Button variant="outline" size="lg" className="tracking-[0.05em] text-xs px-8 uppercase">
                  {t("studioIntro.primaryCta")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:pl-4">
            <StudioHero3D />
          </div>
        </div>
      </section>

      {/* 2. TRUST STRIP */}
      <section
        ref={trust.ref}
        className={`border-b border-border bg-background py-8 px-6 lg:px-8 ${REVEAL_BASE} ${trust.isVisible ? "opacity-100" : "opacity-0"}`}
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
            {t("studioIntro.trustLabel")}
          </p>
          <div className="flex-1 flex flex-wrap items-center justify-center lg:justify-end gap-x-8 lg:gap-x-12 gap-y-3">
            {trustWordmarks.map(({ name }) => (
              <span
                key={name}
                className="text-[11px] tracking-[0.22em] text-foreground/40 font-semibold"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED TRIM STRIP */}
      <section
        ref={featured.ref}
        className={`py-16 lg:py-20 px-6 lg:px-8 bg-secondary/30 border-b border-border ${REVEAL_BASE} ${featured.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
              {t("studioIntro.featuredLabel")}
            </p>
            <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
              {t("studioIntro.featuredTitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
            {featuredProducts.map((p) => {
              const family = getFamilyNameForProduct(p);
              const editorUrl = p.model_url
                ? `/designer-studio/editor?model=${encodeURIComponent(p.model_url)}&name=${encodeURIComponent(p.name)}&slug=${encodeURIComponent(p.slug)}`
                : null;
              const primaryCategory =
                p.primary_category ?? p.categories?.[0];
              const imageSrc = p.thumbnail_url
                ? getProductImageUrl(p.thumbnail_url, "card")
                : getProductThumbnailUrl(
                    p.name,
                    p.item_code,
                    primaryCategory?.slug,
                    primaryCategory?.name,
                  );
              return (
                <div key={p.id} className="border border-border bg-background overflow-hidden">
                  <div className="aspect-[4/3] overflow-hidden bg-secondary/50">
                    <img
                      src={imageSrc}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    {family && (
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                        {family}
                      </p>
                    )}
                    <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Link to={`/designer-studio/products/${p.slug}`}>
                        <Button variant="outline" size="sm" className="text-[10px] uppercase tracking-[0.12em] h-7 px-3">
                          Details
                        </Button>
                      </Link>
                      {editorUrl && (
                        <Link to={editorUrl}>
                          <Button size="sm" className="text-[10px] uppercase tracking-[0.12em] h-7 px-3">
                            Open in Editor
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. CAPABILITY GRID */}
      <section
        ref={caps.ref}
        className={`py-20 lg:py-24 px-6 lg:px-8 bg-background ${REVEAL_BASE} ${caps.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 lg:mb-14">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
              {t("studioIntro.capabilitiesEyebrow")}
            </p>
            <h2 className="text-2xl lg:text-4xl font-semibold tracking-tight text-foreground">
              {t("studioIntro.capabilitiesTitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {capabilities.map(({ icon, t: key, to }) => (
              <StudioCapabilityTile
                key={key}
                icon={icon}
                title={t(`studioIntro.${key}Title`)}
                body={t(`studioIntro.${key}Body`)}
                to={to}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 5. WORKFLOW RAIL */}
      <section
        ref={flow.ref}
        className={`py-20 lg:py-24 px-6 lg:px-8 bg-secondary/30 border-y border-border ${REVEAL_BASE} ${flow.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-14 mb-14">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
                {t("studioIntro.flowLabel")}
              </p>
              <h2 className="text-2xl lg:text-4xl font-semibold tracking-tight text-foreground">
                {t("studioIntro.flowTitle")}
              </h2>
            </div>
            <p className="text-sm lg:text-base text-muted-foreground leading-relaxed self-end">
              {t("studioIntro.flowBody")}
            </p>
          </div>

          <StudioWorkflowRail />
        </div>
      </section>

      {/* 6. METRICS STRIP */}
      {/* TODO: replace metric values with live data once analytics pipeline is set up */}
      <section
        ref={metrics.ref}
        className={`py-16 lg:py-20 px-6 lg:px-8 bg-background border-b border-border ${REVEAL_BASE} ${metrics.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-8 text-center">
            {t("studioIntro.metricsLabel")}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-x divide-border lg:divide-y-0 border border-border bg-background">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="px-6 py-8 lg:py-10 text-center">
                <div className="text-3xl lg:text-5xl font-semibold tracking-tight text-foreground mb-2">
                  {t(`studioIntro.metric${i}Value`)}
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t(`studioIntro.metric${i}Label`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ — always open, 2-column grid */}
      <section
        ref={faq.ref}
        className={`py-20 lg:py-24 px-6 lg:px-8 bg-secondary/30 border-b border-border ${REVEAL_BASE} ${faq.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
              {t("studioIntro.faqLabel")}
            </p>
            <h2 className="text-2xl lg:text-4xl font-semibold tracking-tight text-foreground">
              {t("studioIntro.faqTitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">
                  {t(`studioIntro.faq${i}Q`)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`studioIntro.faq${i}A`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA */}
      <section
        ref={bottom.ref}
        className={`relative overflow-hidden py-20 lg:py-24 px-6 lg:px-8 bg-foreground text-background ${REVEAL_BASE} ${bottom.isVisible ? "opacity-100" : "opacity-0"}`}
      >
        <img
          src="/images/studio/cta-backdrop.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/70 to-black/80" aria-hidden="true" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-2xl lg:text-4xl font-semibold tracking-tight mb-4">
            {t("studioIntro.bottomTitle")}
          </h2>
          <p className="text-sm lg:text-base text-background/85 leading-relaxed max-w-2xl mx-auto mb-8">
            {t("studioIntro.bottomBody")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/designer-studio/trim-library">
              <Button variant="outline-inverse" size="lg" className="tracking-[0.05em] text-xs px-8 uppercase">
                {t("studioIntro.primaryCta")}
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                variant="ghost"
                size="lg"
                className="tracking-[0.05em] text-xs px-8 uppercase text-background hover:bg-background/10"
              >
                <span>{t("studioIntro.contactCta")}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default DesignerStudio;
