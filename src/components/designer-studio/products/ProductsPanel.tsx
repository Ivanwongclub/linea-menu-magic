import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Tags, Upload } from "lucide-react";
import ProductCatalogTab from "./ProductCatalogTab";
import TaxonomyTab from "./TaxonomyTab";
import ImportTab from "./ImportTab";

interface ProductsPanelProps {
  onOpenEditor?: (productId?: string) => void;
}

export default function ProductsPanel({ onOpenEditor }: ProductsPanelProps) {
  const [subTab, setSubTab] = useState<"catalog" | "taxonomy" | "import">("catalog");

  return (
    <div>
      <Tabs value={subTab} onValueChange={(v) => setSubTab(v as typeof subTab)}>
        <TabsList className="h-8 mb-4">
          <TabsTrigger value="catalog" className="text-xs px-3 h-6 gap-1.5">
            <Database className="w-3 h-3" />
            Catalog
          </TabsTrigger>
          <TabsTrigger value="taxonomy" className="text-xs px-3 h-6 gap-1.5">
            <Tags className="w-3 h-3" />
            Categories & Tags
          </TabsTrigger>
          <TabsTrigger value="import" className="text-xs px-3 h-6 gap-1.5">
            <Upload className="w-3 h-3" />
            Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-0">
          <ProductCatalogTab onOpenEditor={onOpenEditor} />
        </TabsContent>

        <TabsContent value="taxonomy" className="mt-0">
          <TaxonomyTab />
        </TabsContent>

        <TabsContent value="import" className="mt-0">
          <ImportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
