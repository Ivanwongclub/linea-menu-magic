import React, { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CookieProvider } from "@/features/cookies/CookieProvider";
import CookieBanner from "@/features/cookies/CookieBanner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import BackToTop from "./components/ui/BackToTop";
import Layout from "./components/layout/Layout";
import { ENV } from "./config/env";

// Homepage loaded eagerly — it's the landing route
import Index from "./pages/Index";

// All other routes lazy-loaded to reduce initial JS bundle
const loadAbout = () => import("./pages/About");
const loadProducts = () => import("./pages/Products");
const loadProductDetail = () => import("./pages/ProductDetail");
const loadSustainability = () => import("./pages/Sustainability");
const loadNews = () => import("./pages/News");
const loadNewsDetail = () => import("./pages/NewsDetail");
const loadDesignerStudio = () => import("./pages/DesignerStudio");
const loadDesignerStudioDashboard = () => import("./pages/DesignerStudioDashboard");
const loadComposerPage = () => import("./features/designer/pages/ComposerPage");
const loadPresentationPage = () => import("./features/designer/pages/PresentationPage");
const loadBrochures = () => import("./pages/Brochures");
const loadBrochureViewer = () => import("./pages/BrochureViewer");
const loadContact = () => import("./pages/Contact");
const loadPrivacyPolicy = () => import("./pages/PrivacyPolicy");
const loadTermsOfService = () => import("./pages/TermsOfService");
const loadNotFound = () => import("./pages/NotFound");
const loadCookiePolicy = () => import("./pages/CookiePolicy");
const loadOurStory = () => import("./pages/about/OurStory");
const loadFactory = () => import("./pages/about/Factory");
const loadCertificates = () => import("./pages/about/Certificates");
const loadProduction = () => import("./pages/Production");

const About = lazy(loadAbout);
const Products = lazy(loadProducts);
const ProductDetail = lazy(loadProductDetail);
const Sustainability = lazy(loadSustainability);
const News = lazy(loadNews);
const NewsDetail = lazy(loadNewsDetail);
const DesignerStudio = lazy(loadDesignerStudio);
const DesignerStudioDashboard = lazy(loadDesignerStudioDashboard);
const ComposerPage = lazy(loadComposerPage);
const PresentationPage = lazy(loadPresentationPage);
const Brochures = lazy(loadBrochures);
const BrochureViewer = lazy(loadBrochureViewer);
const Contact = lazy(loadContact);
const PrivacyPolicy = lazy(loadPrivacyPolicy);
const TermsOfService = lazy(loadTermsOfService);
const NotFound = lazy(loadNotFound);
const CookiePolicy = lazy(loadCookiePolicy);
const OurStory = lazy(loadOurStory);
const Factory = lazy(loadFactory);
const Certificates = lazy(loadCertificates);
const Production = lazy(loadProduction);

const routePreloaders: Array<() => Promise<unknown>> = [
  loadAbout,
  loadProducts,
  loadProductDetail,
  loadSustainability,
  loadNews,
  loadNewsDetail,
  loadBrochures,
  loadContact,
];


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-lg font-light tracking-wide text-foreground">Something went wrong.</h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Please refresh the page. If the problem persists, contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs px-6 py-2 border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function RouteTransitionFallback() {
  return (
    <div className="min-h-[45vh] px-6 lg:px-8 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="h-3 w-40 bg-secondary animate-pulse rounded mb-6" />
        <div className="h-24 w-full bg-secondary animate-pulse rounded mb-4" />
        <div className="h-24 w-full bg-secondary animate-pulse rounded mb-4" />
        <div className="h-24 w-3/4 bg-secondary animate-pulse rounded" />
      </div>
    </div>
  );
}

function withRouteSuspense(element: React.ReactElement) {
  return <Suspense fallback={<RouteTransitionFallback />}>{element}</Suspense>;
}

