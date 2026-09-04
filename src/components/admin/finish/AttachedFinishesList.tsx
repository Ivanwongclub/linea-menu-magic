import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/features/i18n/I18nProvider";
import { localizedFinishName } from "@/features/admin/lib/localize";
import { SortableList } from "@/components/admin/shared/SortableList";
import { SELECT_NONE_VALUE } from "@/components/admin/shared/flatCrudFields";
import { finishSwatchStyle, type FinishRow } from "@/features/admin/hooks/useFinishes";

interface Props {
  attached: FinishRow[];
  defaultFinishId: string | null;
  onReorder: (finishIdsInOrder: string[]) => void;
  onDetach: (finish: FinishRow) => void;
  onSetDefault: (finishId: string | null) => void;
  busy?: boolean;
}

export function AttachedFinishesList({ attached, defaultFinishId, onReorder, onDetach, onSetDefault, busy }: Props) {
  const { t, language } = useI18n();
  return (
    <div className="space-y-3">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {t("admin.finish.attached", { count: attached.length })}
      </span>

      {attached.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.finish.nothingAttached")}</p>
      ) : (
        <div className="space-y-1">
          <SortableList
            items={attached}
            getId={(f) => f.id}
            onReorder={(items) => onReorder(items.map((f) => f.id))}
            renderItem={(f, dragHandleProps) => (
              <div
                data-testid="attached-finish"
                data-code={f.cyc_code ?? ""}
                className="flex items-center gap-3 border border-border bg-background px-2 py-1.5"
              >
                <button
                  type="button"
                  className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
                  aria-label={t("admin.common.dragToReorder")}
                  {...dragHandleProps}
                >
                  <GripVertical className="w-4 h-4" />
                </button>
                <div className="w-7 h-7 border border-border/60 shrink-0" style={finishSwatchStyle(f)} />
                <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{f.cyc_code ?? "—"}</span>
                <span className="text-sm flex-1 truncate">{localizedFinishName(f, language)}</span>
                {defaultFinishId === f.id && (
                  <span className="text-[10px] uppercase tracking-wider text-foreground border border-foreground px-1.5">
                    {t("admin.finish.defaultBadge")}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  aria-label={t("admin.finish.detach", { code: f.cyc_code ?? localizedFinishName(f, language) })}
                  disabled={busy}
                  onClick={() => onDetach(f)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          />
        </div>
      )}

      <div className="max-w-sm space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t("admin.finish.default")}</Label>
        <Select
          value={defaultFinishId ?? SELECT_NONE_VALUE}
          onValueChange={(v) => onSetDefault(v === SELECT_NONE_VALUE ? null : v)}
          disabled={busy || attached.length === 0}
        >
          <SelectTrigger className="rounded-none" data-testid="default-finish-select">
            <SelectValue placeholder={t("admin.finish.noDefault")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SELECT_NONE_VALUE}>{t("admin.finish.noDefault")}</SelectItem>
            {attached.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.cyc_code ?? "—"} · {localizedFinishName(f, language)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t("admin.finish.defaultHint")}</p>
      </div>
    </div>
  );
}
