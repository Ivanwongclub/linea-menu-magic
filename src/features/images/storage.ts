import { supabase } from "@/integrations/supabase/client";

export const PRODUCT_ASSETS_BUCKET = "product-assets";

/**
 * The storage object path behind a public (or render/image) URL in our
 * bucket, or null if the URL points somewhere else (an external swatch URL,
 * a bundled asset). Only paths we own are ever deleted.
 */
export function storagePathFromPublicUrl(url: string, bucket = PRODUCT_ASSETS_BUCKET): string | null {
  for (const marker of [`/storage/v1/object/public/${bucket}/`, `/storage/v1/render/image/public/${bucket}/`]) {
    const i = url.indexOf(marker);
    if (i !== -1) return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
  }
  return null;
}

export async function uploadToBucket(path: string, blob: Blob, contentType: string, bucket = PRODUCT_ASSETS_BUCKET): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Resolves to true if an object was actually removed, false if it was already gone. */
export async function removeFromBucket(path: string, bucket = PRODUCT_ASSETS_BUCKET): Promise<boolean> {
  const { data, error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
  return (data ?? []).length > 0;
}