function RouteAndNetworkWarmup() {
  useEffect(() => {
    const href = new URL(ENV.SUPABASE_URL).origin;
    const linkTags: HTMLLinkElement[] = [];

    const addLink = (rel: "preconnect" | "dns-prefetch") => {
      const link = document.createElement("link");
      link.rel = rel;
      link.href = href;
      if (rel === "preconnect") {
        link.crossOrigin = "anonymous";
      }
      document.head.appendChild(link);
      linkTags.push(link);
    };

    addLink("preconnect");
    addLink("dns-prefetch");

    return () => {
      linkTags.forEach((link) => link.remove());
    };
  }, []);

  useEffect(() => {
    const preloadRoutes = () => {
      const connection = (navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }).connection;

      if (connection?.saveData) {
        return;
      }

      if (connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g") {
        return;
      }

      const run = async () => {
        for (const loader of routePreloaders) {
          await loader().catch(() => undefined);
          await new Promise((resolve) => window.setTimeout(resolve, 140));
        }
      };

      void run();
    };

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;

    const hasIdleCb = typeof window !== "undefined" && "requestIdleCallback" in window;
    if (hasIdleCb) {
      idleId = (window as any).requestIdleCallback(preloadRoutes, { timeout: 2500 });
    } else {
      timeoutId = setTimeout(preloadRoutes, 1200);
    }

    return () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      if (idleId !== undefined && hasIdleCb) {
        (window as any).cancelIdleCallback(idleId);
      }
    };
  }, []);

  return null;
}

// ANALYTICS PLACEHOLDER
// Wire tracking scripts here once consent is granted.
// Use consent.analytics for GA4, consent.marketing for Meta/LinkedIn.

const App = () => (
  <CookieProvider>
    <CookieBanner />
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteAndNetworkWarmup />
          <ScrollToTop />
          <BackToTop />
          <ErrorBoundary>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={withRouteSuspense(<About />)} />
                <Route path="/about/our-story" element={withRouteSuspense(<OurStory />)} />
                <Route path="/about/factory" element={withRouteSuspense(<Factory />)} />
                <Route path="/about/certificates" element={withRouteSuspense(<Certificates />)} />
                <Route path="/about/sustainability" element={<Navigate to="/sustainability" replace />} />
                <Route path="/products" element={withRouteSuspense(<Products />)} />
                <Route path="/products/:slug" element={withRouteSuspense(<ProductDetail />)} />
                <Route path="/sustainability" element={withRouteSuspense(<Sustainability />)} />
                <Route path="/production" element={withRouteSuspense(<Production />)} />
                <Route path="/news" element={withRouteSuspense(<News />)} />
                <Route path="/news/:id" element={withRouteSuspense(<NewsDetail />)} />
                <Route path="/ecollections" element={withRouteSuspense(<Brochures />)} />
                <Route path="/ecollections/:slug" element={withRouteSuspense(<BrochureViewer />)} />
                <Route path="/designer-studio" element={withRouteSuspense(<DesignerStudio />)} />
                <Route path="/designer-studio/products/:slug" element={withRouteSuspense(<ProductDetail />)} />
                <Route path="/designer-studio/dashboard" element={withRouteSuspense(<DesignerStudioDashboard />)} />
                <Route path="/designer-studio/compose/:sessionId" element={withRouteSuspense(<ComposerPage />)} />
                <Route path="/designer-studio/present/:sessionId" element={withRouteSuspense(<PresentationPage />)} />
                <Route path="/contact" element={withRouteSuspense(<Contact />)} />
                <Route path="/privacy-policy" element={withRouteSuspense(<PrivacyPolicy />)} />
                <Route path="/terms-of-service" element={withRouteSuspense(<TermsOfService />)} />
                <Route path="/cookie-policy" element={withRouteSuspense(<CookiePolicy />)} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={withRouteSuspense(<NotFound />)} />
              </Route>
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </CookieProvider>
);

export default App;
