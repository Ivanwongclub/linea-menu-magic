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
      userName: 'You',
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
        return [];
      case 'model_uploaded':
        return [
          { label: 'Confirm Design', status: 'design_confirmed', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Request Revision', status: 'submitted', icon: <RotateCcw className="w-4 h-4" />, variant: 'outline' },
        ];
      case 'design_confirmed':
        return [];
      case 'ready_for_printing':
        return [];
      case 'printing':
        return [];
      case 'shipped':
        return [];
      case 'sample_review':
        return [
          { label: 'Approve Production', status: 'production', icon: <Box className="w-4 h-4" /> },
          { label: 'Request Revision', status: 'submitted', icon: <RotateCcw className="w-4 h-4" />, variant: 'outline' },
          { label: 'Close', status: 'closed', icon: <XCircle className="w-4 h-4" />, variant: 'destructive' },
        ];
      case 'production':
        return [
          { label: 'Close', status: 'closed', icon: <CheckCircle className="w-4 h-4" /> },
        ];
      default:
        return [];
    }
  };

  const actions = getNextActions();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack} 
            className="gap-2 h-8 text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          
          <div className="h-4 w-px bg-border shrink-0" />
          
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={onBack} className="cursor-pointer hover:text-foreground text-sm">
                  My Quotes
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm">{rfq.id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <span className="sm:hidden text-sm text-foreground">{rfq.id}</span>
        </div>
      </div>
      
      <main className="flex-1 py-8 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-semibold text-foreground">
                    {rfq.id}
                  </h1>
                  <Badge className={statusColors[rfq.status]}>
                    {statusLabels[rfq.status]}
                  </Badge>
                </div>
                <h2 className="text-xl text-foreground mb-1">{rfq.itemName}</h2>
                <p className="text-muted-foreground">{rfq.itemCode} • {rfq.category}</p>
              </div>
              
              {actions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <Button 
                      key={action.status}
                      variant={action.variant || 'default'}
                      onClick={() => onStatusChange(rfq.id, action.status)}
                      className={action.variant === 'default' || !action.variant ? '' : ''}
                    >
                      {action.icon}
                      <span className="ml-2">{action.label}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <WorkflowTimeline currentStatus={rfq.status} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <Box className="w-5 h-5" />
                  3D Model Preview
                </h3>
                <Model3DViewer 
                  hasModel={!!rfq.modelUrl} 
                  modelType={
                    rfq.category === 'Zippers' ? 'zipper' : 
                    rfq.category === 'Hardware' ? 'hardware' : 
                    'button'
                  }
                />
                {rfq.modelUrl && (
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download OBJ
                    </Button>
                    <Button variant="outline" size="sm">
                      Fullscreen View
                    </Button>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <Tabs defaultValue="comments">
                  <TabsList>
                    <TabsTrigger value="comments" className="gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Comments ({comments.length})
                    </TabsTrigger>
                    <TabsTrigger value="files" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Attachments ({rfq.files.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="comments" className="mt-4">
                    <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
                      {comments.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No comments yet
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
                                  {format(new Date(comment.createdAt), 'MM/dd HH:mm')}
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
                        placeholder="Write a comment..."
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
                        No attachments yet
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
                                  {file.uploadedBy} • {format(new Date(file.uploadedAt), 'MM/dd')}
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
                      Upload File
                    </Button>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-medium text-foreground mb-4">Quote Details</h3>
                <div className="space-y-4">
                  <InfoRow icon={<Package className="w-4 h-4" />} label="Quantity" value={`${rfq.quantity.toLocaleString()} pcs`} />
                  <InfoRow icon={<DollarSign className="w-4 h-4" />} label="Target Price" value={`$${rfq.targetPrice} USD`} />
                  <InfoRow icon={<Calendar className="w-4 h-4" />} label="Delivery" value={format(new Date(rfq.targetDate), 'yyyy/MM/dd')} />
                </div>
                
                {rfq.notes && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm text-foreground">{rfq.notes}</p>
                  </div>
                )}
              </Card>

              {(rfq.trackingNumber || rfq.estimatedDelivery) && (
                <Card className="p-6">
                  <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Shipping Info
                  </h3>
                  <div className="space-y-3">
                    {rfq.trackingNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground">Tracking Number</p>
                        <p className="text-sm font-mono text-foreground">{rfq.trackingNumber}</p>
                      </div>
                    )}
                    {rfq.estimatedDelivery && (
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                        <p className="text-sm text-foreground">
                          {format(new Date(rfq.estimatedDelivery), 'yyyy/MM/dd')}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              <Card className="p-6">
                <h3 className="font-medium text-foreground mb-4">Request Info</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Team</p>
                    <p className="text-foreground">{rfq.teamName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created By</p>
                    <p className="text-foreground">{rfq.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="text-foreground">
                      {format(new Date(rfq.createdAt), 'yyyy/MM/dd HH:mm')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="text-foreground">
                      {format(new Date(rfq.updatedAt), 'yyyy/MM/dd HH:mm')}
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
