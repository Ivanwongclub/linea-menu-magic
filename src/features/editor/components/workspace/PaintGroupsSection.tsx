import { useState } from "react";
import { Folder, Plus, Settings2, Ungroup } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { randomUUID } from "@/lib/uuid";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useEditorStore } from "../../store/useEditorStore";
import { isLogoLayer } from "../../lib/recipe";
import { findMemberGroup, groupForMember, memberKey, type PaintGroup, type PaintGroupMember } from "../../lib/paintGroups";
import { DockSection } from "./DockSection";

function useAvailableMembers() {
  const { t } = useI18n();
  const parts = useEditorStore(s => s.partsReport?.groups);
  const layers = useEditorStore(s => s.recipe.layers);
  return [
    ...(parts ?? []).map(part => ({ kind: "part" as const, id: String(part.index), name: part.name })),
    ...layers.map(layer => ({ kind: "layer" as const, id: layer.id, name: isLogoLayer(layer) ? t("editor.branding.logoLayer") : layer.content.value || t("editor.branding.emptyLayer") })),
  ];
}

export function PaintGroupsSection() {
  const { t } = useI18n();
  const groups = useEditorStore(s => s.recipe.paint_groups);
  const selection = useEditorStore(s => s.selection);
  const select = useEditorStore(s => s.select);
  const available = useAvailableMembers();
  const [open, setOpen] = useState(true);
  const [creating, setCreating] = useState(false);

  return (
    <DockSection testId="paint-groups-section" toggleTestId="paint-groups-toggle" title={t("editor.groups.title")} count={groups?.length ?? 0} open={open} onToggle={() => setOpen(value => !value)} actions={<button type="button" data-testid="add-paint-group" onClick={() => { setOpen(true); setCreating(true); }} className="flex items-center gap-1 text-xs hover:underline"><Plus className="h-3.5 w-3.5" />{t("editor.groups.add")}</button>}>
      {!groups?.length && <p className="text-xs text-muted-foreground">{t("editor.groups.empty")}</p>}
      <ul className="space-y-1.5">
        {groups?.map(group => (
          <li key={group.id} data-testid="paint-group-row" data-group-id={group.id} data-selected={selection?.kind === "group" && selection.id === group.id} className={`border px-2 py-1.5 ${selection?.kind === "group" && selection.id === group.id ? "border-blue-600 bg-blue-50" : "border-border"}`}>
            <div className="flex items-center gap-2">
              <button type="button" data-testid="paint-group-select" onClick={() => select({ kind: "group", id: group.id })} className="flex min-w-0 flex-1 items-center gap-2 text-left text-xs"><Folder className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{group.name}</span><span className="ml-auto shrink-0 text-muted-foreground">{group.members.length}</span></button>
              <EditPaintGroupButton group={group} iconOnly />
            </div>
            <p className="mt-1 truncate pl-5 text-[10px] text-muted-foreground" title={group.members.map(member => available.find(item => memberKey(item) === memberKey(member))?.name ?? member.id).join(" · ")}>{group.members.map(member => available.find(item => memberKey(item) === memberKey(member))?.name ?? member.id).join(" · ")}</p>
          </li>
        ))}
      </ul>
      <PaintGroupDialog open={creating} onOpenChange={setCreating} />
    </DockSection>
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

export function PaintGroupBadge({ member }: { member: PaintGroupMember }) {
  const groups = useEditorStore(s => s.recipe.paint_groups);
  const group = findMemberGroup(groups, member);
  return group ? <span data-testid="paint-group-badge" title={group.name} className="max-w-16 truncate border border-border px-1 text-[9px] text-muted-foreground">{group.name}</span> : null;
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
