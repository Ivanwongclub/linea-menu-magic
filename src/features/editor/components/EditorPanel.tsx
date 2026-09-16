import type { ReactNode } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { EditorColour, EditorFinish, EditorProduct, EditorSizeVariant } from "../hooks/useEditorProduct";

interface EditorPanelProps {
  product: EditorProduct;
  sizeVariantId: string | null;
  onSizeVariantChange: (id: string) => void;
  finish: EditorFinish | null;
  colour: EditorColour | null;
}

function PanelGroup({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border border-border p-4 space-y-3">
      <h3 className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function formatSize(v: EditorSizeVariant): string {
  if (v.size_label) return v.size_label;
  const mm = Number(v.size_primary_mm.toFixed(2));
  const ligne = v.size_ligne != null ? ` (${Number(v.size_ligne.toFixed(1))}L)` : "";
  return `${mm}mm${ligne}`;
}

/**
 * Four groups, in the order a buyer decides (axis-design §7). This phase
 * fills PRODUCT and a read-only FINISH; BRANDING and OUTPUT are placeholders
 * for later phases in the build sequence.
 */
export function EditorPanel({ product, sizeVariantId, onSizeVariantChange, finish, colour }: EditorPanelProps) {
  return (
    <div className="w-full lg:w-[360px] shrink-0 border-l border-border bg-background overflow-y-auto p-4 space-y-4" data-testid="editor-panel">
      <PanelGroup title="Product">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">{product.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{product.item_code}</p>
        </div>
        {product.size_variants.length > 0 && (
          <RadioGroup value={sizeVariantId ?? undefined} onValueChange={onSizeVariantChange} className="space-y-2 pt-1">
            {product.size_variants.map((v) => (
              <div key={v.id} className="flex items-center gap-2">
                <RadioGroupItem value={v.id} id={`size-${v.id}`} />
                <Label htmlFor={`size-${v.id}`} className="text-sm font-normal cursor-pointer">
                  {formatSize(v)}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
      </PanelGroup>

      <PanelGroup title="Finish">
        {product.is_metal ? (
          finish ? (
            <div className="space-y-0.5">
              <p className="text-sm text-foreground">{finish.marketing_name}</p>
              {finish.axis_line && <p className="text-xs text-muted-foreground">{finish.axis_line}</p>}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No finish available.</p>
          )
        ) : colour ? (
          <p className="text-sm text-foreground">{colour.name}</p>
        ) : (
          <p className="text-xs text-muted-foreground">No colour available.</p>
        )}
      </PanelGroup>

      <PanelGroup title="Branding" />
      <PanelGroup title="Output" />
    </div>
  );
}
