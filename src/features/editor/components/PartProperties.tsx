import { Eye, EyeOff, Focus } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { selectHiddenGroups, useEditorStore } from "../store/useEditorStore";
import { usePartAppearance } from "../hooks/usePartAppearance";
import { getLocalModelColours } from "../lib/localModelAppearance";
import { AppearanceControl } from "./branding/AppearanceControl";
import { CopyPartStyleButton } from "./CopyPartStyleButton";

/**
 * A part of the model, once it is the selection (E2 U6). A part is the file's,
 * not the recipe's: there is nothing to edit about it but whether it is drawn —
 * so this says what it is, how much of the model it is, and which zones cover
 * it, which is the question a catalogue editor actually has.
 */
export function PartProperties({ index }: { index: number }) {
  const { t, language } = useI18n();
  const report = useEditorStore((s) => s.partsReport);
  const hidden = useEditorStore(selectHiddenGroups);
  const { appearance, changeAppearance, covering } = usePartAppearance(index);
  const toggleHiddenGroup = useEditorStore((s) => s.toggleHiddenGroup);
  const isolatedPartIndex = useEditorStore((s) => s.isolatedPartIndex);
  const toggleIsolatePart = useEditorStore((s) => s.toggleIsolatePart);
  const localModel = useEditorStore((s) => s.localModel);

  const group = report?.groups.find((g) => g.index === index);
  if (!group) return <p className="text-xs text-muted-foreground">{t("editor.parts.empty")}</p>;

  const visible = !hidden.includes(index);
  const isolating = isolatedPartIndex === index;
  const total = report?.totalFaces ?? 0;
  const share = total > 0 ? Math.round((group.faces / total) * 100) : 0;

  return (
    <div className="space-y-2" data-testid="part-properties" data-index={index} data-visible={visible}>
      <dl className="space-y-1 text-[11px]">
        <div className="flex items-baseline justify-between gap-2">
          <dt className="uppercase tracking-[0.12em] text-muted-foreground">{t("editor.parts.name")}</dt>
          <dd className="min-w-0 truncate text-foreground" data-testid="part-properties-name">
            {group.name}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="uppercase tracking-[0.12em] text-muted-foreground">{t("editor.parts.faces")}</dt>
          <dd className="text-foreground" data-testid="part-properties-faces" data-faces={group.faces} data-share={share}>
            {t("editor.parts.faceShare", { count: group.faces, percent: share })}
          </dd>
        </div>
      </dl>
      {!!group.materials?.length && report?.hasSourceAppearance && (
        <div className="space-y-1 text-xs" data-testid="part-source-materials">
          {group.materials.map((material, position) => (
            <div key={position} className="flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 border border-border" style={{ backgroundColor: material.colour, opacity: material.opacity }} />
              <span className="truncate">{material.name || material.colour}{material.textured ? ` · ${t("editor.panel.texture")}` : ""}</span>
            </div>
          ))}
        </div>
      )}

      <CopyPartStyleButton index={index} />

      <button
        type="button"
        data-testid="part-properties-visibility"
        aria-pressed={visible}
        onClick={() => toggleHiddenGroup(index)}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 border px-2 py-1 text-[11px] tracking-[0.05em] transition-colors",
          visible ? "border-border text-foreground hover:border-foreground" : "border-foreground bg-foreground text-background",
        )}
      >
        {visible ? <Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> : <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} />}
        {t(visible ? "editor.parts.hideThis" : "editor.parts.showThis")}
      </button>

      <button
        type="button"
        data-testid="part-isolate"
        aria-pressed={isolating}
        onClick={() => toggleIsolatePart(index)}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 border px-2 py-1 text-[11px] tracking-[0.05em] transition-colors",
          isolating ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:border-foreground",
        )}
      >
        <Focus className="h-3.5 w-3.5" strokeWidth={1.5} />
        {t(isolating ? "editor.parts.showAll" : "editor.parts.isolate")}
      </button>

      {(localModel || report?.hasSourceAppearance) && (
        <div className="space-y-2 border-t border-border pt-2" data-testid="part-appearance" data-index={index}>
          <AppearanceControl
            ownerId={`part-${index}`}
            appearance={appearance}
            modes={["part", "plated", "paint"]}
            onChange={changeAppearance}
          />
          <div className="flex flex-wrap gap-2" aria-label={t("editor.panel.colour")}>
            {getLocalModelColours(language).map((colour) => (
              <button
                key={colour.id}
                type="button"
                data-testid="part-colour-swatch"
                title={colour.name}
                aria-pressed={appearance.mode === "paint" && appearance.custom?.hex === colour.hex}
                onClick={() => changeAppearance({ mode: "paint", finish_id: null, custom: { hex: colour.hex!, pantone: null } })}
                className={`h-7 w-7 border ${appearance.custom?.hex === colour.hex ? "border-foreground" : "border-border"}`}
                style={{ backgroundColor: colour.hex ?? undefined }}
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground" data-testid="part-properties-zones" data-count={covering.length}>
        {covering.length > 0 ? t("editor.parts.inZones", { names: covering.map((zone) => zone.name).join(", ") }) : t("editor.parts.noZones")}
      </p>
    </div>
  );
}
