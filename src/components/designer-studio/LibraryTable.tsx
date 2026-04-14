import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Eye, Box, Heart, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { UserLibraryItem } from "@/features/products/types";
import { format } from "date-fns";
import { getProductImageUrl } from "@/lib/productImage";

export type SortField = "name" | "itemCode" | "category" | "addedAt";
type SortOrder = "asc" | "desc";

interface LibraryTableProps {
  items: UserLibraryItem[];
  onView: (item: UserLibraryItem) => void;
  onToggleFavorite: (itemId: string) => void;
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
  onToggleFavorite,
  sortField,
  sortOrder,
  onSort,
}: LibraryTableProps) => {
  return (
    <div className="border border-border rounded-[var(--radius)]">
      <ScrollArea className="w-full whitespace-nowrap">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12 text-center">
                <Heart className="w-4 h-4 mx-auto text-muted-foreground" />
              </TableHead>
              <TableHead className="w-20">Image</TableHead>
              <TableHead className="w-32">
                <button
                  onClick={() => onSort("itemCode")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                >
                  Item Code
                  <SortIcon field="itemCode" currentField={sortField} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="min-w-[200px]">
                <button
                  onClick={() => onSort("name")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                >
                  Name
                  <SortIcon field="name" currentField={sortField} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="w-28">
                <button
                  onClick={() => onSort("category")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                >
                  Category
                  <SortIcon field="category" currentField={sortField} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="w-24">Brand</TableHead>
              <TableHead className="w-20">3D</TableHead>
              <TableHead className="w-28">
                <button
                  onClick={() => onSort("addedAt")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                >
                  Added
                  <SortIcon field="addedAt" currentField={sortField} order={sortOrder} />
                </button>
              </TableHead>
              <TableHead className="w-32 text-right sticky right-0 bg-muted/50">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const product = item.product;
              const displayName = item.custom_name || product?.name_en || product?.name || 'Untitled';
              const itemCode = product?.item_code ?? '';
              const thumbnailUrl = getProductImageUrl(product?.thumbnail_url, "thumb");
              const categoryName = product?.primary_category?.name ?? product?.categories?.[0]?.name;

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
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          item.is_favourite
                            ? "fill-red-500 text-red-500"
                            : "text-muted-foreground hover:text-red-500"
                        }`}
                      />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="relative w-14 h-10 rounded overflow-hidden bg-secondary">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={displayName}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground font-mono">
                          {itemCode.slice(0, 6)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{itemCode}</span>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-[180px]">
                      <p className="font-medium truncate">{displayName}</p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground italic truncate">{item.notes}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {categoryName && (
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {categoryName}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.custom_brand && (
                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                        {item.custom_brand}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {product?.model_url ? (
                      <Badge className="bg-primary/90 text-xs gap-1">
                        <Box className="w-3 h-3" />
                        Yes
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(item.added_at), 'yyyy/MM/dd')}
                  </TableCell>
                  <TableCell className="sticky right-0 bg-card group-hover:bg-muted/30" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => onView(item)}
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
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
