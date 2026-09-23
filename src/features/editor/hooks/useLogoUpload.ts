import { useRef, useState, type ChangeEvent } from "react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useAuth } from "@/features/auth/AuthProvider";
import { useEditorStore } from "../store/useEditorStore";
import { newLogoLayer, type Layer } from "../lib/recipe";
import { MAX_LOGO_BYTES, asRejection, rejectionMessage, validateLogoSvg, validateRasterLogo } from "../lib/logoSvg";
import { parseLogoSvg } from "../lib/logoGeometry";
import { isRasterMime, uploadLogoAsset } from "./useLogoAssets";
import { useDesignerStaffStatus } from "./useDesignerStaffStatus";

/** A raster file as a data URL: what the draft holds and what the texture loads. */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

/** The artwork's own width / height, so the layer keeps its proportions. */
function rasterAspect(dataUrl: string): Promise<number | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth > 0 && image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : null);
    image.onerror = () => resolve(null);
    image.src = dataUrl;
  });
}

/** A raster layer is printed from the start (6a R2): flat, in the ink colour. */
function printedLayer<T extends Layer>(layer: T): T {
  return { ...layer, relief: { ...layer.relief!, type: "printed" }, appearance: { mode: "printed", finish_id: null, custom: null } };
}

/**
 * Add logo (4k R1/R2, 6a R2, 6b R9), extracted from `BrandingGroup` in E2 U2.
 * An SVG is validated as text before anything is stored — ≤ 200 KB, outlines
 * only, every path closed — then parsed for its aspect. A PNG or JPEG (≤ 2 MB)
 * is accepted too, for printing only: there is no outline to extrude, so the
 * layer lands printed, and it needs an account, because an anonymous draft
 * cannot carry the file. Signed in, the file uploads to `design-uploads` and
 * becomes a `design_assets` row.
 */
export function useLogoUpload({ faceDiameterMm, minDepthMm }: { faceDiameterMm: number; minDepthMm: number | null }) {
  const { t } = useI18n();
  const { user, primaryBrand } = useAuth();
  const { isStaff } = useDesignerStaffStatus();
  const addLayer = useEditorStore((s) => s.addLayer);
  const fileInput = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onLogoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setLogoError(null);
    setUploading(true);
    const reject = (rejection: Parameters<typeof rejectionMessage>[0]) => {
      const { key, vars } = rejectionMessage(rejection);
      setLogoError(t(key, vars));
    };
    try {
      const raster = isRasterMime(file.type);
      const layerId = crypto.randomUUID();
      const brandId = isStaff ? null : primaryBrand?.id ?? null;

      if (raster) {
        if (!user) {
          setLogoError(t("editor.branding.logoSignInForImages"));
          return;
        }
        const rejection = asRejection(validateRasterLogo(file.type, file.size));
        if (rejection) return reject(rejection);
        const dataUrl = await readAsDataUrl(file);
        const aspect = await rasterAspect(dataUrl);
        if (!aspect) return reject({ reason: "empty" });
        const layer = printedLayer(newLogoLayer(layerId, faceDiameterMm, aspect, null, minDepthMm));
        const assetId = await uploadLogoAsset({ raster: dataUrl, mimeType: file.type, filename: file.name, ownerId: user.id, brandId });
        addLayer({ ...layer, content: { ...layer.content, asset_id: assetId } });
        return;
      }

      if (file.size > MAX_LOGO_BYTES) return reject({ reason: "tooLarge", limitKb: MAX_LOGO_BYTES / 1024 });
      const svg = await file.text();
      const rejection = asRejection(validateLogoSvg(svg, file.size));
      if (rejection) return reject(rejection);
      const artwork = parseLogoSvg(svg);
      if (!artwork) return reject({ reason: "empty" });
      if (user) {
        const assetId = await uploadLogoAsset({ svg, mimeType: "image/svg+xml", filename: file.name, ownerId: user.id, brandId });
        addLayer(newLogoLayer(layerId, faceDiameterMm, artwork.aspect, assetId, minDepthMm));
      } else {
        addLayer(newLogoLayer(layerId, faceDiameterMm, artwork.aspect, null, minDepthMm), { filename: file.name, svg, mimeType: "image/svg+xml" });
      }
    } catch (error) {
      setLogoError(t("editor.branding.logoFailed", { reason: String((error as Error)?.message ?? error) }));
    } finally {
      setUploading(false);
    }
  };

  return { fileInput, logoError, uploading, onLogoFile, signedIn: !!user };
}
