/**
 * Client-side resize before upload.
 *
 * `sharp` exists in this repo only for the build-time asset script; it is a
 * native Node module and cannot run in the browser, and this app has no
 * server. So uploads are resized here, before they leave the editor's
 * machine — which is also where a 6 MB phone photo should shrink.
 *
 * Master: 1600 px on the long edge, JPEG quality 0.85 — deliberately not
 * smaller. Buyers examine surface texture on trims, and M5's lightbox zoom
 * needs the pixels. Sizes below that are served by Supabase's render/image
 * transform from this one master (see getProductImageUrl).
 *
 * `imageOrientation: "from-image"` matters: phone photos carry EXIF
 * rotation, and a canvas resize without it silently produces sideways
 * images.
 */

export const MASTER_MAX_EDGE = 1600;
export const JPEG_QUALITY = 0.85;

export interface ResizedImage {
  blob: Blob;
  width: number;
  height: number;
  contentType: "image/jpeg" | "image/png";
  ext: "jpg" | "png";
}

function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  // Sample rather than scan every pixel: ~4,000 samples is plenty to catch a cut-out.
  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 4000)));
  const data = ctx.getImageData(0, 0, width, height).data;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (data[(y * width + x) * 4 + 3] < 255) return true;
    }
  }
  return false;
}

export async function resizeImage(file: File): Promise<ResizedImage> {
  if (!file.type.startsWith("image/")) throw new Error("not-an-image");

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, MASTER_MAX_EDGE / Math.max(bitmap.width, bitmap.height)); // never upscale
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas-unavailable");
    ctx.drawImage(bitmap, 0, 0, width, height);

    // Photos become JPEG; a PNG with real transparency (a cut-out) stays PNG.
    const keepPng = file.type === "image/png" && hasTransparency(ctx, width, height);
    const contentType = keepPng ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode-failed"))), contentType, keepPng ? undefined : JPEG_QUALITY),
    );
    return { blob, width, height, contentType, ext: keepPng ? "png" : "jpg" };
  } finally {
    bitmap.close();
  }
}
