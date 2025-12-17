import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  Package,
  MessageSquare,
  Eye,
  Upload,
  Filter,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import RFQList from "@/components/designer-studio/RFQList";
import RFQDetail from "@/components/designer-studio/RFQDetail";
import CreateRFQDialog from "@/components/designer-studio/CreateRFQDialog";
import { mockRFQs, RFQ } from "@/data/mockRFQData";

const DesignerStudioPrototype = () => {
  const [rfqs, setRfqs] = useState<RFQ[]>(mockRFQs);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectRFQ = (rfq: RFQ) => {
    setSelectedRFQ(rfq);
  };

  const handleBack = () => {
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
  };

  const filteredRFQs = rfqs.filter(rfq => {
    const matchesSearch = rfq.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || rfq.status === activeTab;
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

  if (selectedRFQ) {
    return (
      <RFQDetail 
        rfq={selectedRFQ} 
        onBack={handleBack} 
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
                Designer Studio - RFQ Management
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

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="搜尋 RFQ 編號或品項代碼..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              篩選
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">全部 ({statusCounts.all})</TabsTrigger>
              <TabsTrigger value="submitted">待處理</TabsTrigger>
              <TabsTrigger value="model_uploaded">模型已上傳</TabsTrigger>
              <TabsTrigger value="design_confirmed">設計確認</TabsTrigger>
              <TabsTrigger value="printing">列印中</TabsTrigger>
              <TabsTrigger value="sample_review">樣品審核</TabsTrigger>
              <TabsTrigger value="production">生產中</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <RFQList rfqs={filteredRFQs} onSelect={handleSelectRFQ} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

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

export default DesignerStudioPrototype;
