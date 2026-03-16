import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CookieProvider } from "@/features/cookies/CookieProvider";
import CookieBanner from "@/features/cookies/CookieBanner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import BackToTop from "./components/ui/BackToTop";
import Index from "./pages/Index";
import About from "./pages/About";
import Products from "./pages/Products";
import Sustainability from "./pages/Sustainability";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import DesignerStudio from "./pages/DesignerStudio";
import DesignerStudioDashboard from "./pages/DesignerStudioDashboard";
import Brochures from "./pages/Brochures";
import BrochureViewer from "./pages/BrochureViewer";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import CookiePolicy from "./pages/CookiePolicy";
import OurStory from "./pages/about/OurStory";
import Factory from "./pages/about/Factory";
import Certificates from "./pages/about/Certificates";
import AboutSustainability from "./pages/about/Sustainability";

const queryClient = new QueryClient();


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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/about/our-story" element={<OurStory />} />
            <Route path="/about/factory" element={<Factory />} />
            <Route path="/about/certificates" element={<Certificates />} />
            <Route path="/about/sustainability" element={<AboutSustainability />} />
            <Route path="/products" element={<Products />} />
            <Route path="/sustainability" element={<Sustainability />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/brochures" element={<Brochures />} />
            <Route path="/brochures/:slug" element={<BrochureViewer />} />
            <Route path="/designer-studio" element={<DesignerStudio />} />
            <Route path="/designer-studio/dashboard" element={<DesignerStudioDashboard />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </CookieProvider>
);

export default App;