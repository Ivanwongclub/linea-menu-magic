import { useState, useMemo } from "react";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";

// Library imports
import { mockLibraryItems, LibraryItem, categoryLabels } from "@/data/mockLibraryData";
import LibraryItemCard from "@/components/designer-studio/LibraryItemCard";
import LibraryItemListRow from "@/components/designer-studio/LibraryItemListRow";
import LibraryItemDetail from "@/components/designer-studio/LibraryItemDetail";
import QuickRFQDialog from "@/components/designer-studio/QuickRFQDialog";

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
  const [libraryViewMode, setLibraryViewMode] = useState<"grid" | "list">("grid");
  const [sortField, setSortField] = useState<SortField>("itemCode");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

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

      return matchesSearch && matchesVisibility && matchesCategory;
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
  }, [searchQuery, visibilityFilter, categoryFilter, sortField, sortOrder]);

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

              {/* Items Grid/List */}
              {filteredLibraryItems.length > 0 ? (
                libraryViewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredLibraryItems.map((item) => (
                      <LibraryItemCard
                        key={item.id}
                        item={item}
                        onView={handleViewLibraryItem}
                        onQuickRFQ={handleQuickRFQ}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Sortable Header */}
                    <div className="flex items-center gap-4 px-4 py-2 bg-muted/50 border border-border rounded-lg text-sm font-medium text-muted-foreground">
                      <div className="w-16 flex-shrink-0">圖片</div>
                      <button 
                        onClick={() => handleSort("itemCode")}
                        className="w-28 flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        品項代碼
                        <SortIcon field="itemCode" currentField={sortField} order={sortOrder} />
                      </button>
                      <button 
                        onClick={() => handleSort("name")}
                        className="flex-1 flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        名稱
                        <SortIcon field="name" currentField={sortField} order={sortOrder} />
                      </button>
                      <button 
                        onClick={() => handleSort("category")}
                        className="w-24 flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        類別
                        <SortIcon field="category" currentField={sortField} order={sortOrder} />
                      </button>
                      <button 
                        onClick={() => handleSort("createdAt")}
                        className="w-24 flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        建立日期
                        <SortIcon field="createdAt" currentField={sortField} order={sortOrder} />
                      </button>
                      <div className="w-48 flex-shrink-0 text-right">操作</div>
                    </div>
                    {/* List Items */}
                    {filteredLibraryItems.map((item) => (
                      <LibraryItemListRow
                        key={item.id}
                        item={item}
                        onView={handleViewLibraryItem}
                        onQuickRFQ={handleQuickRFQ}
                      />
                    ))}
                  </div>
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

const SortIcon = ({ 
  field, 
  currentField, 
  order 
}: { 
  field: SortField; 
  currentField: SortField; 
  order: SortOrder;
}) => {
  if (field !== currentField) {
    return <ArrowUpDown className="w-3 h-3 opacity-50" />;
  }
  return order === "asc" 
    ? <ArrowUp className="w-3 h-3" /> 
    : <ArrowDown className="w-3 h-3" />;
};

export default DesignerStudioDashboard;
