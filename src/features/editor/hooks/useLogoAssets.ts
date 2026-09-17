import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEditorStore } from "../store/useEditorStore";
import { isLogoLayer, type Layer } from "../lib/recipe";

/** The private bucket from Phase 1 R6; the first path segment is the brand id or the owner's uid. */
export const LOGO_BUCKET = "design-uploads";

export interface PendingLogo {
  filename: string;
  svg: string;
}

/** SVG text by `design_assets.id`, downloaded once per session. */
const assetCache = new Map<string, string>();
/** Assets deleted in this session, kept so an undo can put them back (4k R4). */
const deleted = new Map<string, { path: string; filename: string | null; svg: string; brandId: string | null; ownerId: string }>();

export function logoStoragePath(scopeId: string, assetId: string): string {
  return `${scopeId}/logos/${assetId}.svg`;
}

/**
 * Uploads one SVG and records it: the storage object under the path rule
 * (brand id, else the owner's uid) and a `design_assets` row of kind
 * `logo_svg`. Returns the asset id the layer stores.
 */
export async function uploadLogoAsset({
  svg,
  filename,
  ownerId,
  brandId,
}: {
  svg: string;
  filename: string;
  ownerId: string;
  brandId: string | null;
}): Promise<string> {
  const assetId = crypto.randomUUID();
  const path = logoStoragePath(brandId ?? ownerId, assetId);
  const body = new Blob([svg], { type: "image/svg+xml" });
  const uploaded = await supabase.storage.from(LOGO_BUCKET).upload(path, body, { upsert: true, contentType: "image/svg+xml" });
  if (uploaded.error) throw new Error(uploaded.error.message);
  const inserted = await supabase.from("design_assets").insert({
    id: assetId,
    owner_id: ownerId,
    brand_id: brandId,
    kind: "logo_svg",
    storage_path: path,
    original_filename: filename,
    mime_type: "image/svg+xml",
    size_bytes: body.size,
  });
  if (inserted.error) {
    await supabase.storage.from(LOGO_BUCKET).remove([path]);
    throw new Error(inserted.error.message);
  }
  assetCache.set(assetId, svg);
  return assetId;
}

/** Deleting a logo layer takes its asset with it (R7); the file is kept in memory so an undo can restore it. */
export async function deleteLogoAsset(assetId: string): Promise<void> {
  const { data } = await supabase.from("design_assets").select("storage_path, original_filename, brand_id, owner_id").eq("id", assetId).maybeSingle();
  if (!data) return;
  const svg = assetCache.get(assetId) ?? (await downloadLogo(data.storage_path));
  if (svg) deleted.set(assetId, { path: data.storage_path, filename: data.original_filename, svg, brandId: data.brand_id, ownerId: data.owner_id });
  await supabase.from("design_assets").delete().eq("id", assetId);
  await supabase.storage.from(LOGO_BUCKET).remove([data.storage_path]);
}

async function downloadLogo(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(LOGO_BUCKET).download(path);
  if (error || !data) return null;
  return data.text();
}

/** Puts a deleted asset back under its own id, so an undone delete needs no recipe change. */
async function restoreLogoAsset(assetId: string): Promise<void> {
  const record = deleted.get(assetId);
  if (!record) return;
  deleted.delete(assetId);
  const body = new Blob([record.svg], { type: "image/svg+xml" });
  await supabase.storage.from(LOGO_BUCKET).upload(record.path, body, { upsert: true, contentType: "image/svg+xml" });
  await supabase.from("design_assets").insert({
    id: assetId,
    owner_id: record.ownerId,
    brand_id: record.brandId,
    kind: "logo_svg",
    storage_path: record.path,
    original_filename: record.filename,
    mime_type: "image/svg+xml",
    size_bytes: body.size,
  });
  assetCache.set(assetId, record.svg);
}

/**
 * The SVG behind every logo layer, by layer id: an anonymous draft's pending
 * file, or the uploaded asset downloaded from the private bucket. Also puts
 * an asset back when an undo brings its layer with it.
 */
export function useLogoSources(layers: Layer[]): Record<string, string> {
  const pending = useEditorStore((s) => s.pendingLogos);
  const [fetched, setFetched] = useState<Record<string, string>>({});

  const logoLayers = useMemo(() => layers.filter(isLogoLayer), [layers]);
  const assetIds = logoLayers
    .map((l) => l.content.asset_id)
    .filter((id): id is string => !!id)
    .sort()
    .join(",");

  useEffect(() => {
    const ids = assetIds ? assetIds.split(",") : [];
    const missing = ids.filter((id) => !assetCache.has(id));
    let live = true;
    const load = async () => {
      for (const id of ids.filter((i) => deleted.has(i))) await restoreLogoAsset(id);
      if (missing.length) {
        const { data } = await supabase.from("design_assets").select("id, storage_path").in("id", missing);
        for (const row of data ?? []) {
          const svg = await downloadLogo(row.storage_path);
          if (svg) assetCache.set(row.id, svg);
        }
      }
      if (live) setFetched(Object.fromEntries(ids.filter((id) => assetCache.has(id)).map((id) => [id, assetCache.get(id) as string])));
    };
    void load();
    return () => {
      live = false;
    };
  }, [assetIds]);

  return useMemo(() => {
    const sources: Record<string, string> = {};
    for (const layer of logoLayers) {
      const fromAsset = layer.content.asset_id ? fetched[layer.content.asset_id] ?? assetCache.get(layer.content.asset_id) : undefined;
      const source = fromAsset ?? pending[layer.id]?.svg;
      if (source) sources[layer.id] = source;
    }
    return sources;
  }, [logoLayers, fetched, pending]);
}
