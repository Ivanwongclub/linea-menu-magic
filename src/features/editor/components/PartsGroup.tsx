import { useState } from "react";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { selectHiddenGroups, selectSelectedPartIndex, useEditorStore } from "../store/useEditorStore";

/**
 * Parts (Phase 6b R1): the model's own OBJ groups, by name, each with show /
 * hide. The product's marked lettering is one row of its own — the staff-only
 * toggle in the viewport corner is gone, because this is the same question
 * asked where the rest of the model is listed.
 *
 * Hiding never deletes geometry: the hidden set lives in the recipe
 * (`hidden_groups`), rides autosave, and is read back for the spec sheet. A
 * hidden part is still measured — the ruler and the framing stay the whole
 * model's, as they have since 4j.
 */
export function PartsGroup({ markedGroupIndices }: { markedGroupIndices: number[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const report = useEditorStore((s) => s.partsReport);
  const hidden = useEditorStore(selectHiddenGroups);
  const originalLettering = useEditorStore((s) => s.recipe.view.original_lettering === true);
  const toggleHiddenGroup = useEditorStore((s) => s.toggleHiddenGroup);
  const setOriginalLettering = useEditorStore((s) => s.setOriginalLettering);
  const select = useEditorStore((s) => s.select);
  const selectedPart = useEditorStore(selectSelectedPartIndex);

  const marked = new Set(markedGroupIndices);
  const groups = (report?.groups ?? []).filter((group) => !marked.has(group.index));
  const hiddenSet = new Set(hidden);
  const hiddenCount = groups.filter((g) => hiddenSet.has(g.index)).length + (originalLettering ? 0 : marked.size > 0 ? 1 : 0);

  return (
    <div className="border border-border p-4 space-y-2" data-testid="parts-group">
      <button
        type="button"
        aria-expanded={open}
        data-testid="parts-toggle"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
      >
        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} strokeWidth={1.5} />
        {t("editor.parts.title")}
        <span className="ml-auto normal-case tracking-normal text-[11px]" data-testid="parts-summary">
          {hiddenCount > 0 ? t("editor.parts.hiddenCount", { count: hiddenCount }) : t("editor.parts.allShown")}
        </span>
      </button>

      {open && (
        <ul className="space-y-1" data-testid="parts-list">
          {markedGroupIndices.length > 0 && (
            <PartRow
              testId="part-row-lettering"
              name={t("editor.parts.originalLettering")}
              detail={t("editor.parts.groupCount", { count: markedGroupIndices.length })}
              visible={originalLettering}
              onToggle={() => setOriginalLettering(!originalLettering)}
            />
          )}
          {groups.map((group) => (
            <PartRow
              key={group.index}
              testId="part-row"
              index={group.index}
              name={group.name}
              detail={t("editor.parts.faceCount", { count: group.faces })}
              visible={!hiddenSet.has(group.index)}
              selected={selectedPart === group.index}
              onSelect={() => select({ kind: "part", id: String(group.index) })}
              onToggle={() => toggleHiddenGroup(group.index)}
            />
          ))}
          {groups.length === 0 && markedGroupIndices.length === 0 && <li className="text-xs text-muted-foreground">{t("editor.parts.empty")}</li>}
        </ul>
      )}
    </div>
  );
}

function PartRow({
  testId,
  index,
  name,
  detail,
  visible,
  selected,
  onSelect,
  onToggle,
}: {
  testId: string;
  index?: number;
  name: string;
  detail: string;
  visible: boolean;
  selected?: boolean;
  /** The lettering row is the recipe's, not one of the model's parts: it has nothing to select. */
  onSelect?: () => void;
  onToggle: () => void;
}) {
  const { t } = useI18n();
  return (
    <li
      className={cn("flex items-center gap-2 border px-2 py-1", selected ? "border-foreground" : "border-border")}
      data-testid={testId}
      data-index={index}
      data-visible={visible}
      data-selected={selected}
    >
      {onSelect ? (
        <button type="button" data-testid="part-select" aria-pressed={selected} onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className="min-w-0 flex-1 truncate text-xs text-foreground">{name}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground">{detail}</span>
        </button>
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate text-xs text-foreground">{name}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground">{detail}</span>
        </>
      )}
      <button
        type="button"
        data-testid="part-visibility"
        aria-pressed={visible}
        aria-label={t(visible ? "editor.parts.hide" : "editor.parts.show", { name })}
        onClick={onToggle}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        {visible ? <Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> : <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} />}
      </button>
    </li>
  );
}
