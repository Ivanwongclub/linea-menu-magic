import { useState, useMemo, useEffect } from "react";
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
  X
} from "lucide-react";

// Library imports
import { mockLibraryItems, LibraryItem, categoryLabels } from "@/data/mockLibraryData";
import LibraryItemCard from "@/components/designer-studio/LibraryItemCard";
import LibraryTable from "@/components/designer-studio/LibraryTable";
import LibraryItemDetail from "@/components/designer-studio/LibraryItemDetail";
import QuickRFQDialog from "@/components/designer-studio/QuickRFQDialog";
import ProductQuickView from "@/components/designer-studio/ProductQuickView";

// RFQ imports
import { mockRFQs, RFQ, statusLabels } from "@/data/mockRFQData";
import RFQList from "@/components/designer-studio/RFQList";
import RFQDetail from "@/components/designer-studio/RFQDetail";
import CreateRFQDialog from "@/components/designer-studio/CreateRFQDialog";

type VisibilityFilter = "all" | "public" | "private";
type CategoryFilter = "all" | LibraryItem["category"];
type SortField = "name" | "itemCode" | "category" | "createdAt";
type SortOrder = "asc" | "desc";

const DesignerStudioDashboard = () => {
  // Main tab state
  const [activeMainTab, setActiveMainTab] = useState<"library" | "rfq">("library");

  // Library states
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<LibraryItem | null>(null);
  const [quickRFQItem, setQuickRFQItem] = useState<LibraryItem | null>(null);
  const [isQuickRFQOpen, setIsQuickRFQOpen] = useState(false);
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

  const handleQuickRFQ = (item: LibraryItem) => {
    setQuickRFQItem(item);
    setIsQuickRFQOpen(true);
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

  // Show Library item detail view
  if (selectedLibraryItem) {
    return (
      <LibraryItemDetail
        item={selectedLibraryItem}
        onBack={handleBackFromLibraryDetail}
        onQuickRFQ={handleQuickRFQ}
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
      <Header />
      
      <main className="flex-1 py-8 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-serif text-3xl font-light text-foreground mb-2">
                設計師工作室
              </h1>
              <p className="text-muted-foreground">
                Designer Studio
              </p>
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="btn-red-glow"
            >
              <Plus className="w-4 h-4 mr-2" />
              新增報價請求
            </Button>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as "library" | "rfq")} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
              <TabsTrigger value="library" className="gap-2">
                <Library className="w-4 h-4" />
                素材庫
              </TabsTrigger>
              <TabsTrigger value="rfq" className="gap-2">
                <FileText className="w-4 h-4" />
                我的報價 ({statusCounts.all})
              </TabsTrigger>
            </TabsList>

            {/* Library Tab Content */}
            <TabsContent value="library" className="mt-0">
              {/* Library Filters */}
              <div className="bg-card border border-border rounded-lg p-4 mb-6">
                <div className="flex flex-col gap-4">
                  {/* First row: Search and main filters */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="搜尋品項代碼、名稱或描述..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Button
                      variant={showFavoritesOnly ? "default" : "outline"}
                      size="sm"
                      className={`gap-2 ${showFavoritesOnly ? 'btn-red-glow' : ''}`}
                      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    >
                      <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                      我的收藏 ({favorites.size})
                    </Button>

                    <FilterTabs
                      value={visibilityFilter}
                      onValueChange={(v) => setVisibilityFilter(v as VisibilityFilter)}
                    >
                      <FilterTabsList>
                        <FilterTabsTrigger value="all">全部</FilterTabsTrigger>
                        <FilterTabsTrigger value="public">公開</FilterTabsTrigger>
                        <FilterTabsTrigger value="private">團隊專屬</FilterTabsTrigger>
                      </FilterTabsList>
                    </FilterTabs>

                    <Select
                      value={categoryFilter}
                      onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="產品類別" />
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
                  </div>

                  {/* Active filters row */}
                  {activeFilterCount > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">已啟用篩選:</span>
                      {showFavoritesOnly && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          我的收藏
                          <button onClick={() => setShowFavoritesOnly(false)} className="ml-1 hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      )}
                      {visibilityFilter !== "all" && (
                        <Badge variant="secondary" className="gap-1">
                          {visibilityFilter === "public" ? "公開" : "團隊專屬"}
                          <button onClick={() => setVisibilityFilter("all")} className="ml-1 hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      )}
                      {categoryFilter !== "all" && (
                        <Badge variant="secondary" className="gap-1">
                          {categoryLabels[categoryFilter]}
                          <button onClick={() => setCategoryFilter("all")} className="ml-1 hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs h-6">
                        清除全部
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Results Count & View Toggle */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  顯示 {filteredLibraryItems.length} 個項目
                </p>
                <ToggleGroup 
                  type="single" 
                  value={libraryViewMode} 
                  onValueChange={(value) => value && setLibraryViewMode(value as "grid" | "list")}
                  className="bg-muted rounded-md p-1"
                >
                  <ToggleGroupItem value="grid" aria-label="Grid view" className="px-3">
                    <Grid3X3 className="w-4 h-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="List view" className="px-3">
                    <List className="w-4 h-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
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
                        onQuickRFQ={handleQuickRFQ}
                        isFavorite={favorites.has(item.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                ) : (
                  <LibraryTable
                    items={filteredLibraryItems}
                    onView={handleViewLibraryItem}
                    onQuickRFQ={handleQuickRFQ}
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
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                <StatCard 
                  label="待處理" 
                  value={statusCounts.submitted} 
                  icon={<FileText className="w-5 h-5" />}
                  color="text-amber-500"
                />
                <StatCard 
                  label="模型已上傳" 
                  value={statusCounts.model_uploaded} 
                  icon={<Upload className="w-5 h-5" />}
                  color="text-blue-500"
                />
                <StatCard 
                  label="設計確認" 
                  value={statusCounts.design_confirmed} 
                  icon={<CheckCircle className="w-5 h-5" />}
                  color="text-green-500"
                />
                <StatCard 
                  label="3D列印中" 
                  value={statusCounts.printing} 
                  icon={<Clock className="w-5 h-5" />}
                  color="text-purple-500"
                />
                <StatCard 
                  label="樣品審核" 
                  value={statusCounts.sample_review} 
                  icon={<Eye className="w-5 h-5" />}
                  color="text-orange-500"
                />
                <StatCard 
                  label="生產中" 
                  value={statusCounts.production} 
                  icon={<Package className="w-5 h-5" />}
                  color="text-emerald-500"
                />
              </div>

              {/* RFQ Search */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="搜尋 RFQ 編號或品項代碼..."
                    value={rfqSearchQuery}
                    onChange={(e) => setRfqSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
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
          </Tabs>
        </div>
      </main>

      <ProductQuickView
        item={quickViewItem}
        open={isQuickViewOpen}
        onOpenChange={setIsQuickViewOpen}
        onQuickRFQ={handleQuickRFQ}
      />

      <QuickRFQDialog
        open={isQuickRFQOpen}
        onOpenChange={setIsQuickRFQOpen}
        item={quickRFQItem}
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
  color 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className={`${color} mb-2`}>{icon}</div>
    <p className="text-2xl font-semibold text-foreground">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

export default DesignerStudioDashboard;
