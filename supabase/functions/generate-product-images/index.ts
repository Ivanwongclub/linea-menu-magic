import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORY_EXTRAS: Record<string, string> = {
  "Buttons": "Show the button face clearly. If shank-style, angle slightly to show the shank loop underneath.",
  "Snap Buttons": "Show all 4 components of the snap set — cap, socket, stud, post — slightly separated.",
  "Jeans Buttons": "Show the domed cap and the rivet post side by side. Antique brass or gunmetal finish.",
  "Shank Buttons": "Show the button face clearly, angle slightly to show the shank loop underneath.",
  "Eyelets": "Show 4–6 eyelets scattered naturally. Include at least one angled view showing the barrel depth.",
  "Buckles": "Angle the buckle to show frame depth and internal bar. Do not shoot flat-on.",
  "Zipper Pullers": "Show the tab hanging down. Angle 20° to show the engraved or cast face surface.",
  "Cord Ends": "Show 3 pieces in a natural cluster. Each piece showing the cord hole opening.",
  "Cord Stoppers": "Show 3 pieces in a natural cluster. Each piece showing the cord hole opening.",
  "Toggles": "Show 3 pieces in a natural cluster. Each piece showing the cord hole opening.",
  "Drawcords": "Show a short length loosely coiled or folded. Textile weave or braid texture must be clearly visible.",
  "Webbing": "Show a short length loosely coiled or folded. Textile weave or braid texture must be clearly visible.",
  "Badges": "Straight-on overhead view. Show the woven texture or embossed surface detail clearly.",
  "Patches": "Straight-on overhead view. Show the woven texture or embossed surface detail clearly.",
  "Rivets": "Show 5–6 rivets scattered. Include both cap-side and post-side views.",
  "Beads": "Show 8–10 beads in a natural loose pile. Render the material finish — glass, metal, or resin.",
  "Hook & Eyes": "Show the hook and the eye bar side by side as a matched pair. Nickel or brass finish.",
};

function buildImagePrompt(
  productName: string,
  categoryName: string,
  materials: string[],
): string {
  const matStr = materials.length > 0 ? materials.join(", ") : "metal";
  const subjectLine = `${productName} — a ${categoryName} fashion hardware trim made of ${matStr}. Single product or small cluster of 2–3 identical pieces`;
  const extra = CATEGORY_EXTRAS[categoryName] ?? "";
  return `Professional B2B product photography. ${subjectLine}. ${extra}
Pure white background, no props, no garments, no hands, no text overlays.
Soft diffused studio lighting from slightly above. Very faint drop shadow directly beneath the product.
Camera angle 15–20° above horizontal — not flat overhead, not pure side profile.
Product fills 65–75% of frame. Sharp focus on material surface texture.
Render metal finishes with accurate specular highlights: brass = warm golden sheen, nickel/silver = cool blue-white highlights, gunmetal = matte diffused highlights.
Square 1:1 format. Fashion hardware B2B catalogue style matching richbuttoncorp.com product photography.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let productId: string | undefined;
    let batchSize = 10;
    let offset = 0;
    try {
      const body = await req.json();
      productId = body?.productId;
      if (body?.batchSize) batchSize = Math.min(Number(body.batchSize), 20);
      if (body?.offset) offset = Number(body.offset);
    } catch {
      // No body = process all
    }

    // Count total remaining first (for non-single-product requests)
    let totalRemaining = 0;
    if (!productId) {
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .is("thumbnail_url", null);
      totalRemaining = count ?? 0;
    }

    // Fetch products that need images
    let query = supabase
      .from("products")
      .select(`
        id, name, name_en, item_code, slug,
        thumbnail_url,
        product_category_map(
          is_primary,
          product_categories(name)
        ),
        product_material_map(
          product_materials(name)
        )
      `);

    if (productId) {
      query = query.eq("id", productId);
    } else {
      query = query.is("thumbnail_url", null).range(offset, offset + batchSize - 1);
    }

    const { data: products, error: fetchError } = await query;
    if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);
    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, failed: 0, remaining: 0, results: [], message: "No products need images" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: Array<{ productId: string; productName: string; url?: string; thumbUrl?: string; status: string; error?: string }> = [];
    let processed = 0;
    let failed = 0;

    for (const product of products) {
      const productName = (product as any).name_en ?? (product as any).name;
      const pid = (product as any).id as string;

      try {
        // Extract category name
        const catMaps = ((product as any).product_category_map ?? []) as any[];
        const primaryCat = catMaps.find((m: any) => m.is_primary);
        const catName =
          primaryCat?.product_categories?.name ??
          catMaps[0]?.product_categories?.name ??
          "fashion trim";

        // Extract material names
        const matMaps = ((product as any).product_material_map ?? []) as any[];
        const materials = matMaps
          .map((m: any) => m.product_materials?.name)
          .filter(Boolean) as string[];

        const prompt = buildImagePrompt(productName, catName, materials);

        // Call Lovable AI image generation with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const aiResponse = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
            }),
            signal: controller.signal,
          },
        );

        clearTimeout(timeout);

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          throw new Error(`AI API error ${aiResponse.status}: ${errText}`);
        }

        const aiData = await aiResponse.json();
        const imageDataUrl =
          aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageDataUrl) {
          throw new Error("No image returned from AI");
        }

        // Convert base64 data URL to Uint8Array
        const base64 = imageDataUrl.split(",")[1];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Force JPEG content type for all uploads
        const contentType = "image/jpeg";

        // Upload primary image as ai-primary.jpg
        const primaryPath = `images/${pid}/ai-primary.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("product-assets")
          .upload(primaryPath, bytes, {
            contentType,
            cacheControl: "31536000",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Upload error: ${uploadError.message}`);
        }

        // Upload same image as ai-thumb.jpg (Supabase transform API will serve it at correct size)
        const thumbPath = `images/${pid}/ai-thumb.jpg`;
        await supabase.storage
          .from("product-assets")
          .upload(thumbPath, bytes, {
            contentType,
            cacheControl: "31536000",
            upsert: true,
          });

        // Get public URLs
        const { data: primaryUrlData } = supabase.storage
          .from("product-assets")
          .getPublicUrl(primaryPath);
        const primaryUrl = primaryUrlData.publicUrl;

        const { data: thumbUrlData } = supabase.storage
          .from("product-assets")
          .getPublicUrl(thumbPath);
        const thumbUrl = thumbUrlData.publicUrl;

        // Update thumbnail_url on product to point to the thumb version
        await supabase
          .from("products")
          .update({ thumbnail_url: thumbUrl })
          .eq("id", pid);

        // Insert/update product_images with primary (full-size) URL
        const { error: imgError } = await supabase.from("product_images").insert({
          product_id: pid,
          url: primaryUrl,
          sort_order: 0,
          is_primary: true,
          alt_text: `${productName} — product image`,
        });
        if (imgError && !imgError.message.includes("duplicate")) {
          console.warn(`product_images insert warning for ${pid}:`, imgError.message);
        }

        results.push({ productId: pid, productName, url: primaryUrl, thumbUrl, status: "success" });
        processed++;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`Failed for product ${pid} (${productName}):`, errMsg);
        results.push({ productId: pid, productName, status: "failed", error: errMsg });
        failed++;
      }

      // Delay between products to avoid rate limiting
      if (products.length > 1) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    const remaining = productId ? 0 : Math.max(0, totalRemaining - processed);
    return new Response(
      JSON.stringify({ success: true, processed, failed, total: products.length, remaining, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("generate-product-images error:", errMsg);
    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
