import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEditorStore } from "../store/useEditorStore";
import { isLogoLayer, type Layer } from "../lib/recipe";

/** The private bucket from Phase 1 R6; the first path segment is the brand id or the owner's uid. */
export const LOGO_BUCKET = "design-uploads";

export interface PendingLogo {
  filename: string;
  /** SVG text, or a data URL for a raster artwork (Phase 6a R2). */
  svg?: string;
  raster?: string;
  mimeType: string;
}

/**
 * What a logo layer draws from (Phase 6a R2): outlines the editor can extrude
 * and carve, or a raster the editor can only print.
 */
export type LogoSource = { kind: "svg"; svg: string } | { kind: "raster"; url: string };

export const isRasterMime = (mime: string): boolean => mime === "image/png" || mime === "image/jpeg";

/** Artwork by `design_assets.id`, downloaded once per session: SVG text, or a raster's data URL. */
const assetCache = new Map<string, LogoSource>();
/** Assets deleted in this session, kept so an undo can put them back (4k R4). */
const deleted = new Map<string, { path: string; filename: string | null; source: LogoSource; mimeType: string; brandId: string | null; ownerId: string }>();

const EXTENSION: Record<string, string> = { "image/svg+xml": "svg", "image/png": "png", "image/jpeg": "jpg" };

export function logoStoragePath(scopeId: string, assetId: string, mimeType = "image/svg+xml"): string {
  return `${scopeId}/logos/${assetId}.${EXTENSION[mimeType] ?? "bin"}`;
}

/**
 * The `design_assets.kind` a logo is stored under. A raster is a texture in
 * the schema's own vocabulary (Phase 1 R5's check constraint) — it renders as
 * one — so Phase 6a needs no migration to accept printed artwork.
 */
export const assetKind = (mimeType: string): "logo_svg" | "texture" => (isRasterMime(mimeType) ? "texture" : "logo_svg");

/** A data URL back to the bytes it carries, for upload. */
function dataUrlToBlob(dataUrl: string, mimeType: string): Blob {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

/**
 * Uploads one SVG and records it: the storage object under the path rule
 * (brand id, else the owner's uid) and a `design_assets` row of kind
 * `logo_svg`. Returns the asset id the layer stores.
 */
export async function uploadLogoAsset({
  svg,
  raster,
  mimeType = "image/svg+xml",
  filename,
  ownerId,
  brandId,
}: {
  /** SVG text, for a vector logo. */
  svg?: string;
  /** Data URL, for a raster one. */
  raster?: string;
  mimeType?: string;
  filename: string;
  ownerId: string;
  brandId: string | null;
}): Promise<string> {
  const assetId = crypto.randomUUID();
  const path = logoStoragePath(brandId ?? ownerId, assetId, mimeType);
  const body = raster ? dataUrlToBlob(raster, mimeType) : new Blob([svg ?? ""], { type: mimeType });
  const uploaded = await supabase.storage.from(LOGO_BUCKET).upload(path, body, { upsert: true, contentType: mimeType });
  if (uploaded.error) throw new Error(uploaded.error.message);
  const inserted = await supabase.from("design_assets").insert({
    id: assetId,
    owner_id: ownerId,
    brand_id: brandId,
    kind: assetKind(mimeType),
    storage_path: path,
    original_filename: filename,
    mime_type: mimeType,
    size_bytes: body.size,
  });
  if (inserted.error) {
    await supabase.storage.from(LOGO_BUCKET).remove([path]);
    throw new Error(inserted.error.message);
  }
  assetCache.set(assetId, raster ? { kind: "raster", url: raster } : { kind: "svg", svg: svg ?? "" });
  return assetId;
}

/** Deleting a logo layer takes its asset with it (R7); the file is kept in memory so an undo can restore it. */
export async function deleteLogoAsset(assetId: string): Promise<void> {
  const { data } = await supabase.from("design_assets").select("storage_path, original_filename, brand_id, owner_id, mime_type").eq("id", assetId).maybeSingle();
  if (!data) return;
  const mimeType = data.mime_type ?? "image/svg+xml";
  const source = assetCache.get(assetId) ?? (await downloadLogo(data.storage_path, mimeType));
  if (source) deleted.set(assetId, { path: data.storage_path, filename: data.original_filename, source, mimeType, brandId: data.brand_id, ownerId: data.owner_id });
  await supabase.from("design_assets").delete().eq("id", assetId);
  await supabase.storage.from(LOGO_BUCKET).remove([data.storage_path]);
}

async function downloadLogo(path: string, mimeType: string): Promise<LogoSource | null> {
  const { data, error } = await supabase.storage.from(LOGO_BUCKET).download(path);
  if (error || !data) return null;
  if (!isRasterMime(mimeType)) return { kind: "svg", svg: await data.text() };
  const buffer = await data.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return { kind: "raster", url: `data:${mimeType};base64,${btoa(binary)}` };
}

/** Puts a deleted asset back under its own id, so an undone delete needs no recipe change. */
async function restoreLogoAsset(assetId: string): Promise<void> {
  const record = deleted.get(assetId);
  if (!record) return;
  deleted.delete(assetId);
  const body = record.source.kind === "raster" ? dataUrlToBlob(record.source.url, record.mimeType) : new Blob([record.source.svg], { type: record.mimeType });
  await supabase.storage.from(LOGO_BUCKET).upload(record.path, body, { upsert: true, contentType: record.mimeType });
  await supabase.from("design_assets").insert({
    id: assetId,
    owner_id: record.ownerId,
    brand_id: record.brandId,
    kind: assetKind(record.mimeType),
    storage_path: record.path,
    original_filename: record.filename,
    mime_type: record.mimeType,
    size_bytes: body.size,
  });
  assetCache.set(assetId, record.source);
}

/**
 * The SVG behind every logo layer, by layer id: an anonymous draft's pending
 * file, or the uploaded asset downloaded from the private bucket. Also puts
 * an asset back when an undo brings its layer with it.
 */
export function useLogoSources(layers: Layer[]): Record<string, LogoSource> {
  const pending = useEditorStore((s) => s.pendingLogos);
  const [fetched, setFetched] = useState<Record<string, LogoSource>>({});

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
        const { data } = await supabase.from("design_assets").select("id, storage_path, mime_type").in("id", missing);
        for (const row of data ?? []) {
          const source = await downloadLogo(row.storage_path, row.mime_type ?? "image/svg+xml");
          if (source) assetCache.set(row.id, source);
        }
      }
      if (live) setFetched(Object.fromEntries(ids.filter((id) => assetCache.has(id)).map((id) => [id, assetCache.get(id) as LogoSource])));
    };
    void load();
    return () => {
      live = false;
    };
  }, [assetIds]);

  return useMemo(() => {
    const sources: Record<string, LogoSource> = {};
    for (const layer of logoLayers) {
      const fromAsset = layer.content.asset_id ? fetched[layer.content.asset_id] ?? assetCache.get(layer.content.asset_id) : undefined;
      const file = pending[layer.id];
      const fromDraft: LogoSource | undefined = file?.raster ? { kind: "raster", url: file.raster } : file?.svg ? { kind: "svg", svg: file.svg } : undefined;
      const source = fromAsset ?? fromDraft;
      if (source) sources[layer.id] = source;
    }
    return sources;
  }, [logoLayers, fetched, pending]);
}
