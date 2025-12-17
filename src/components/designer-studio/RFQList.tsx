import { RFQ, statusLabels, statusColors } from "@/data/mockRFQData";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar, Package, DollarSign, MessageSquare, FileText } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

interface RFQListProps {
  rfqs: RFQ[];
  onSelect: (rfq: RFQ) => void;
}

const RFQList = ({ rfqs, onSelect }: RFQListProps) => {
  if (rfqs.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">目前沒有符合條件的報價請求</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rfqs.map((rfq) => (
        <Card 
          key={rfq.id}
          className="p-4 hover:shadow-md transition-all cursor-pointer border-border hover:border-primary/30"
          onClick={() => onSelect(rfq)}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Left: Basic Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-muted-foreground">{rfq.id}</span>
                <Badge className={statusColors[rfq.status]}>
                  {statusLabels[rfq.status]}
                </Badge>
              </div>
              <h3 className="font-medium text-foreground truncate">{rfq.itemName}</h3>
              <p className="text-sm text-muted-foreground">{rfq.itemCode} • {rfq.category}</p>
            </div>

            {/* Middle: Details */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                <span>{rfq.quantity.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                <span>${rfq.targetPrice}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(rfq.targetDate), 'MM/dd', { locale: zhTW })}</span>
              </div>
              {rfq.comments.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>{rfq.comments.length}</span>
                </div>
              )}
            </div>

            {/* Right: Team & Date */}
            <div className="text-right text-sm">
              <p className="text-foreground font-medium">{rfq.teamName}</p>
              <p className="text-muted-foreground">
                {format(new Date(rfq.updatedAt), 'MM/dd HH:mm', { locale: zhTW })}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default RFQList;
