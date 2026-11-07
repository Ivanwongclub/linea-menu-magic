import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { ChevronRight, Folder, FolderOpen, Plus, Settings2, Ungroup } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { randomUUID } from "@/lib/uuid";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useEditorStore } from "../../store/useEditorStore";
import { isLogoLayer } from "../../lib/recipe";
import { groupForMember, memberKey, type PaintGroup, type PaintGroupMember } from "../../lib/paintGroups";
import { useLogoSources } from "../../hooks/useLogoAssets";
import { LayerList } from "../branding/LayerList";
import { PartRow } from "../PartRow";
import { DockSection } from "./DockSection";
import { useLayerDrag } from "../../hooks/useLayerDrag";

function useAvailableMembers() {
  const { t } = useI18n();
  const parts = useEditorStore(s => s.partsReport?.groups);
  const layers = useEditorStore(s => s.recipe.layers);
  return [
    ...(parts ?? []).map(part => ({ kind: "part" as const, id: String(part.index), name: part.name })),
    ...layers.map(layer => ({ kind: "layer" as const, id: layer.id, name: isLogoLayer(layer) ? t("editor.branding.logoLayer") : layer.content.value || t("editor.branding.emptyLayer") })),
  ];
}

export function PaintGroupsSection({ markedGroupIndices }: { markedGroupIndices: number[] }) {
  const { t } = useI18n();
  const groups = useEditorStore(s => s.recipe.paint_groups);
  const [open, setOpen] = useState(true);
  const [creating, setCreating] = useState(false);

  return (
    <DockSection testId="paint-groups-section" toggleTestId="paint-groups-toggle" title={t("editor.groups.title")} count={groups?.length ?? 0} open={open} onToggle={() => setOpen(value => !value)} actions={<button type="button" data-testid="add-paint-group" onClick={() => { setOpen(true); setCreating(true); }} className="flex items-center gap-1 text-xs hover:underline"><Plus className="h-3.5 w-3.5" />{t("editor.groups.add")}</button>}>
      {!groups?.length && <p className="text-xs text-muted-foreground">{t("editor.groups.empty")}</p>}
      <ul className="space-y-1.5">
        {groups?.map(group => <PaintGroupRow key={group.id} group={group} markedGroupIndices={markedGroupIndices} />)}
      </ul>
      <PaintGroupDialog open={creating} onOpenChange={setCreating} />
    </DockSection>
  );
}

