import { RFQ, statusLabels, statusColors } from "@/data/mockRFQData";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar, Package, DollarSign, MessageSquare, FileText, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useState, useMemo } from "react";

type SortField = "id" | "itemName" | "status" | "quantity" | "targetDate" | "updatedAt";
type SortOrder = "asc" | "desc";

interface RFQListProps {
  rfqs: RFQ[];
  onSelect: (rfq: RFQ) => void;
}

const SortIcon = ({ field, currentField, order }: { field: SortField; currentField: SortField; order: SortOrder }) => {
  if (field !== currentField) {
    return <ArrowUpDown className="w-3 h-3 opacity-50" />;
  }
  return order === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
};

const RFQList = ({ rfqs, onSelect }: RFQListProps) => {
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedRfqs = useMemo(() => {
    return [...rfqs].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "id":
          comparison = a.id.localeCompare(b.id);
          break;
        case "itemName":
          comparison = a.itemName.localeCompare(b.itemName);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "quantity":
          comparison = a.quantity - b.quantity;
          break;
        case "targetDate":
          comparison = new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
          break;
        case "updatedAt":
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [rfqs, sortField, sortOrder]);

  if (rfqs.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">目前沒有符合條件的報價請求</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg">
      <ScrollArea className="w-full whitespace-nowrap">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-28">
                <button 
                  onClick={() => handleSort("id")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                >
                  RFQ編號
                  <SortIcon field="id" currentField={sortField} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="w-24">狀態</TableHead>
              <TableHead className="min-w-[180px]">
                <button 
                  onClick={() => handleSort("itemName")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                >
                  品項名稱
                  <SortIcon field="itemName" currentField={sortField} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="w-28">品項代碼</TableHead>
              <TableHead className="w-24">
                <button 
                  onClick={() => handleSort("quantity")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                >
                  數量
                  <SortIcon field="quantity" currentField={sortField} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="w-24">目標價格</TableHead>
              <TableHead className="w-28">
                <button 
                  onClick={() => handleSort("targetDate")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                >
                  目標日期
                  <SortIcon field="targetDate" currentField={sortField} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="w-16">留言</TableHead>
              <TableHead className="w-24">團隊</TableHead>
              <TableHead className="w-32">
                <button 
                  onClick={() => handleSort("updatedAt")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                >
                  更新時間
                  <SortIcon field="updatedAt" currentField={sortField} order={sortOrder} />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRfqs.map((rfq) => (
              <TableRow 
                key={rfq.id} 
                className="group hover:bg-muted/30 cursor-pointer"
                onClick={() => onSelect(rfq)}
              >
                <TableCell>
                  <span className="font-mono text-sm">{rfq.id}</span>
                </TableCell>
                <TableCell>
                  <Badge className={`${statusColors[rfq.status]} whitespace-nowrap`}>
                    {statusLabels[rfq.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="font-medium truncate max-w-[180px]">{rfq.itemName}</p>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm text-muted-foreground">{rfq.itemCode}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Package className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{rfq.quantity.toLocaleString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{rfq.targetPrice}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{format(new Date(rfq.targetDate), 'MM/dd', { locale: zhTW })}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {rfq.comments.length > 0 ? (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{rfq.comments.length}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium whitespace-nowrap">{rfq.teamName}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(rfq.updatedAt), 'MM/dd HH:mm', { locale: zhTW })}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default RFQList;
