import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/AuthProvider";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useDesignVersions, useSaveVersion, fetchVersionRecipe, type DesignVersionRow } from "../../hooks/useDesignVersions";
import { buildSnapshot } from "../../lib/versionSnapshot";
import { useEditorStore } from "../../store/useEditorStore";
import type { PickerFinish } from "../../hooks/useFinishOptions";
import type { EditorColour, EditorProduct, EditorSizeVariant } from "../../hooks/useEditorProduct";

interface VersionsSectionProps {
  designId: string;
  product: EditorProduct;
  finish: PickerFinish | null;
  sizeVariant: EditorSizeVariant | null;
  colour: EditorColour | null;
}

/**
 * Named saves, inside the Output dock U8 built (E2 §5) rather than a panel of
 * their own — the dock is already the buyer's anchor for "is my work safe",
 * and versions are the answer to it.
 *
 * Saving freezes the recipe *and* a snapshot of everything it points at
 * (Phase 1 R2); reloading puts the stored recipe back as the working draft,
 * as one undoable edit. Versions are immutable — Phase 1 grants insert and
 * select only — so there is no rename and no delete here, by design.
 */
export function VersionsSection({ designId, product, finish, sizeVariant, colour }: VersionsSectionProps) {
  const { t } = useI18n();
  const { session } = useAuth();
  const recipe = useEditorStore((s) => s.recipe);
  const loadRecipe = useEditorStore((s) => s.loadRecipe);

  const { data, isLoading } = useDesignVersions(designId);
  const saveVersion = useSaveVersion(designId, session?.user?.id ?? null);

  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  /** The version the working draft last came from — saved or reloaded. */
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [reloadingId, setReloadingId] = useState<string | null>(null);

  const versions = data?.versions ?? [];

  const onSave = async () => {
    setError(null);
    try {
      const row = await saveVersion.mutateAsync({
        label,
        recipe,
        snapshot: buildSnapshot({ product, finish, sizeVariant, colour, savedAt: new Date().toISOString() }),
      });
      setLabel("");
      setLoadedId(row.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const onReload = async (version: DesignVersionRow) => {
    setError(null);
    setReloadingId(version.id);
    try {
      loadRecipe(await fetchVersionRecipe(version.id));
      setLoadedId(version.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setReloadingId(null);
    }
  };

  const nameOf = (v: DesignVersionRow) => v.label || t("editor.versions.unnamed", { n: v.version_number });

  return (
    // `data-loading` so a read-back waits for the list rather than racing the
    // first fetch: an empty list and a list not yet read look the same.
    <div className="space-y-3" data-testid="versions-section" data-count={versions.length} data-loading={isLoading ? "true" : "false"}>
      <div className="flex gap-2">
        <Input
          data-testid="version-label-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t("editor.versions.labelPlaceholder")}
          className="h-8 rounded-none text-xs"
        />
        <Button
          data-testid="version-save"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 rounded-none text-xs tracking-[0.05em]"
          disabled={saveVersion.isPending}
          onClick={onSave}
        >
          {saveVersion.isPending ? t("editor.versions.saving") : t("editor.versions.save")}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive" data-testid="version-error">
          {t("editor.versions.saveFailed")}
        </p>
      )}

      {isLoading ? null : versions.length === 0 ? (
        <p className="text-xs text-muted-foreground" data-testid="version-empty">
          {t("editor.versions.empty")}
        </p>
      ) : (
        <ul className="space-y-1" data-testid="version-list">
          {versions.map((v) => (
            <li
              key={v.id}
              data-testid="version-row"
              data-version-id={v.id}
              data-version-number={v.version_number}
              data-current={data?.currentVersionId === v.id ? "true" : "false"}
              data-loaded={loadedId === v.id ? "true" : "false"}
              className="flex items-center gap-2 border border-border px-2 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-foreground" data-testid="version-name">
                  {nameOf(v)}
                </p>
                <p className="text-[11px] text-muted-foreground">{new Date(v.created_at).toLocaleString()}</p>
              </div>
              <Button
                data-testid="version-reload"
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 rounded-none px-2 text-[11px]"
                disabled={reloadingId === v.id}
                onClick={() => onReload(v)}
              >
                <RotateCcw className="mr-1 h-3 w-3" strokeWidth={1.5} />
                {t("editor.versions.reload")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
