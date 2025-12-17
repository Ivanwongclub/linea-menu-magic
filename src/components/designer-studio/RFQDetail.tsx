import { useState } from "react";
import { RFQ, RFQStatus, statusLabels, statusColors, Comment } from "@/data/mockRFQData";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { 
  ArrowLeft,
  Calendar, 
  Package, 
  DollarSign,
  FileText,
  MessageSquare,
  Upload,
  CheckCircle,
  XCircle,
  Truck,
  RotateCcw,
  Box,
  Send,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import Model3DViewer from "./Model3DViewer";
import WorkflowTimeline from "./WorkflowTimeline";

interface RFQDetailProps {
  rfq: RFQ;
  onBack: () => void;
  onStatusChange: (rfqId: string, newStatus: RFQStatus) => void;
}

const RFQDetail = ({ rfq, onBack, onStatusChange }: RFQDetailProps) => {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>(rfq.comments);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: `c${Date.now()}`,
      userId: 'current-user',
      userName: '您',
      userRole: 'user',
      content: newComment,
      createdAt: new Date().toISOString(),
    };
    
    setComments(prev => [...prev, comment]);
    setNewComment("");
  };

  const getNextActions = (): { label: string; status: RFQStatus; icon: React.ReactNode; variant?: 'default' | 'outline' | 'destructive' }[] => {
    switch (rfq.status) {
      case 'submitted':
        return []; // User waits for manufacturer
      case 'model_uploaded':
        return [
          { label: '確認設計', status: 'design_confirmed', icon: <CheckCircle className="w-4 h-4" /> },
          { label: '要求修改', status: 'submitted', icon: <RotateCcw className="w-4 h-4" />, variant: 'outline' },
        ];
      case 'design_confirmed':
        return []; // System auto-transitions to ready_for_printing
      case 'ready_for_printing':
        return []; // Manufacturer handles
      case 'printing':
        return []; // Manufacturer handles
      case 'shipped':
        return []; // Wait for delivery
      case 'sample_review':
        return [
          { label: '確認生產', status: 'production', icon: <Box className="w-4 h-4" /> },
          { label: '要求修改', status: 'submitted', icon: <RotateCcw className="w-4 h-4" />, variant: 'outline' },
          { label: '結案', status: 'closed', icon: <XCircle className="w-4 h-4" />, variant: 'destructive' },
        ];
      case 'production':
        return [
          { label: '結案', status: 'closed', icon: <CheckCircle className="w-4 h-4" /> },
        ];
      default:
        return [];
    }
  };

  const actions = getNextActions();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Sticky navigation bar with back button + breadcrumb */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2 flex items-center gap-4">
          {/* Clear back button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack} 
            className="gap-2 h-8 text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回</span>
          </Button>
          
          <div className="h-4 w-px bg-border shrink-0" />
          
          {/* Breadcrumb for context */}
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={onBack} className="cursor-pointer hover:text-foreground text-sm">
                  我的報價
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm">{rfq.id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          {/* Mobile: Just show RFQ ID */}
          <span className="sm:hidden text-sm text-foreground">{rfq.id}</span>
        </div>
      </div>
      
      <main className="flex-1 py-8 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-serif text-2xl font-light text-foreground">
                    {rfq.id}
                  </h1>
                  <Badge className={statusColors[rfq.status]}>
                    {statusLabels[rfq.status]}
                  </Badge>
                </div>
                <h2 className="text-xl text-foreground mb-1">{rfq.itemName}</h2>
                <p className="text-muted-foreground">{rfq.itemCode} • {rfq.category}</p>
              </div>
              
              {/* Action Buttons */}
              {actions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <Button 
                      key={action.status}
                      variant={action.variant || 'default'}
                      onClick={() => onStatusChange(rfq.id, action.status)}
                      className={action.variant === 'default' || !action.variant ? 'btn-red-glow' : ''}
                    >
                      {action.icon}
                      <span className="ml-2">{action.label}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Workflow Timeline */}
          <WorkflowTimeline currentStatus={rfq.status} />

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Left: Details & Model */}
            <div className="lg:col-span-2 space-y-6">
              {/* 3D Model Viewer */}
              <Card className="p-6">
                <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <Box className="w-5 h-5" />
                  3D 模型預覽
                </h3>
                <Model3DViewer 
                  hasModel={!!rfq.modelUrl} 
                  modelType={
                    rfq.category === '拉鍊' ? 'zipper' : 
                    rfq.category === '五金' ? 'hardware' : 
                    'button'
                  }
                />
                {rfq.modelUrl && (
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      下載 OBJ
                    </Button>
                    <Button variant="outline" size="sm">
                      全螢幕檢視
                    </Button>
                  </div>
                )}
              </Card>

              {/* Tabs: Comments & Files */}
              <Card className="p-6">
                <Tabs defaultValue="comments">
                  <TabsList>
                    <TabsTrigger value="comments" className="gap-2">
                      <MessageSquare className="w-4 h-4" />
                      留言討論 ({comments.length})
                    </TabsTrigger>
                    <TabsTrigger value="files" className="gap-2">
                      <FileText className="w-4 h-4" />
                      附件檔案 ({rfq.files.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="comments" className="mt-4">
                    <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
                      {comments.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          目前沒有留言
                        </p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                              comment.userRole === 'manufacturer' 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : comment.userRole === 'admin'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                : 'bg-primary/10 text-primary'
                            }`}>
                              {comment.userName[0]}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-foreground">{comment.userName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(comment.createdAt), 'MM/dd HH:mm', { locale: zhTW })}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{comment.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Textarea 
                        placeholder="輸入留言..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="resize-none"
                        rows={2}
                      />
                      <Button onClick={handleAddComment} className="self-end">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="files" className="mt-4">
                    {rfq.files.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        目前沒有附件
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {rfq.files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium text-foreground">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {file.uploadedBy} • {format(new Date(file.uploadedAt), 'MM/dd', { locale: zhTW })}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button variant="outline" className="w-full mt-4">
                      <Upload className="w-4 h-4 mr-2" />
                      上傳檔案
                    </Button>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Right: Info Sidebar */}
            <div className="space-y-6">
              {/* RFQ Details */}
              <Card className="p-6">
                <h3 className="font-medium text-foreground mb-4">報價需求</h3>
                <div className="space-y-4">
                  <InfoRow icon={<Package className="w-4 h-4" />} label="數量" value={`${rfq.quantity.toLocaleString()} pcs`} />
                  <InfoRow icon={<DollarSign className="w-4 h-4" />} label="目標單價" value={`$${rfq.targetPrice} USD`} />
                  <InfoRow icon={<Calendar className="w-4 h-4" />} label="交期" value={format(new Date(rfq.targetDate), 'yyyy/MM/dd', { locale: zhTW })} />
                </div>
                
                {rfq.notes && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">備註</p>
                    <p className="text-sm text-foreground">{rfq.notes}</p>
                  </div>
                )}
              </Card>

              {/* Tracking Info (if applicable) */}
              {(rfq.trackingNumber || rfq.estimatedDelivery) && (
                <Card className="p-6">
                  <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    物流資訊
                  </h3>
                  <div className="space-y-3">
                    {rfq.trackingNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground">追蹤編號</p>
                        <p className="text-sm font-mono text-foreground">{rfq.trackingNumber}</p>
                      </div>
                    )}
                    {rfq.estimatedDelivery && (
                      <div>
                        <p className="text-sm text-muted-foreground">預計送達</p>
                        <p className="text-sm text-foreground">
                          {format(new Date(rfq.estimatedDelivery), 'yyyy/MM/dd', { locale: zhTW })}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Team Info */}
              <Card className="p-6">
                <h3 className="font-medium text-foreground mb-4">建立資訊</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">團隊</p>
                    <p className="text-foreground">{rfq.teamName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">建立者</p>
                    <p className="text-foreground">{rfq.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">建立時間</p>
                    <p className="text-foreground">
                      {format(new Date(rfq.createdAt), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">最後更新</p>
                    <p className="text-foreground">
                      {format(new Date(rfq.updatedAt), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
    <span className="text-sm font-medium text-foreground">{value}</span>
  </div>
);

export default RFQDetail;
