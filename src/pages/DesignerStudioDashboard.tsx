import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
import { Tabs as FilterTabs, TabsList as FilterTabsList, TabsTrigger as FilterTabsTrigger } from "@/components/ui/tabs";
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
  Star,
  BookOpen,
  X
} from "lucide-react";

// Library imports
import { mockLibraryItems, LibraryItem, categoryLabels } from "@/data/mockLibraryData";
import LibraryItemCard from "@/components/designer-studio/LibraryItemCard";
import LibraryTable from "@/components/designer-studio/LibraryTable";
import LibraryItemDetail from "@/components/designer-studio/LibraryItemDetail";
import ProductQuickView from "@/components/designer-studio/ProductQuickView";

// RFQ imports
import { mockRFQs, RFQ, statusLabels } from "@/data/mockRFQData";
import RFQList from "@/components/designer-studio/RFQList";
import RFQDetail from "@/components/designer-studio/RFQDetail";
import CreateRFQDialog from "@/components/designer-studio/CreateRFQDialog";
import BrochuresPanel from "@/components/designer-studio/BrochuresPanel";
import BrochureEditor from "@/components/designer-studio/BrochureEditor";
type VisibilityFilter = "all" | "public" | "private";
type CategoryFilter = "all" | LibraryItem["category"];
type SortField = "name" | "itemCode" | "category" | "createdAt";
type SortOrder = "asc" | "desc";

