import { supabase } from "@/integrations/supabase/client";

/**
 * Upload an image to the flipbook-assets bucket.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFlipbookImage(
  file: File,
  brochureId: string,
  fileName: string
): Promise<string> {
  const path = `${brochureId}/${fileName}`;

  const { error } = await supabase.storage
    .from("flipbook-assets")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("flipbook-assets").getPublicUrl(path);

  return publicUrl;
}

/**
 * Convert each page of a PDF file into a JPEG Blob using pdfjs-dist.
 * Calls `onProgress(currentPage, totalPages)` after each page is rendered.
 */
export async function convertPdfToImages(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<Blob[]> {
  const pdfjsLib = await import("pdfjs-dist");

  // Use the bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const blobs: Blob[] = [];

  const scale = 2; // render at 2× for crisp output

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
        "image/jpeg",
        0.85
      );
    });

    blobs.push(blob);
    onProgress?.(i, totalPages);
  }

  return blobs;
}
