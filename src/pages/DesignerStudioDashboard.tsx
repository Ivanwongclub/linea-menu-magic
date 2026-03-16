import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
  Filter,
  Plus,
  Library,
  FileText,
  Clock,
  Upload,
  CheckCircle,
  Eye,
  Package,
  Grid3X3,
  List,
  Heart,
  BookOpen,
  X,
  ExternalLink,
} from "lucide-react";

// Library imports — Supabase-backed
import { useUserLibrary } from "@/features/products/hooks/useUserLibrary";
import { useProductTaxonomy } from "@/features/products/hooks/useProductTaxonomy";
import type { UserLibraryItem } from "@/features/products/types";
import type { SortField } from "@/components/designer-studio/LibraryTable";
import LibraryItemCard from "@/components/designer-studio/LibraryItemCard";
import LibraryTable from "@/components/designer-studio/LibraryTable";
import SearchProductDialog from "@/components/designer-studio/SearchProductDialog";

// Legacy components that still use old LibraryItem type
import { LibraryItem, categoryLabels } from "@/data/mockLibraryData";
import LibraryItemDetail from "@/components/designer-studio/LibraryItemDetail";
import ProductQuickView from "@/components/designer-studio/ProductQuickView";

// RFQ imports (untouched)
import { mockRFQs, RFQ, statusLabels } from "@/data/mockRFQData";
import RFQList from "@/components/designer-studio/RFQList";
import RFQDetail from "@/components/designer-studio/RFQDetail";
import CreateRFQDialog from "@/components/designer-studio/CreateRFQDialog";
import BrochuresPanel from "@/components/designer-studio/BrochuresPanel";
import BrochureEditor from "@/components/designer-studio/BrochureEditor";

// Products CMS
import ProductsPanel from "@/components/designer-studio/products/ProductsPanel";
import ProductEditor from "@/components/designer-studio/products/ProductEditor";

import { supabase } from "@/integrations/supabase/client";

