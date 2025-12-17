import { useState, useMemo } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Grid3X3, List, FileText } from "lucide-react";
import { mockLibraryItems, LibraryItem, categoryLabels } from "@/data/mockLibraryData";
import LibraryItemCard from "@/components/designer-studio/LibraryItemCard";
import LibraryItemDetail from "@/components/designer-studio/LibraryItemDetail";
import QuickRFQDialog from "@/components/designer-studio/QuickRFQDialog";
import { Link } from "react-router-dom";

type VisibilityFilter = "all" | "public" | "private";
type CategoryFilter = "all" | LibraryItem["category"];

const DesignerStudioLibrary = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [quickRFQItem, setQuickRFQItem] = useState<LibraryItem | null>(null);
  const [isQuickRFQOpen, setIsQuickRFQOpen] = useState(false);

  const filteredItems = useMemo(() => {
    return mockLibraryItems.filter((item) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Visibility filter
      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "public" && item.isPublic) ||
        (visibilityFilter === "private" && !item.isPublic);

      // Category filter
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      return matchesSearch && matchesVisibility && matchesCategory;
    });
  }, [searchQuery, visibilityFilter, categoryFilter]);

  const handleViewItem = (item: LibraryItem) => {
    setSelectedItem(item);
  };

  const handleQuickRFQ = (item: LibraryItem) => {
    setQuickRFQItem(item);
    setIsQuickRFQOpen(true);
  };

  const handleBackFromDetail = () => {
    setSelectedItem(null);
  };

  // Show detail view if an item is selected
  if (selectedItem) {
    return (
      <LibraryItemDetail
        item={selectedItem}
        onBack={handleBackFromDetail}
        onQuickRFQ={handleQuickRFQ}
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
                素材庫
              </h1>
              <p className="text-muted-foreground">
                瀏覽產品素材，下載 3D 模型，快速建立報價請求
              </p>
            </div>
            <Link to="/designer-studio/prototype">
              <Button variant="outline" className="gap-2">
                <FileText className="w-4 h-4" />
                我的報價請求
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋品項代碼、名稱或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Visibility Filter */}
              <Tabs
                value={visibilityFilter}
                onValueChange={(v) => setVisibilityFilter(v as VisibilityFilter)}
              >
                <TabsList>
                  <TabsTrigger value="all">全部</TabsTrigger>
                  <TabsTrigger value="public">公開</TabsTrigger>
                  <TabsTrigger value="private">團隊專屬</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Category Filter */}
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

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              顯示 {filteredItems.length} 個項目
            </p>
          </div>

          {/* Items Grid */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <LibraryItemCard
                  key={item.id}
                  item={item}
                  onView={handleViewItem}
                  onQuickRFQ={handleQuickRFQ}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">沒有找到符合條件的項目</p>
            </div>
          )}
        </div>
      </main>

      <QuickRFQDialog
        open={isQuickRFQOpen}
        onOpenChange={setIsQuickRFQOpen}
        item={quickRFQItem}
      />

      <Footer />
    </div>
  );
};

export default DesignerStudioLibrary;
