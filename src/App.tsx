import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CookieProvider } from "@/features/cookies/CookieProvider";
import CookieBanner from "@/features/cookies/CookieBanner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import BackToTop from "./components/ui/BackToTop";
import Layout from "./components/layout/Layout";

// Homepage loaded eagerly — it's the landing route
import Index from "./pages/Index";

// All other routes lazy-loaded to reduce initial JS bundle
const About = lazy(() => import("./pages/About"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Sustainability = lazy(() => import("./pages/Sustainability"));
const News = lazy(() => import("./pages/News"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const DesignerStudio = lazy(() => import("./pages/DesignerStudio"));
const DesignerStudioDashboard = lazy(() => import("./pages/DesignerStudioDashboard"));
const ComposerPage = lazy(() => import("./features/designer/pages/ComposerPage"));
const PresentationPage = lazy(() => import("./features/designer/pages/PresentationPage"));
const Brochures = lazy(() => import("./pages/Brochures"));
const BrochureViewer = lazy(() => import("./pages/BrochureViewer"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const OurStory = lazy(() => import("./pages/about/OurStory"));
const Factory = lazy(() => import("./pages/about/Factory"));
const Certificates = lazy(() => import("./pages/about/Certificates"));
const Production = lazy(() => import("./pages/Production"));


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
          <ScrollToTop />
          <BackToTop />
          <ErrorBoundary>
            <Suspense fallback={null}>
              <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/about/our-story" element={<OurStory />} />
                <Route path="/about/factory" element={<Factory />} />
                <Route path="/about/certificates" element={<Certificates />} />
                <Route path="/about/sustainability" element={<Sustainability />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:slug" element={<ProductDetail />} />
                <Route path="/sustainability" element={<Sustainability />} />
                <Route path="/production" element={<Production />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:id" element={<NewsDetail />} />
                <Route path="/ecollections" element={<Brochures />} />
                <Route path="/ecollections/:slug" element={<BrochureViewer />} />
                <Route path="/designer-studio" element={<DesignerStudio />} />
                <Route path="/designer-studio/dashboard" element={<DesignerStudioDashboard />} />
                <Route path="/designer-studio/compose/:sessionId" element={<ComposerPage />} />
                <Route path="/designer-studio/present/:sessionId" element={<PresentationPage />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </CookieProvider>
);

export default App;