function PaintGroupRow({ group, markedGroupIndices }: { group: PaintGroup; markedGroupIndices: number[] }) {
  const { t } = useI18n();
  const childrenId = useId();
  const row = useRef<HTMLLIElement>(null);
  const { setNodeRef } = useDroppable({ id: `group:${group.id}`, data: { kind: "group", groupId: group.id } });
  const bindRow = useCallback((node: HTMLLIElement | null) => { row.current = node; setNodeRef(node); }, [setNodeRef]);
  const drag = useLayerDrag();
  const dropOver = !!drag.member && drag.destination?.groupId === group.id;
  const [expanded, setExpanded] = useState(true);
  const selection = useEditorStore(s => s.selection);
  const select = useEditorStore(s => s.select);
  const parts = useEditorStore(s => s.partsReport?.groups);
  const allLayers = useEditorStore(s => s.recipe.layers);
  const originalLettering = useEditorStore(s => s.recipe.view.original_lettering === true);
  const setOriginalLettering = useEditorStore(s => s.setOriginalLettering);
  const toggleHiddenGroup = useEditorStore(s => s.toggleHiddenGroup);
  const setHoveredPart = useEditorStore(s => s.setHoveredPart);
  const hovered = useEditorStore(s => s.hoveredPartIndex);
  const layers = allLayers.filter(layer => group.members.some(member => member.kind === "layer" && member.id === layer.id));
  const logoSources = useLogoSources(layers);
  const selected = selection?.kind === "group" && selection.id === group.id;
  const childSelected = group.members.some(member => member.kind === selection?.kind && member.id === selection.id);

  // New membership and canvas group selection reveal the actual folder,
  // even when the dock was scrolled to the model's ungrouped parts.
  useEffect(() => {
    if (!selected) return;
    setExpanded(true);
    const frame = requestAnimationFrame(() => row.current?.scrollIntoView({ block: "nearest" }));
    return () => cancelAnimationFrame(frame);
  }, [group.members, selected]);

  return (
    <li ref={bindRow} data-testid="paint-group-row" data-group-id={group.id} data-selected={selected} data-drop-over={dropOver || undefined} className={`border ${selected ? "border-blue-600" : "border-border"} ${dropOver ? "bg-blue-50 ring-2 ring-blue-600" : ""}`}>
      <div className={`flex items-center gap-1 px-1.5 py-1.5 ${selected || childSelected ? "bg-blue-50" : "bg-secondary/40"}`}>
        <button type="button" data-testid="paint-group-toggle" aria-expanded={expanded} aria-controls={childrenId} aria-label={t(expanded ? "editor.groups.collapse" : "editor.groups.expand", { name: group.name })} onClick={() => setExpanded(value => !value)} className="flex h-6 w-5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"><ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} /></button>
        <button type="button" data-testid="paint-group-select" aria-pressed={selected} onClick={() => { select({ kind: "group", id: group.id }); setExpanded(true); }} className="flex min-w-0 flex-1 items-center gap-2 text-left text-xs">{expanded ? <FolderOpen className="h-3.5 w-3.5 shrink-0" /> : <Folder className="h-3.5 w-3.5 shrink-0" />}<span className="truncate">{group.name}</span><span className="ml-auto shrink-0 pr-1 text-muted-foreground">{group.members.length}</span></button>
        <EditPaintGroupButton group={group} iconOnly />
      </div>
      {expanded && <div id={childrenId} data-testid="paint-group-children" className="mb-2 ml-4 mr-2 space-y-1.5 border-l border-border pl-2">
        <ul>
          {group.members.filter(member => member.kind === "part").map(member => {
            const part = parts?.find(part => String(part.index) === member.id);
            if (!part) return null;
            const active = selection?.kind === "part" && selection.id === member.id;
            return <PartRow key={member.id} testId="part-row" index={part.index} name={part.name} detail={t("editor.parts.faceCount", { count: part.faces })} visible={part.visible} selected={active} hovered={hovered === part.index} onHover={() => setHoveredPart(part.visible ? part.index : null)} onHoverEnd={() => { if (useEditorStore.getState().hoveredPartIndex === part.index) setHoveredPart(null); }} onSelect={() => select(active ? null : { kind: "part", id: member.id })} onDoubleSelect={() => select({ kind: "part", id: member.id })} onToggle={() => markedGroupIndices.includes(part.index) ? setOriginalLettering(!originalLettering) : toggleHiddenGroup(part.index)} />;
          })}
        </ul>
        {layers.length > 0 && <LayerList layers={layers} logoSources={logoSources} />}
      </div>}
    </li>
  );
}

export function EditPaintGroupButton({ group, iconOnly = false }: { group: PaintGroup; iconOnly?: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" data-testid="edit-paint-group" title={t("editor.groups.edit")} aria-label={t("editor.groups.edit")} onClick={() => setOpen(true)} className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Settings2 className="h-3.5 w-3.5" />{!iconOnly && t("editor.groups.edit")}</button>
    <PaintGroupDialog group={group} open={open} onOpenChange={setOpen} />
  </>;
}

export function DissolvePaintGroupButton({ id }: { id: string }) {
  const { t } = useI18n();
  const remove = useEditorStore(s => s.removePaintGroup);
  return <button type="button" data-testid="dissolve-paint-group" onClick={() => remove(id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Ungroup className="h-3.5 w-3.5" />{t("editor.groups.dissolve")}</button>;
}

function PaintGroupDialog({ group, open, onOpenChange }: { group?: PaintGroup; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useI18n();
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[85vh] max-w-md rounded-none" data-testid="paint-group-dialog" onKeyDown={event => { if (event.key === "Escape" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z")) event.stopPropagation(); }}>
      <DialogHeader><DialogTitle>{t(group ? "editor.groups.edit" : "editor.groups.add")}</DialogTitle><DialogDescription>{t("editor.groups.dialogHint")}</DialogDescription></DialogHeader>
      {open && <PaintGroupForm key={group?.id ?? "new"} group={group} onDone={() => onOpenChange(false)} />}
    </DialogContent>
  </Dialog>;
}