const DesignerStudioDashboard = () => {
  // Main tab state
  const [activeMainTab, setActiveMainTab] = useState<"library" | "rfq" | "brochures">("library");

  // Library states
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<LibraryItem | null>(null);
  const [quickViewItem, setQuickViewItem] = useState<LibraryItem | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [libraryViewMode, setLibraryViewMode] = useState<"grid" | "list">("grid");
  const [sortField, setSortField] = useState<SortField>("itemCode");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('library-favorites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Persist favorites to localStorage
  useEffect(() => {
    localStorage.setItem('library-favorites', JSON.stringify([...favorites]));
  }, [favorites]);

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // RFQ states
  const [rfqs, setRfqs] = useState<RFQ[]>(mockRFQs);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeRFQTab, setActiveRFQTab] = useState("all");
  const [rfqSearchQuery, setRfqSearchQuery] = useState("");

  // Brochure editor state: null = list, undefined = new, string = edit by id
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
        // Scrolling down
        setIsHeaderVisible(false);
      } else {
        // Scrolling up
        setIsHeaderVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Library filtering and sorting
  const filteredLibraryItems = useMemo(() => {
    const filtered = mockLibraryItems.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "public" && item.isPublic) ||
        (visibilityFilter === "private" && !item.isPublic);

      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      const matchesFavorites = !showFavoritesOnly || favorites.has(item.id);

      return matchesSearch && matchesVisibility && matchesCategory && matchesFavorites;
    });

    // Sort items
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name, 'zh-TW');
          break;
        case "itemCode":
          comparison = a.itemCode.localeCompare(b.itemCode);
          break;
        case "category":
          comparison = categoryLabels[a.category].localeCompare(categoryLabels[b.category], 'zh-TW');
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [searchQuery, visibilityFilter, categoryFilter, sortField, sortOrder, showFavoritesOnly, favorites]);

  // Count active filters
  const activeFilterCount = [
    visibilityFilter !== "all",
    categoryFilter !== "all",
    showFavoritesOnly
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setVisibilityFilter("all");
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

  // RFQ filtering
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

  // Library handlers
  const handleQuickView = (item: LibraryItem) => {
    setQuickViewItem(item);
    setIsQuickViewOpen(true);
  };

  const handleViewLibraryItem = (item: LibraryItem) => {
    setSelectedLibraryItem(item);
  };

  const handleBackFromLibraryDetail = () => {
    setSelectedLibraryItem(null);
  };

  // RFQ handlers
  const handleSelectRFQ = (rfq: RFQ) => {
    setSelectedRFQ(rfq);
  };

  const handleBackFromRFQDetail = () => {
    setSelectedRFQ(null);
  };

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
    setActiveMainTab("rfq"); // Switch to RFQ tab after creation
  };

  // Show Brochure editor
  if (editingBrochureId !== null) {
    return (
      <BrochureEditor
        brochureId={editingBrochureId}
        onBack={() => setEditingBrochureId(null)}
      />
    );
  }

  // Show Library item detail view
  if (selectedLibraryItem) {
    return (
      <LibraryItemDetail
        item={selectedLibraryItem}
        onBack={handleBackFromLibraryDetail}
      />
    );
  }

  // Show RFQ detail view
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
                  </TabsList>
                </Tabs>
            </div>
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
                  placeholder="搜尋..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>

              <div className="h-5 w-px bg-border flex-shrink-0" />

              <Button
                variant={showFavoritesOnly ? "default" : "ghost"}
                size="sm"
                className={`gap-1.5 h-8 flex-shrink-0`}
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                <span className="hidden lg:inline">收藏</span>
                ({favorites.size})
              </Button>

              <FilterTabs
                value={visibilityFilter}
                onValueChange={(v) => setVisibilityFilter(v as VisibilityFilter)}
                className="flex-shrink-0"
              >
                <FilterTabsList className="h-8">
                  <FilterTabsTrigger value="all" className="text-xs px-2.5 h-6">全部</FilterTabsTrigger>
                  <FilterTabsTrigger value="public" className="text-xs px-2.5 h-6">公開</FilterTabsTrigger>
                  <FilterTabsTrigger value="private" className="text-xs px-2.5 h-6">專屬</FilterTabsTrigger>
                </FilterTabsList>
              </FilterTabs>

              <Select
                value={categoryFilter}
                onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}
              >
                <SelectTrigger className="w-[120px] h-8 text-sm flex-shrink-0">
                  <SelectValue placeholder="類別" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部類別</SelectItem>
                  <SelectItem value="buttons">{categoryLabels.buttons}</SelectItem>
                  <SelectItem value="zippers">{categoryLabels.zippers}</SelectItem>
                  <SelectItem value="lace">{categoryLabels.lace}</SelectItem>
                  <SelectItem value="hardware">{categoryLabels.hardware}</SelectItem>
                  <SelectItem value="other">{categoryLabels.other}</SelectItem>
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
                  清除 ({activeFilterCount})
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
              {/* Active filters badges */}
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span className="text-xs text-muted-foreground">篩選:</span>
                  {showFavoritesOnly && (
                    <Badge variant="secondary" className="gap-1 text-xs py-0.5">
                      <Star className="w-3 h-3 fill-current" />
                      收藏
                      <button onClick={() => setShowFavoritesOnly(false)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {visibilityFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1 text-xs py-0.5">
                      {visibilityFilter === "public" ? "公開" : "專屬"}
                      <button onClick={() => setVisibilityFilter("all")} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {categoryFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1 text-xs py-0.5">
                      {categoryLabels[categoryFilter]}
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
                  {filteredLibraryItems.length} 個項目
                </p>
              </div>

              {/* Items Grid/Table */}
              {filteredLibraryItems.length > 0 ? (
                libraryViewMode === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-6">
                    {filteredLibraryItems.map((item) => (
                      <LibraryItemCard
                        key={item.id}
                        item={item}
                        onView={handleQuickView}
                        isFavorite={favorites.has(item.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                ) : (
                  <LibraryTable
                    items={filteredLibraryItems}
                    onView={handleViewLibraryItem}
                    onToggleFavorite={toggleFavorite}
                    favorites={favorites}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                )
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">沒有找到符合條件的項目</p>
                </div>
              )}
            </TabsContent>

            {/* RFQ Tab Content */}
            <TabsContent value="rfq" className="mt-0">
              {/* Compact Stats Row */}
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-4 mb-4">
                <StatCard 
                  label="待處理" 
                  value={statusCounts.submitted} 
                  icon={<FileText className="w-4 h-4" />}
                  color="text-amber-500"
                  compact
                />
                <StatCard 
                  label="模型上傳" 
                  value={statusCounts.model_uploaded} 
                  icon={<Upload className="w-4 h-4" />}
                  color="text-blue-500"
                  compact
                />
                <StatCard 
                  label="設計確認" 
                  value={statusCounts.design_confirmed} 
                  icon={<CheckCircle className="w-4 h-4" />}
                  color="text-green-500"
                  compact
                />
                <StatCard 
                  label="列印中" 
                  value={statusCounts.printing} 
                  icon={<Clock className="w-4 h-4" />}
                  color="text-purple-500"
                  compact
                />
                <StatCard 
                  label="樣品審核" 
                  value={statusCounts.sample_review} 
                  icon={<Eye className="w-4 h-4" />}
                  color="text-orange-500"
                  compact
                />
                <StatCard 
                  label="生產中" 
                  value={statusCounts.production} 
                  icon={<Package className="w-4 h-4" />}
                  color="text-emerald-500"
                  compact
                />
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

            {/* Brochures Tab Content */}
            <TabsContent value="brochures" className="mt-0">
              <BrochuresPanel />
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

      <Footer />
    </div>
  );
};

const StatCard = ({ 
  label, 
  value, 
  icon, 
  color,
  compact = false
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode;
  color: string;
  compact?: boolean;
}) => (
  compact ? (
    <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 flex-shrink-0 hover:shadow-sm transition-shadow">
      <div className={`${color}`}>{icon}</div>
      <span className="text-lg font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
    </div>
  ) : (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
);

export default DesignerStudioDashboard;
