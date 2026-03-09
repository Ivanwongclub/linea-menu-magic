import { useState } from "react";
import { RFQ } from "@/data/mockRFQData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";

interface CreateRFQDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rfq: Omit<RFQ, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'comments' | 'files'>) => void;
}

const categories = ['鈕扣', '拉鍊', '花邊', '五金', '其他'];

const CreateRFQDialog = ({ open, onOpenChange, onSubmit }: CreateRFQDialogProps) => {
  const [formData, setFormData] = useState({
    itemCode: '',
    itemName: '',
    category: '',
    quantity: '',
    targetPrice: '',
    targetDate: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      itemCode: formData.itemCode,
      itemName: formData.itemName,
      category: formData.category,
      quantity: parseInt(formData.quantity) || 0,
      targetPrice: parseFloat(formData.targetPrice) || 0,
      targetDate: formData.targetDate,
      notes: formData.notes,
      createdBy: 'Current User',
      teamName: 'My Team',
    });

    // Reset form
    setFormData({
      itemCode: '',
      itemName: '',
      category: '',
      quantity: '',
      targetPrice: '',
      targetDate: '',
      notes: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">新增報價請求</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemCode">品項代碼 *</Label>
              <Input
                id="itemCode"
                placeholder="如: BTN-2024-001"
                value={formData.itemCode}
                onChange={(e) => setFormData(prev => ({ ...prev, itemCode: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">類別 *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇類別" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemName">品項名稱 *</Label>
            <Input
              id="itemName"
              placeholder="如: 金屬四孔鈕扣 18mm"
              value={formData.itemName}
              onChange={(e) => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">數量 *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="10000"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetPrice">目標單價 (USD) *</Label>
              <Input
                id="targetPrice"
                type="number"
                step="0.01"
                placeholder="0.15"
                value={formData.targetPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, targetPrice: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDate">目標交期 *</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">備註說明</Label>
            <Textarea
              id="notes"
              placeholder="請描述您的需求，如材質、顏色、特殊處理等..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>參考附件</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                點擊或拖曳上傳參考圖片
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                支援 JPG, PNG, PDF (最大 10MB)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">
              提交請求
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRFQDialog;