function PaintGroupForm({ group, onDone }: { group?: PaintGroup; onDone: () => void }) {
  const { t } = useI18n();
  const available = useAvailableMembers();
  const recipe = useEditorStore(s => s.recipe);
  const selection = useEditorStore(s => s.selection);
  const save = useEditorStore(s => s.savePaintGroup);
  const [name, setName] = useState(group?.name ?? `GP ${(recipe.paint_groups?.length ?? 0) + 1}`);
  const [members, setMembers] = useState<PaintGroupMember[]>(group?.members ?? (selection?.kind === "part" || selection?.kind === "layer" ? [{ kind: selection.kind, id: selection.id }] : []));
  const valid = members.filter(member => available.some(item => memberKey(item) === memberKey(member)) && (!groupForMember(recipe, member) || groupForMember(recipe, member)?.id === group?.id));
  const count = valid.length;
  return <div className="space-y-3">
    <label className="block space-y-1 text-xs text-muted-foreground">{t("editor.groups.name")}<input data-testid="paint-group-name" value={name} maxLength={80} onChange={event => setName(event.currentTarget.value)} className="block w-full border border-border bg-background px-2 py-2 text-sm text-foreground outline-none focus:border-foreground" /></label>
    <div className="max-h-[40vh] space-y-1 overflow-y-auto border border-border p-2" data-testid="paint-group-members">
      {available.map(member => {
        const parent = groupForMember(recipe, member);
        const disabled = !!parent && parent.id !== group?.id;
        const checked = valid.some(item => memberKey(item) === memberKey(member));
        return <label key={memberKey(member)} className={`flex items-center gap-2 px-1 py-1.5 text-xs ${disabled ? "text-muted-foreground" : "cursor-pointer text-foreground"}`}><input type="checkbox" data-testid="paint-group-member" data-kind={member.kind} data-member-id={member.id} checked={checked} disabled={disabled} onChange={() => setMembers(previous => checked ? previous.filter(item => memberKey(item) !== memberKey(member)) : [...previous, { kind: member.kind, id: member.id }])} className="accent-blue-600" /><span className="min-w-0 flex-1 truncate">{member.name}</span><span className="shrink-0 text-[10px] text-muted-foreground">{parent ? parent.name : t(member.kind === "part" ? "editor.properties.part" : "editor.groups.layer")}</span></label>;
      })}
      {!available.length && <p className="text-xs text-muted-foreground">{t("editor.groups.noMembers")}</p>}
    </div>
    <div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{t("editor.groups.selectedCount", { count })}</span><button type="button" data-testid="save-paint-group" disabled={!name.trim() || count < (group ? 1 : 2)} onClick={() => { save({ ...group, id: group?.id ?? randomUUID(), name, members: valid }); onDone(); }} className="border border-foreground bg-foreground px-3 py-1.5 text-xs text-background disabled:opacity-40">{t("editor.groups.save")}</button></div>
  </div>;
}

export function PaintGroupDetails({ group, actions = true }: { group: PaintGroup; actions?: boolean }) {
  const { t } = useI18n();
  const available = useAvailableMembers();
  return <div className="mt-3 space-y-2 border-t border-border pt-3" data-testid="paint-group-details">
    <p className="text-xs text-foreground">{t("editor.groups.selectedCount", { count: group.members.length })}</p>
    <ul className="max-h-24 space-y-1 overflow-y-auto text-xs text-muted-foreground">{group.members.map(member => <li key={memberKey(member)} className="truncate">{available.find(item => memberKey(item) === memberKey(member))?.name ?? member.id}</li>)}</ul>
    <p className="text-[11px] leading-relaxed text-muted-foreground">{t("editor.groups.fillHint")}</p>
    {actions && <div className="flex flex-wrap items-center justify-between gap-2"><EditPaintGroupButton group={group} /><DissolvePaintGroupButton id={group.id} /></div>}
  </div>;
}
