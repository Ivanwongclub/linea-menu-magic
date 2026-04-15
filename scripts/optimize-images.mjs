#!/usr/bin/env node
/**
 * Build-time image optimisation script.
 *
 * Usage:  node scripts/optimize-images.mjs
 *
 * Scans src/assets and public/ for raster images, generates AVIF + WebP + JPEG
 * variants at multiple widths, keeps only outputs that are smaller than the
 * original, and writes a JSON manifest consumed at runtime by <OptimizedImage>.
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

// ── Config ──────────────────────────────────────────────
const WIDTHS = [480, 1200];
const FORMATS = /** @type {const} */ ([
  { ext: "webp", opts: { quality: 68 } },
  { ext: "jpg", opts: { quality: 72, mozjpeg: true } },
]);

const SRC_DIRS = ["src/assets", "public"];
const OUT_DIR = "public/optimized";
const MANIFEST_PATH = "src/image-manifest.json";
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const SKIP_DIRS = new Set(["optimized", "models", "brochure-pages"]);

// ── Helpers ─────────────────────────────────────────────

/** Recursively collect image file paths. */
function collectImages(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectImages(path.join(dir, entry.name), results);
    } else if (IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function prettyBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/** Derive a stable key from the source path (used as manifest key & output subfolder). */
function imageKey(srcPath) {
  // Normalise both src/assets/foo.jpg and public/foo.jpg to a flat key
  return srcPath
    .replace(/^src\/assets\//, "assets/")
    .replace(/^public\//, "")
    .replace(/\\/g, "/");
}

// ── Main ────────────────────────────────────────────────

async function run() {
  const files = SRC_DIRS.flatMap((d) => collectImages(d));
  if (files.length === 0) {
    console.log("No images found — nothing to do.");
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  /** @type {Record<string, { original: number; variants: { width: number; format: string; path: string; size: number }[] }>} */
  const manifest = {};

  let totalOriginal = 0;
  let totalOptimized = 0;
  let totalSkipped = 0;
  const perFileReport = [];

  for (const srcPath of files) {
    const key = imageKey(srcPath);
    const originalBytes = fs.statSync(srcPath).size;
    totalOriginal += originalBytes;

    const img = sharp(srcPath).rotate(); // auto-rotate based on EXIF
    const meta = await img.metadata();
    const origWidth = meta.width ?? 1600;

    const variants = [];
    let bestSaving = 0;

    for (const w of WIDTHS) {
      if (w > origWidth * 1.1) continue; // skip upscaling

      for (const fmt of FORMATS) {
        const outName = `${key.replace(/\.[^.]+$/, "")}-${w}.${fmt.ext}`.replace(/\//g, "__");
        const outPath = path.join(OUT_DIR, outName);

        try {
          let pipeline = sharp(srcPath).rotate().resize(w, undefined, { fit: "inside", withoutEnlargement: true });

          if (fmt.ext === "avif") pipeline = pipeline.avif(fmt.opts);
          else if (fmt.ext === "webp") pipeline = pipeline.webp(fmt.opts);
          else pipeline = pipeline.jpeg(fmt.opts);

          const buf = await pipeline.toBuffer();

          if (buf.length < originalBytes) {
            fs.writeFileSync(outPath, buf);
            const saving = ((1 - buf.length / originalBytes) * 100).toFixed(1);
            variants.push({
              width: w,
              format: fmt.ext,
              path: `/optimized/${outName}`,
              size: buf.length,
            });
            bestSaving = Math.max(bestSaving, parseFloat(saving));
            totalOptimized += buf.length;
          } else {
            totalSkipped++;
          }
        } catch {
          // skip problematic format/size combos silently
        }
      }
    }

    if (variants.length > 0) {
      manifest[key] = { original: originalBytes, variants };
      perFileReport.push({ key, originalBytes, variants: variants.length, bestSaving });
    } else {
      // No variant was smaller — record with empty variants so component knows to use original
      manifest[key] = { original: originalBytes, variants: [] };
      perFileReport.push({ key, originalBytes, variants: 0, bestSaving: 0 });
      totalOptimized += originalBytes; // count original size
    }
  }

  // Write manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  // ── Report ──────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║         IMAGE OPTIMISATION REPORT                ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  const improved = perFileReport.filter((r) => r.variants > 0);
  const skipped = perFileReport.filter((r) => r.variants === 0);

  if (improved.length > 0) {
    console.log(`✅ Improved (${improved.length} files):`);
    for (const r of improved) {
      console.log(`   ${r.key}  ${prettyBytes(r.originalBytes)} → ${r.variants} variants (up to ${r.bestSaving}% smaller)`);
    }
  }

  if (skipped.length > 0) {
    console.log(`\n⏭  Skipped — no variant was smaller (${skipped.length} files):`);
    for (const r of skipped) {
      console.log(`   ${r.key}  ${prettyBytes(r.originalBytes)}`);
    }
  }

  const totalSaved = totalOriginal - totalOptimized;
  const pctSaved = totalOriginal > 0 ? ((totalSaved / totalOriginal) * 100).toFixed(1) : "0";

  console.log("\n─── Summary ───");
  console.log(`  Source files:     ${files.length}`);
  console.log(`  Original total:   ${prettyBytes(totalOriginal)}`);
  console.log(`  Optimized total:  ${prettyBytes(totalOptimized)}`);
  console.log(`  Saved:            ${prettyBytes(totalSaved)} (${pctSaved}%)`);
  console.log(`  Skipped outputs:  ${totalSkipped} (larger than original)`);
  console.log(`  Manifest:         ${MANIFEST_PATH}\n`);
}

run().catch((err) => {
  console.error("Image optimisation failed:", err);
  process.exit(1);
});
