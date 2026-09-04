import { useI18n } from "@/features/i18n/I18nProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FamiliesPanel from "@/components/admin/taxonomy/FamiliesPanel";
import CategoriesPanel from "@/components/admin/taxonomy/CategoriesPanel";
import MaterialsPanel from "@/components/admin/taxonomy/MaterialsPanel";
import AttachmentsPanel from "@/components/admin/taxonomy/AttachmentsPanel";
import ComplianceStandardsPanel from "@/components/admin/taxonomy/ComplianceStandardsPanel";
import FinishAxesPanel from "@/components/admin/taxonomy/FinishAxesPanel";

const TABS = [
  { value: "families", key: "admin.tax.tab.families", Panel: FamiliesPanel },
  { value: "categories", key: "admin.tax.tab.categories", Panel: CategoriesPanel },
  { value: "materials", key: "admin.tax.tab.materials", Panel: MaterialsPanel },
  { value: "attachments", key: "admin.tax.tab.attachments", Panel: AttachmentsPanel },
  { value: "compliance", key: "admin.tax.tab.compliance", Panel: ComplianceStandardsPanel },
  { value: "finish-axes", key: "admin.tax.tab.finishAxes", Panel: FinishAxesPanel },
];

export default function AdminTaxonomy() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-light tracking-wide text-foreground">{t("admin.tax.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.tax.subtitle")}</p>
      </div>

      <Tabs defaultValue="families">
        <TabsList className="flex-wrap h-auto">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {t(tab.key)}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map(({ value, Panel }) => (
          <TabsContent key={value} value={value} className="pt-4">
            <Panel />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
