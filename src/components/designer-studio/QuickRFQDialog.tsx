import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, X, FileText, File } from "lucide-react";
import { LibraryItem, categoryLabels } from "@/data/mockLibraryData";
import { useToast } from "@/hooks/use-toast";

interface QuickRFQDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LibraryItem | null;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

const QuickRFQDialog = ({ open, onOpenChange, item }: QuickRFQDialogProps) => {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string) => {
    if (type.includes("model") || type.includes("obj") || type.includes("octet-stream")) {
      return <File className="w-4 h-4 text-blue-500" />;
    }
    return <FileText className="w-4 h-4 text-muted-foreground" />;
  };

  const handleSubmit = () => {
    if (!quantity) {
      toast({
        title: "請填寫數量",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "報價請求已提交",
      description: `品項 ${item?.itemCode} 的報價請求已成功提交。`,
    });

    // Reset form
    setQuantity("");
    setTargetPrice("");
    setTargetDate("");
    setNotes("");
    setUploadedFiles([]);
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">快速報價請求</DialogTitle>
          <DialogDescription>
            為 <span className="font-medium text-foreground">{item.name}</span> 建立報價請求
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Auto-filled Item Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{categoryLabels[item.category]}</Badge>
              {item.modelUrl && <Badge className="bg-primary/90">3D</Badge>}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">品項代碼</span>
              <span className="font-mono font-medium">{item.itemCode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">品項名稱</span>
              <span className="font-medium">{item.name}</span>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              需求數量 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              placeholder="請輸入數量"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* Target Price */}
          <div className="space-y-2">
            <Label htmlFor="targetPrice">目標單價 (USD)</Label>
            <Input
              id="targetPrice"
              type="number"
              step="0.01"
              placeholder="選填"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
            />
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label htmlFor="targetDate">目標交期</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>附件上傳</Label>
            <p className="text-xs text-muted-foreground mb-2">
              可上傳修改後的 OBJ 檔案或其他相關文件（如規格書、參考圖片等）
            </p>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                multiple
                accept=".obj,.stl,.step,.pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  點擊或拖曳檔案至此處上傳
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  支援 OBJ, STL, STEP, PDF, 圖片, Word 文件
                </p>
              </label>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2 mt-3">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.type)}
                      <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">備註說明</Label>
            <Textarea
              id="notes"
              placeholder="請輸入任何額外需求或說明..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} className="btn-red-glow">
            提交報價請求
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickRFQDialog;
