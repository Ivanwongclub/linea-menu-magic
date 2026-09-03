import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FamiliesPanel from "@/components/admin/taxonomy/FamiliesPanel";
import CategoriesPanel from "@/components/admin/taxonomy/CategoriesPanel";
import MaterialsPanel from "@/components/admin/taxonomy/MaterialsPanel";
import AttachmentsPanel from "@/components/admin/taxonomy/AttachmentsPanel";
import ComplianceStandardsPanel from "@/components/admin/taxonomy/ComplianceStandardsPanel";
import FinishAxesPanel from "@/components/admin/taxonomy/FinishAxesPanel";

export default function AdminTaxonomy() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-light tracking-wide text-foreground">Taxonomy</h1>
        <p className="text-sm text-muted-foreground">
          Families, categories, materials, attachments, compliance standards, and the finish facet axes.
        </p>
      </div>

      <Tabs defaultValue="families">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="families">Families</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Standards</TabsTrigger>
          <TabsTrigger value="finish-axes">Finish Axes</TabsTrigger>
        </TabsList>
        <TabsContent value="families" className="pt-4">
          <FamiliesPanel />
        </TabsContent>
        <TabsContent value="categories" className="pt-4">
          <CategoriesPanel />
        </TabsContent>
        <TabsContent value="materials" className="pt-4">
          <MaterialsPanel />
        </TabsContent>
        <TabsContent value="attachments" className="pt-4">
          <AttachmentsPanel />
        </TabsContent>
        <TabsContent value="compliance" className="pt-4">
          <ComplianceStandardsPanel />
        </TabsContent>
        <TabsContent value="finish-axes" className="pt-4">
          <FinishAxesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
