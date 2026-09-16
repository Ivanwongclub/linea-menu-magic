import { useRef, type DragEvent } from "react";
import { toast } from "sonner";
import { Box, Loader2, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { describeSupabaseError } from "@/components/admin/shared/supabaseError";
import { useProductModel } from "@/features/admin/hooks/useProductModel";

/**
 * "3D model (.obj)" upload — one file, immediate write, following
 * ProductImagesEditor's pattern (storage object first, then the row).
 * The editor (src/features/editor/**) loads from `model_storage_path`; a
 * product with none shows an empty state there, never a demo mesh.
 */
export function ProductModelEditor({ productId, modelStoragePath }: { productId: string; modelStoragePath: string | null }) {
  const { upload, remove } = useProductModel(productId);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = upload.isPending || remove.isPending;

  const onError = (error: unknown) => toast.error(describeSupabaseError(error as { message: string; code?: string }));

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".obj")) {
      toast.error(`${file.name}: only .obj files are accepted`);
      return;
    }
    upload.mutate(
      { file, previousPath: modelStoragePath },
      {
        onSuccess: () => toast.success("3D model uploaded"),
        onError,
      },
    );
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  return (
    <div className="space-y-4" data-testid="model-section">
      {modelStoragePath ? (
        <div className="flex items-center justify-between border border-border p-3" data-testid="model-current">
          <div className="flex items-center gap-2 min-w-0">
            <Box className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <span className="text-sm text-foreground truncate font-mono">{modelStoragePath.split("/").pop()}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={busy} onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              aria-label="Remove 3D model"
              disabled={busy}
              onClick={() =>
                remove.mutate(modelStoragePath, {
                  onSuccess: () => toast.success("3D model removed"),
                  onError,
                })
              }
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          data-testid="model-dropzone"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={cn("border border-dashed p-6 text-center cursor-pointer transition-colors border-border hover:border-foreground/50")}
        >
          {upload.isPending ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
            </div>
          ) : (
            <div className="space-y-1">
              <UploadCloud className="w-5 h-5 mx-auto text-muted-foreground" strokeWidth={1.5} />
              <p className="text-sm text-foreground">Drop a .obj file, or click to choose</p>
            </div>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        data-testid="model-input"
        type="file"
        accept=".obj"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </div>
  );
}
