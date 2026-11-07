import { useEffect, useRef, useState, type RefObject } from "react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { selectHiddenGroups, selectSelectedPartIndex, useEditorStore } from "../store/useEditorStore";
import { VIRTUALISE_ABOVE, rowWindow, type RowWindow } from "../lib/rowWindow";
import { DockSection } from "./workspace/DockSection";
import { PartRow } from "./PartRow";

/**
 * Parts (Phase 6b R1), as the layers dock's third section since E2 U5: the
 * model's own OBJ groups, by name, each with show / hide. The product's marked
 * lettering is one row of its own — the staff-only toggle in the viewport
 * corner is gone, because this is the same question asked where the rest of the
 * model is listed.
 *
 * Collapsed by default (E2 §3.4 item 3). A buyer branding a button is not
 * shopping for `object_11`, and on the Polo this section is 33 of the dock's
 * 36 rows; past 50 rows only the ones in view are rendered at all.
 *
 * Hiding never deletes geometry: the hidden set lives in the recipe
 * (`hidden_groups`), rides autosave, and is read back for the spec sheet. A
 * hidden part is still measured — the ruler and the framing stay the whole
 * model's, as they have since 4j.
 */
export function PartsGroup({
  markedGroupIndices,
  open,
  onToggle,
  scrollerRef,
}: {
  markedGroupIndices: number[];
  open: boolean;
  onToggle: () => void;
  /** The dock's scroll box: what the window is measured against. */
  scrollerRef: RefObject<HTMLElement | null>;
}) {
  const { t } = useI18n();
  const report = useEditorStore((s) => s.partsReport);
  const hidden = useEditorStore(selectHiddenGroups);
  const originalLettering = useEditorStore((s) => s.recipe.view.original_lettering === true);
  const toggleHiddenGroup = useEditorStore((s) => s.toggleHiddenGroup);
  const setOriginalLettering = useEditorStore((s) => s.setOriginalLettering);
  const select = useEditorStore((s) => s.select);
  const selectedPart = useEditorStore(selectSelectedPartIndex);
  const hoveredPart = useEditorStore((s) => s.hoveredPartIndex);
  const setHoveredPart = useEditorStore((s) => s.setHoveredPart);
  useEffect(() => {
    if (!open) setHoveredPart(null);
    return () => setHoveredPart(null);
  }, [open, setHoveredPart]);

  const paintGroups = useEditorStore(s => s.recipe.paint_groups);
  const grouped = new Set((paintGroups ?? []).flatMap(group => group.members.filter(member => member.kind === "part").map(member => Number(member.id))));
  const marked = new Set(markedGroupIndices);
  const groups = (report?.groups ?? []).filter((group) => !marked.has(group.index) && !grouped.has(group.index));
  const hiddenSet = new Set(hidden);
  const hiddenCount = groups.filter((g) => hiddenSet.has(g.index)).length + (originalLettering ? 0 : marked.size > 0 ? 1 : 0);

  const list = useRef<HTMLUListElement>(null);
  const [window_, setWindow] = useState<RowWindow>(() => rowWindow(0, 0, 0));

  // The list's place in the dock's scroll box, remeasured as it moves. Read
  // from rects rather than offsets: the rows sit several boxes deep in the
  // section, and only the two rectangles matter.
  useEffect(() => {
    const scroller = scrollerRef.current;
    // A list short enough to render whole has nothing to measure: no listener,
    // and no re-render on every scroll tick of the dock.
    if (!open || !scroller || groups.length <= VIRTUALISE_ABOVE) {
      setWindow(rowWindow(groups.length, 0, 0));
      return;
    }
    const measure = () => {
      if (!list.current) return;
      const box = scroller.getBoundingClientRect();
      const next = rowWindow(groups.length, box.top - list.current.getBoundingClientRect().top, box.height);
      setWindow((current) => (current.start === next.start && current.end === next.end ? current : next));
    };
    measure();
    scroller.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      scroller.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
    // `window_` is deliberately not a dependency: measuring sets it, and
    // re-subscribing on every scroll tick would be the same listener again.
  }, [open, groups.length, scrollerRef]);

  return (
    <DockSection
      testId="parts-group"
      toggleTestId="parts-toggle"
      title={t(grouped.size ? "editor.groups.ungroupedParts" : "editor.parts.title")}
      count={groups.length + (markedGroupIndices.length > 0 ? 1 : 0)}
      open={open}
      onToggle={onToggle}
      summary={
        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground" data-testid="parts-summary">
          {hiddenCount > 0 ? t("editor.parts.hiddenCount", { count: hiddenCount }) : t("editor.parts.allShown")}
        </span>
      }
    >
      {/* The factory's own lettering is the recipe's, not one of the model's
          parts, so it sits above the windowed rows and is never one of them. */}
      {markedGroupIndices.length > 0 && (
        <ul className="border-t border-border">
          <PartRow
            testId="part-row-lettering"
            name={t("editor.parts.originalLettering")}
            detail={t("editor.parts.groupCount", { count: markedGroupIndices.length })}
            visible={originalLettering}
            onToggle={() => setOriginalLettering(!originalLettering)}
          />
        </ul>
      )}

      <ul
        ref={list}
        className="border-t border-border"
        data-testid="parts-list"
        data-rows={groups.length}
        data-virtualised={window_.virtualised}
        data-window={`${window_.start}-${window_.end}`}
      >
        {window_.padTopPx > 0 && <li aria-hidden="true" style={{ height: window_.padTopPx }} />}
        {groups.slice(window_.start, window_.end).map((group) => (
          <PartRow
            key={group.index}
            testId="part-row"
            index={group.index}
            name={group.name}
            detail={t("editor.parts.faceCount", { count: group.faces })}
            visible={!hiddenSet.has(group.index)}
            selected={selectedPart === group.index}
            hovered={hoveredPart === group.index}
            onHover={() => setHoveredPart(!hiddenSet.has(group.index) ? group.index : null)}
            onHoverEnd={() => {
              if (useEditorStore.getState().hoveredPartIndex === group.index) setHoveredPart(null);
            }}
            onSelect={() => select(selectedPart === group.index ? null : { kind: "part", id: String(group.index) })}
            onDoubleSelect={() => select({ kind: "part", id: String(group.index) })}
            onToggle={() => toggleHiddenGroup(group.index)}
          />
        ))}
        {window_.padBottomPx > 0 && <li aria-hidden="true" style={{ height: window_.padBottomPx }} />}
        {groups.length === 0 && markedGroupIndices.length === 0 && <li className="py-1 text-xs text-muted-foreground">{t(grouped.size ? "editor.groups.allPartsGrouped" : "editor.parts.empty")}</li>}
      </ul>
    </DockSection>
  );
}
