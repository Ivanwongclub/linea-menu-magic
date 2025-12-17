import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Eye, FileText, Lock, Globe, Box, Star, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { LibraryItem, categoryLabels } from "@/data/mockLibraryData";
import { format } from "date-fns";

type SortField = "name" | "itemCode" | "category" | "createdAt";
type SortOrder = "asc" | "desc";

interface LibraryTableProps {
  items: LibraryItem[];
  onView: (item: LibraryItem) => void;
  onQuickRFQ: (item: LibraryItem) => void;
  onToggleFavorite: (itemId: string) => void;
  favorites: Set<string>;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

const SortIcon = ({ field, currentField, order }: { field: SortField; currentField: SortField; order: SortOrder }) => {
  if (field !== currentField) {
    return <ArrowUpDown className="w-3 h-3 opacity-50" />;
  }
  return order === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
};

const LibraryTable = ({ 
  items, 
  onView, 
  onQuickRFQ, 
  onToggleFavorite, 
  favorites,
  sortField,
  sortOrder,
  onSort
}: LibraryTableProps) => {
  return (
    <div className="border border-border rounded-lg">
      <ScrollArea className="w-full whitespace-nowrap">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12 text-center">
                <Star className="w-4 h-4 mx-auto text-muted-foreground" />
              </TableHead>
              <TableHead className="w-20">圖片</TableHead>
              <TableHead className="w-32">
                <button 
                  onClick={() => onSort("itemCode")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                >
                  品項代碼
                  <SortIcon field="itemCode" currentField={sortField} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="min-w-[200px]">
                <button 
                  onClick={() => onSort("name")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                >
                  名稱
                  <SortIcon field="name" currentField={sortField} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="w-40">描述</TableHead>
              <TableHead className="w-28">
                <button 
                  onClick={() => onSort("category")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                >
                  類別
                  <SortIcon field="category" currentField={sortField} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="w-24">可見度</TableHead>
              <TableHead className="w-20">3D模型</TableHead>
              <TableHead className="w-28">
                <button 
                  onClick={() => onSort("createdAt")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                >
                  建立日期
                  <SortIcon field="createdAt" currentField={sortField} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="w-52 text-right sticky right-0 bg-muted/50">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isFavorite = favorites.has(item.id);
              return (
                <TableRow 
                  key={item.id} 
                  className="group hover:bg-muted/30 cursor-pointer"
                  onClick={() => onView(item)}
                >
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onToggleFavorite(item.id)}
                    >
                      <Star 
                        className={`w-4 h-4 transition-colors ${
                          isFavorite 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-muted-foreground hover:text-yellow-400"
                        }`} 
                      />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="relative w-14 h-10 rounded overflow-hidden bg-muted">
                      <img
                        src={item.thumbnailUrl || '/placeholder.svg'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{item.itemCode}</span>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-[180px]">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.nameEn}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground truncate max-w-[140px]">
                      {item.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {categoryLabels[item.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.isPublic ? (
                      <Badge variant="secondary" className="gap-1 text-xs whitespace-nowrap">
                        <Globe className="w-3 h-3" />
                        公開
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-xs whitespace-nowrap bg-background/80 border-amber-500/50 text-amber-700 dark:text-amber-400">
                        <Lock className="w-3 h-3" />
                        {item.teamName || '團隊'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.modelUrl ? (
                      <Badge className="bg-primary/90 text-xs gap-1">
                        <Box className="w-3 h-3" />
                        有
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(item.createdAt), 'yyyy/MM/dd')}
                  </TableCell>
                  <TableCell className="sticky right-0 bg-card group-hover:bg-muted/30" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => onView(item)}
                      >
                        <Eye className="w-4 h-4" />
                        查看
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1 btn-red-glow"
                        onClick={() => onQuickRFQ(item)}
                      >
                        <FileText className="w-4 h-4" />
                        報價
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default LibraryTable;