// ─── Adapter: UserLibraryItem → legacy LibraryItem ──────
function toLegacyItem(item: UserLibraryItem): LibraryItem {
  const p = item.product;
  return {
    id: item.id,
    itemCode: p?.item_code ?? '',
    name: item.custom_name || p?.name || 'Untitled',
    nameEn: p?.name_en || p?.name || '',
    category: 'buttons' as LibraryItem['category'], // fallback
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

const DEMO_TEAM_ID = 'demo-team';

const DesignerStudioDashboard = () => {
  const navigate = useNavigate();

  // Auth-based team ID
  const [teamId, setTeamId] = useState(DEMO_TEAM_ID);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata;
      if (meta?.team_id) setTeamId(meta.team_id as string);
    });
  }, []);

  // Main tab state
  const [activeMainTab, setActiveMainTab] = useState<"library" | "rfq" | "brochures" | "products">("library");

  // Product editor state
  const [editingProductId, setEditingProductId] = useState<string | null | undefined>(null);

  // Library — Supabase data
  const { items: libraryItems, loading: libraryLoading, toggleFavourite, removeItem } = useUserLibrary(teamId);
  const taxonomy = useProductTaxonomy();

  // Library UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [libraryViewMode, setLibraryViewMode] = useState<"grid" | "list">("grid");
  const [sortField, setSortField] = useState<SortField>("addedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  // Legacy detail views (keep old types for compatibility)
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<LibraryItem | null>(null);
  const [quickViewItem, setQuickViewItem] = useState<LibraryItem | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // RFQ states (unchanged)
  const [rfqs, setRfqs] = useState<RFQ[]>(mockRFQs);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeRFQTab, setActiveRFQTab] = useState("all");
  const [rfqSearchQuery, setRfqSearchQuery] = useState("");

  // Brochure editor state
  const [editingBrochureId, setEditingBrochureId] = useState<string | null | undefined>(null);

  // Header auto-hide on scroll
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 50;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < scrollThreshold) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Library filtering & sorting
  const filteredLibraryItems = useMemo(() => {
    const filtered = libraryItems.filter((item) => {
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
  }, [libraryItems, searchQuery, categoryFilter, showFavoritesOnly, sortField, sortOrder]);

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

  // Library handlers
  const handleQuickView = (item: UserLibraryItem) => {
    setQuickViewItem(toLegacyItem(item));
    setIsQuickViewOpen(true);
  };

  const handleViewLibraryItem = (item: UserLibraryItem) => {
    setSelectedLibraryItem(toLegacyItem(item));
  };

  const handleBackFromLibraryDetail = () => {
    setSelectedLibraryItem(null);
  };

  // RFQ handlers (unchanged)
  const handleSelectRFQ = (rfq: RFQ) => setSelectedRFQ(rfq);
  const handleBackFromRFQDetail = () => setSelectedRFQ(null);

  const handleStatusChange = (rfqId: string, newStatus: RFQ['status']) => {
    setRfqs(prev => prev.map(rfq =>
      rfq.id === rfqId ? { ...rfq, status: newStatus, updatedAt: new Date().toISOString() } : rfq
    ));
    if (selectedRFQ?.id === rfqId) {
      setSelectedRFQ(prev => prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null);
    }
  };

  const handleCreateRFQ = (newRFQ: Omit<RFQ, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'comments' | 'files'>) => {
    const rfq: RFQ = {
      ...newRFQ,
      id: `RFQ-${String(rfqs.length + 1).padStart(4, '0')}`,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      files: [],
    };
    setRfqs(prev => [rfq, ...prev]);
    setIsCreateDialogOpen(false);
    setActiveMainTab("rfq");
  };

  // RFQ filtering (unchanged)
  const filteredRFQs = rfqs.filter(rfq => {
    const matchesSearch = rfq.itemCode.toLowerCase().includes(rfqSearchQuery.toLowerCase()) ||
      rfq.id.toLowerCase().includes(rfqSearchQuery.toLowerCase());
    const matchesTab = activeRFQTab === "all" || rfq.status === activeRFQTab;
    return matchesSearch && matchesTab;
  });

  const statusCounts = {
    all: rfqs.length,
    submitted: rfqs.filter(r => r.status === 'submitted').length,
    model_uploaded: rfqs.filter(r => r.status === 'model_uploaded').length,
    design_confirmed: rfqs.filter(r => r.status === 'design_confirmed').length,
    printing: rfqs.filter(r => r.status === 'printing').length,
    sample_review: rfqs.filter(r => r.status === 'sample_review').length,
    production: rfqs.filter(r => r.status === 'production').length,
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

  if (selectedLibraryItem) {
    return (
      <LibraryItemDetail
        item={selectedLibraryItem}
        onBack={handleBackFromLibraryDetail}
      />
    );
  }

  if (selectedRFQ) {
    return (
      <RFQDetail
        rfq={selectedRFQ}
        onBack={handleBackFromRFQDetail}
        onStatusChange={handleStatusChange}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Auto-hiding Header + Navigation wrapper */}
      <div
        className={`sticky top-0 z-50 transition-transform duration-300 [&>header]:static ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <Header />

        {/* Sticky Navigation Bar */}
        <div className="bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            {/* Compact Header Row */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-6">
                <h1 className="text-xl font-semibold text-foreground">
                  設計師工作室
                </h1>

                {/* Main Tabs - Inline */}
                <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as "library" | "rfq" | "brochures")} className="hidden sm:block">
                  <TabsList className="h-9">
                    <TabsTrigger value="library" className="gap-1.5 text-sm px-3 h-7">
                      <Library className="w-3.5 h-3.5" />
                      素材庫
                    </TabsTrigger>
                    <TabsTrigger value="rfq" className="gap-1.5 text-sm px-3 h-7">
                      <FileText className="w-3.5 h-3.5" />
                      我的報價 ({statusCounts.all})
                    </TabsTrigger>
                    <TabsTrigger value="brochures" className="gap-1.5 text-sm px-3 h-7">
                      <BookOpen className="w-3.5 h-3.5" />
                      Brochures
                    </TabsTrigger>
                    <TabsTrigger value="products" className="gap-1.5 text-sm px-3 h-7">
                      <Package className="w-3.5 h-3.5" />
                      Products
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Library header actions */}
              {activeMainTab === "library" && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8"
                    onClick={() => navigate('/products')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Browse Catalog</span>
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 h-8"
                    onClick={() => setIsSearchDialogOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add to Library</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Tabs */}
            <div className="sm:hidden pb-3">
              <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as "library" | "rfq" | "brochures")}>
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="library" className="gap-1.5 text-sm">
                    <Library className="w-3.5 h-3.5" />
                    素材庫
                  </TabsTrigger>
                  <TabsTrigger value="rfq" className="gap-1.5 text-sm">
                    <FileText className="w-3.5 h-3.5" />
                    報價 ({statusCounts.all})
                  </TabsTrigger>
                  <TabsTrigger value="brochures" className="gap-1.5 text-sm">
                    <BookOpen className="w-3.5 h-3.5" />
                    Brochures
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Library Filters - Compact inline */}
            {activeMainTab === "library" && (
              <div className="flex items-center gap-2 pb-3 overflow-x-auto scrollbar-hide">
                <div className="relative flex-shrink-0 w-48 lg:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
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
                  <span className="hidden lg:inline">Favourites</span>
                  ({favouriteCount})
                </Button>

                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-[140px] h-8 text-sm flex-shrink-0">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
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
                    Clear ({activeFilterCount})
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 py-4 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as "library" | "rfq" | "brochures")} className="w-full">
            {/* Library Tab Content */}
            <TabsContent value="library" className="mt-0">
              {/* Library header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">My Library</h2>
                  <p className="text-xs text-muted-foreground">
                    {libraryItems.length} products{libraryItems[0]?.team_name ? ` · ${libraryItems[0].team_name}` : ''}
                  </p>
                </div>
              </div>

              {/* Active filters badges */}
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span className="text-xs text-muted-foreground">Filters:</span>
                  {showFavoritesOnly && (
                    <Badge variant="secondary" className="gap-1 text-xs py-0.5">
                      <Heart className="w-3 h-3 fill-current" />
                      Favourites
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

              {/* Results Count */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-muted-foreground">
                  {filteredLibraryItems.length} items
                </p>
              </div>

              {/* Loading state */}
              {libraryLoading ? (
                <div className="text-center py-16">
                  <p className="text-sm text-muted-foreground">Loading library...</p>
                </div>
              ) : filteredLibraryItems.length > 0 ? (
                libraryViewMode === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-6">
                    {filteredLibraryItems.map((item) => (
                      <LibraryItemCard
                        key={item.id}
                        item={item}
                        onView={handleQuickView}
                        onToggleFavorite={toggleFavourite}
                      />
                    ))}
                  </div>
                ) : (
                  <LibraryTable
                    items={filteredLibraryItems}
                    onView={handleViewLibraryItem}
                    onToggleFavorite={toggleFavourite}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                )
              ) : (
                <div className="text-center py-16">
                  <Library className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1} />
                  <p className="text-muted-foreground mb-2">
                    {libraryItems.length === 0 ? 'Your library is empty' : 'No items match your filters'}
                  </p>
                  {libraryItems.length === 0 ? (
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" size="sm" onClick={() => navigate('/products')}>
                        Browse Catalog
                      </Button>
                      <Button size="sm" onClick={() => setIsSearchDialogOpen(true)}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Products
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>Clear filters</Button>
                  )}
                </div>
              )}
            </TabsContent>

            {/* RFQ Tab Content (unchanged) */}
            <TabsContent value="rfq" className="mt-0">
              {/* Compact Stats Row */}
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-4 mb-4">
                <StatCard label="待處理" value={statusCounts.submitted} icon={<FileText className="w-4 h-4" />} color="text-amber-500" compact />
                <StatCard label="模型上傳" value={statusCounts.model_uploaded} icon={<Upload className="w-4 h-4" />} color="text-blue-500" compact />
                <StatCard label="設計確認" value={statusCounts.design_confirmed} icon={<CheckCircle className="w-4 h-4" />} color="text-green-500" compact />
                <StatCard label="列印中" value={statusCounts.printing} icon={<Clock className="w-4 h-4" />} color="text-purple-500" compact />
                <StatCard label="樣品審核" value={statusCounts.sample_review} icon={<Eye className="w-4 h-4" />} color="text-orange-500" compact />
                <StatCard label="生產中" value={statusCounts.production} icon={<Package className="w-4 h-4" />} color="text-emerald-500" compact />
              </div>

              {/* RFQ Search & Filters */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="搜尋 RFQ..."
                    value={rfqSearchQuery}
                    onChange={(e) => setRfqSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 h-8">
                  <Filter className="w-3.5 h-3.5" />
                  篩選
                </Button>
              </div>

              {/* RFQ Status Tabs */}
              <Tabs value={activeRFQTab} onValueChange={setActiveRFQTab} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="all">全部 ({statusCounts.all})</TabsTrigger>
                  <TabsTrigger value="submitted">待處理</TabsTrigger>
                  <TabsTrigger value="model_uploaded">模型已上傳</TabsTrigger>
                  <TabsTrigger value="design_confirmed">設計確認</TabsTrigger>
                  <TabsTrigger value="printing">列印中</TabsTrigger>
                  <TabsTrigger value="sample_review">樣品審核</TabsTrigger>
                  <TabsTrigger value="production">生產中</TabsTrigger>
                </TabsList>

                <TabsContent value={activeRFQTab} className="mt-6">
                  <RFQList rfqs={filteredRFQs} onSelect={handleSelectRFQ} />
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Brochures Tab Content (unchanged) */}
            <TabsContent value="brochures" className="mt-0">
              <BrochuresPanel onOpenEditor={(id) => setEditingBrochureId(id ?? undefined)} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <ProductQuickView
        item={quickViewItem}
        open={isQuickViewOpen}
        onOpenChange={setIsQuickViewOpen}
      />

      <CreateRFQDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateRFQ}
      />

      <SearchProductDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        teamId={teamId}
        existingProductIds={existingProductIds}
        onAdded={() => {
          // The useUserLibrary hook will re-fetch on next render
          // Force a re-mount by toggling the dialog
          setIsSearchDialogOpen(false);
          setTimeout(() => setIsSearchDialogOpen(true), 100);
        }}
      />

      <Footer />
    </div>
  );
};

const StatCard = ({
  label,
  value,
  icon,
  color,
  compact = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  compact?: boolean;
}) => (
  compact ? (
    <div className="flex items-center gap-2 bg-card border border-border rounded-[var(--radius)] px-3 py-2 flex-shrink-0 hover:shadow-sm transition-shadow">
      <div className={`${color}`}>{icon}</div>
      <span className="text-lg font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
    </div>
  ) : (
    <div className="bg-card border border-border rounded-[var(--radius)] p-4 hover:shadow-md transition-shadow">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
);

export default DesignerStudioDashboard;
