import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Search,
  Plus,
  Library,
  Package,
  Grid3X3,
  List,
  BookOpen,
  X,
  ArrowRight,
} from "lucide-react";

// Library imports — Supabase-backed
import { useUserLibrary } from "@/features/products/hooks/useUserLibrary";
import { useProductTaxonomy } from "@/features/products/hooks/useProductTaxonomy";
import { useProducts } from "@/features/products/hooks/useProducts";
import type { UserLibraryItem, Product } from "@/features/products/types";
import type { SortField } from "@/components/designer-studio/LibraryTable";
import LibraryItemCard from "@/components/designer-studio/LibraryItemCard";
import LibraryTable from "@/components/designer-studio/LibraryTable";
import SearchProductDialog from "@/components/designer-studio/SearchProductDialog";

// Legacy LibraryItem still used by ProductQuickView (retired with adapter in Phase E)
import { LibraryItem } from "@/data/mockLibraryData";
import ProductQuickView from "@/components/designer-studio/ProductQuickView";

// RFQ tab quarantined in P14 — see reports/P14. Workspace lead capture flows through
// /contact?product=…&source=workspace; the mock RFQ surface is hidden until a real
// data layer ships in a Phase B-future build.
import BrochuresPanel from "@/components/designer-studio/BrochuresPanel";
import BrochureEditor from "@/components/designer-studio/BrochureEditor";

import { toast } from "sonner";
// Products CMS
import ProductsPanel from "@/components/designer-studio/products/ProductsPanel";
import ProductEditor from "@/components/designer-studio/products/ProductEditor";

// Composer
import ComposerSessionList from "@/features/designer/components/ComposerSessionList";
import TemplatePickerDialog from "@/features/designer/components/TemplatePickerDialog";
import type { SessionTemplate } from "@/features/designer/components/TemplatePickerDialog";
import { useDesignSessions } from "@/features/designer/hooks/useDesignSessions";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/AuthProvider";
import { useI18n } from "@/features/i18n/I18nProvider";

// ─── Adapter: UserLibraryItem → legacy LibraryItem ──────
function toLegacyItem(item: UserLibraryItem): LibraryItem {
  const p = item.product;
  return {
    id: item.id,
    itemCode: p?.item_code ?? '',
    slug: p?.slug,
    name: item.custom_name || p?.name || 'Untitled',
    nameEn: p?.name_en || p?.name || '',
    category: 'buttons' as LibraryItem['category'],
    description: p?.description_en || p?.description || '',
    specifications: (p?.specifications as Record<string, string>) ?? {},
    pricing: { unitPrice: 0, currency: 'USD', moq: 0 },
    production: {
      leadTime: (p?.production as Record<string, string>)?.leadTime ?? '',
      sampleTime: (p?.production as Record<string, string>)?.sampleTime ?? '',
      origin: (p?.production as Record<string, string>)?.origin ?? '',
      capacity: (p?.production as Record<string, string>)?.capacity ?? '',
    },
    certifications: p?.certifications?.map(c => c.name) ?? [],
    availableColors: [],
    applications: p?.industries?.map(i => i.name) ?? [],
    isPublic: p?.is_public ?? true,
    teamId: item.team_id,
    teamName: item.team_name ?? undefined,
    modelUrl: p?.model_url ?? undefined,
    thumbnailUrl: p?.thumbnail_url ?? undefined,
    createdAt: item.added_at,
    updatedAt: item.added_at,
  };
}

type SortOrder = "asc" | "desc";

// rfq tab quarantined (P14)
const validTabs = ['library', 'brochures', 'products', 'composer'] as const;
type TabId = typeof validTabs[number];

const DesignerStudioWorkspace = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useI18n();

  // Brand-scoped team ID from auth context (RequireBrandAuth guarantees primaryBrand exists)
  const { primaryBrand } = useAuth();
  const teamId = primaryBrand?.id ?? '';
  const brandCatalogueName = primaryBrand?.name ?? t("workspace.library.brandCatalogue");

  // Main tab state — read from URL ?tab= param
  const tabFromUrl = searchParams.get('tab');
  // tab=rfq came from pre-P14 links — redirect cleanly to library (P14 T1)
  const initialTab: TabId = validTabs.includes(tabFromUrl as TabId) ? tabFromUrl as TabId : 'library';
  const [activeMainTab, setActiveMainTab] = useState<TabId>(initialTab);

  // Keep state in sync when URL tab changes (back/forward/manual edits)
  useEffect(() => {
    if (validTabs.includes(tabFromUrl as TabId) && tabFromUrl !== activeMainTab) {
      setActiveMainTab(tabFromUrl as TabId);
    }
  }, [tabFromUrl, activeMainTab]);

  // Keep URL in sync when tab changes from in-page controls
  useEffect(() => {
    if (tabFromUrl === activeMainTab) return;
    const params = new URLSearchParams(searchParams);
    params.set('tab', activeMainTab);
    navigate(`/designer-studio/workspace?${params.toString()}`, { replace: true });
  }, [activeMainTab, tabFromUrl, searchParams, navigate]);

  // Product editor state
  const [editingProductId, setEditingProductId] = useState<string | null | undefined>(null);

  // Library — Supabase data
  const { items: libraryItems, loading: libraryLoading } = useUserLibrary(teamId);
  const taxonomy = useProductTaxonomy();

  // Composer sessions — `createSession` is the only consumer here; the grid renders via ComposerSessionList
  const { createSession } = useDesignSessions(teamId);

  // Library UI states
  const [librarySource, setLibrarySource] = useState<'all' | 'my'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [libraryViewMode, setLibraryViewMode] = useState<"grid" | "list">("grid");
  const [sortField, setSortField] = useState<SortField>("addedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  // Full catalog data
  const { products: catalogProducts, loading: catalogLoading } = useProducts({ visibility: 'brand' });

  // Quick-view modal (single detail surface — P13 W13)
  const [quickViewItem, setQuickViewItem] = useState<LibraryItem | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Brochure editor state
  const [editingBrochureId, setEditingBrochureId] = useState<string | null | undefined>(null);

  // Template picker (P13 W11 — single composition-create behaviour)
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  // Convert catalog Product → UserLibraryItem shape for card rendering
  const catalogAsLibraryItems: UserLibraryItem[] = useMemo(() => {
    return catalogProducts.map((p): UserLibraryItem => ({
      id: `catalog-${p.id}`,
      product_id: p.id,
      team_id: teamId,
      is_favourite: false,
      is_admin_default: false,
      downloadable_files: [],
      added_at: p.created_at,
      section: 'All Products',
      product: p,
    }));
  }, [catalogProducts, teamId]);

  // Merge favourite state from actual library items onto catalog items
  const mergedCatalogItems: UserLibraryItem[] = useMemo(() => {
    const favSet = new Set(libraryItems.filter(i => i.is_favourite).map(i => i.product_id));
    return catalogAsLibraryItems.map(item => ({
      ...item,
      is_favourite: favSet.has(item.product_id),
    }));
  }, [catalogAsLibraryItems, libraryItems]);

  // Choose source
  const sourceItems = librarySource === 'all' ? mergedCatalogItems : libraryItems;

  // Library filtering & sorting
  const filteredLibraryItems = useMemo(() => {
    const filtered = sourceItems.filter((item) => {
      const p = item.product;
      const name = item.custom_name || p?.name_en || p?.name || '';
      const code = p?.item_code || '';

      const matchesSearch =
        !searchQuery ||
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' ||
        p?.categories?.some(c => c.slug === categoryFilter) ||
        p?.primary_category?.slug === categoryFilter;

      const matchesFavorites = !showFavoritesOnly || item.is_favourite;

      return matchesSearch && matchesCategory && matchesFavorites;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      const pa = a.product;
      const pb = b.product;
      switch (sortField) {
        case 'name':
          comparison = (a.custom_name || pa?.name || '').localeCompare(b.custom_name || pb?.name || '');
          break;
        case 'itemCode':
          comparison = (pa?.item_code || '').localeCompare(pb?.item_code || '');
          break;
        case 'category':
          comparison = (pa?.primary_category?.name || '').localeCompare(pb?.primary_category?.name || '');
          break;
        case 'addedAt':
          comparison = new Date(a.added_at).getTime() - new Date(b.added_at).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [sourceItems, searchQuery, categoryFilter, showFavoritesOnly, sortField, sortOrder]);

  const favouriteCount = useMemo(() => libraryItems.filter(i => i.is_favourite).length, [libraryItems]);

  const activeFilterCount = [
    categoryFilter !== "all",
    showFavoritesOnly,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setCategoryFilter("all");
    setShowFavoritesOnly(false);
    setSearchQuery("");
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const existingProductIds = useMemo(
    () => new Set(libraryItems.map(i => i.product_id)),
    [libraryItems],
  );

  // Library handlers — single detail surface (P13 W13)
  const handleQuickView = (item: UserLibraryItem) => {
    setQuickViewItem(toLegacyItem(item));
    setIsQuickViewOpen(true);
  };

  // Composer handler — template picker is the single composition-create entry (P13 W11)
  const handleCreateFromTemplate = async (template: SessionTemplate) => {
    setTemplatePickerOpen(false);
    try {
      const name = template.id === 'blank' ? 'Untitled Composition' : template.name;
      const session = await createSession(name);
      if (template.layers.length > 0) {
        const layerInserts = template.layers.map((l) => ({
          ...l,
          session_id: session.id,
        }));
        await supabase.from('design_layers').insert(layerInserts);
      }
      navigate(`/designer-studio/compose/${session.id}`);
    } catch {
      toast.error('Failed to create composition');
    }
  };

  // ─── Early returns for detail views ─────────────────────

  if (editingProductId !== null) {
    return (
      <ProductEditor
        productId={editingProductId}
        onBack={() => setEditingProductId(null)}
      />
    );
  }

  if (editingBrochureId !== null) {
    return (
      <BrochureEditor
        brochureId={editingBrochureId}
        onBack={() => setEditingBrochureId(null)}
      />
    );
  }

  // Whether library or management is expanded
  const showingSessions = activeMainTab !== 'library' && activeMainTab !== 'brochures' && activeMainTab !== 'products';

  return (
    <div className="min-h-screen flex flex-col bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">

          {/* Page title + primary CTA */}
          <div className="py-6 pb-2 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                {t("workspace.title")}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t("workspace.title.subtitle")}
              </p>
            </div>
            <Button size="sm" className="gap-2" onClick={() => setTemplatePickerOpen(true)}>
              <Plus className="w-4 h-4" />
              {t("workspace.title.newComposition")}
            </Button>
          </div>

          {/* ═══════════ PRIMARY: SESSIONS / COMPOSITIONS ═══════════ */}
          {showingSessions && (
            <div className="mt-6 mb-8">
              <ComposerSessionList teamId={teamId} />
            </div>
          )}

          {/* ═══════════ SECONDARY: Quick-access strip ═══════════ */}
          {showingSessions && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {/* Component Library card */}
              <div
                onClick={() => setActiveMainTab('library')}
                className="flex items-center gap-4 p-4 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-[calc(var(--radius)*2)] cursor-pointer group transition-all duration-200 hover:border-[hsl(var(--foreground))] hover:shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
              >
                <div className="w-10 h-10 rounded-[var(--radius)] bg-[hsl(var(--secondary))] flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(var(--foreground))] group-hover:text-[hsl(var(--background))] transition-colors">
                  <Library className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{t("workspace.library.title")}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {t("workspace.library.cardSummary", { count: libraryItems.length })}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
              </div>

              {/* Brochures + Products card */}
              <div
                onClick={() => setActiveMainTab('brochures')}
                className="flex items-center gap-4 p-4 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-[calc(var(--radius)*2)] cursor-pointer group transition-all duration-200 hover:border-[hsl(var(--foreground))] hover:shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
              >
                <div className="w-10 h-10 rounded-[var(--radius)] bg-[hsl(var(--secondary))] flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(var(--foreground))] group-hover:text-[hsl(var(--background))] transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">E-Catalogue & Content</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Manage catalogues & product data
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
              </div>
            </div>
          )}

          {/* ═══════════ EXPANDED: LIBRARY ═══════════ */}
          {activeMainTab === 'library' && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveMainTab('composer')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← All Compositions
                  </button>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{t("workspace.library.title")}</h2>
                    <p className="text-xs text-muted-foreground">
                      {t("workspace.library.summary", { count: filteredLibraryItems.length, brand: brandCatalogueName })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gap-1.5 h-8" onClick={() => setIsSearchDialogOpen(true)}>
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t("workspace.library.addComponent")}</span>
                  </Button>
                </div>
              </div>

              {/* All Products / My Library toggle */}
              <div className="flex items-center gap-1 mb-4 bg-[hsl(var(--muted))] rounded-[var(--radius)] p-0.5 w-fit">
                <button
                  onClick={() => setLibrarySource('all')}
                  className={`px-3 py-1.5 text-xs font-medium uppercase tracking-[0.06em] rounded-[calc(var(--radius)-2px)] transition-colors ${
                    librarySource === 'all'
                      ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  {t("workspace.library.brandCatalogue")} ({catalogProducts.length})
                </button>
                <button
                  onClick={() => setLibrarySource('my')}
                  className={`px-3 py-1.5 text-xs font-medium uppercase tracking-[0.06em] rounded-[calc(var(--radius)-2px)] transition-colors ${
                    librarySource === 'my'
                      ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  {t("workspace.library.savedLibrary")} ({libraryItems.length})
                </button>
              </div>

              {/* Library Filters */}
              <div className="flex items-center gap-2 pb-3 overflow-x-auto scrollbar-hide">
                <div className="relative flex-shrink-0 w-48 lg:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t("workspace.library.search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>

                <div className="h-5 w-px bg-border flex-shrink-0" />

                <Button
                  variant={showFavoritesOnly ? "default" : "ghost"}
                  size="sm"
                  className="gap-1.5 h-8 flex-shrink-0"
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                >
                  <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                  <span className="hidden lg:inline">{t("workspace.library.favourites")}</span>
                  ({favouriteCount})
                </Button>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-sm flex-shrink-0">
                    <SelectValue placeholder={t("workspace.library.category")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("workspace.library.allCategories")}</SelectItem>
                    {taxonomy.categories.map(c => (
                      <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="h-5 w-px bg-border flex-shrink-0" />

                <ToggleGroup
                  type="single"
                  value={libraryViewMode}
                  onValueChange={(value) => value && setLibraryViewMode(value as "grid" | "list")}
                  className="bg-muted rounded-md p-0.5 flex-shrink-0"
                >
                  <ToggleGroupItem value="grid" aria-label="Grid view" className="px-2 h-7">
                    <Grid3X3 className="w-3.5 h-3.5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="List view" className="px-2 h-7">
                    <List className="w-3.5 h-3.5" />
                  </ToggleGroupItem>
                </ToggleGroup>

                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs h-7 px-2 flex-shrink-0 text-muted-foreground hover:text-foreground">
                    <X className="w-3 h-3 mr-1" />
                    {t("workspace.library.clear")} ({activeFilterCount})
                  </Button>
                )}
              </div>

              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span className="text-xs text-muted-foreground">{t("workspace.library.filters")}:</span>
                  {showFavoritesOnly && (
                    <Badge variant="secondary" className="gap-1 text-xs py-0.5">
                      <Heart className="w-3 h-3 fill-current" />
                      {t("workspace.library.favourites")}
                      <button onClick={() => setShowFavoritesOnly(false)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {categoryFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1 text-xs py-0.5">
                      {taxonomy.categories.find(c => c.slug === categoryFilter)?.name ?? categoryFilter}
                      <button onClick={() => setCategoryFilter("all")} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-muted-foreground">
                  {t("workspace.library.items", { count: filteredLibraryItems.length })}
                </p>
              </div>

              {(libraryLoading || catalogLoading) ? (
                <div className="text-center py-16">
                  <p className="text-sm text-muted-foreground">{t("workspace.library.loading")}</p>
                </div>
              ) : filteredLibraryItems.length > 0 ? (
                libraryViewMode === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                    {filteredLibraryItems.map((item) => (
                      <LibraryItemCard
                        key={item.id}
                        item={item}
                        onView={handleQuickView}
                      />
                    ))}
                  </div>
                ) : (
                  <LibraryTable
                    items={filteredLibraryItems}
                    onView={handleQuickView}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                )
              ) : (
                <div className="text-center py-16">
                  <Library className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1} />
                  <p className="text-muted-foreground mb-2">
                    {libraryItems.length === 0 ? t("workspace.library.empty") : t("workspace.library.noMatch")}
                  </p>
                  {libraryItems.length === 0 ? (
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" onClick={() => setIsSearchDialogOpen(true)}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        {t("workspace.library.addComponents")}
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>{t("workspace.library.clearFilters")}</Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══════════ EXPANDED: MANAGEMENT SECTIONS ═══════════ */}
          {(activeMainTab === 'brochures' || activeMainTab === 'products') && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setActiveMainTab('composer')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← All Compositions
                </button>
              </div>

              <Tabs
                value={activeMainTab}
                onValueChange={(v) => setActiveMainTab(v as TabId)}
                className="w-full"
              >
                <TabsList className="h-auto p-0 bg-transparent border-b border-border w-full rounded-none gap-0 justify-start">
                  <TabsTrigger
                    value="brochures"
                    className="flex items-center gap-2 px-4 py-3 text-xs font-medium uppercase tracking-[0.08em] rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground bg-transparent hover:text-foreground transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    E-Catalogue
                  </TabsTrigger>
                  <TabsTrigger
                    value="products"
                    className="flex items-center gap-2 px-4 py-3 text-xs font-medium uppercase tracking-[0.08em] rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground bg-transparent hover:text-foreground transition-colors"
                  >
                    <Package className="w-3.5 h-3.5" />
                    Products
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="brochures" className="mt-6">
                  <BrochuresPanel onOpenEditor={(id) => setEditingBrochureId(id ?? undefined)} />
                </TabsContent>

                <TabsContent value="products" className="mt-6">
                  <ProductsPanel onOpenEditor={(id) => setEditingProductId(id ?? undefined)} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      <ProductQuickView
        item={quickViewItem}
        open={isQuickViewOpen}
        onOpenChange={setIsQuickViewOpen}
      />

      <TemplatePickerDialog
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onSelect={handleCreateFromTemplate}
      />

      <SearchProductDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        teamId={teamId}
        existingProductIds={existingProductIds}
        onAdded={() => {
          setIsSearchDialogOpen(false);
          setTimeout(() => setIsSearchDialogOpen(true), 100);
        }}
      />
    </div>
  );
};


export default DesignerStudioWorkspace;
