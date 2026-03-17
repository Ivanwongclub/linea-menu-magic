import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildImagePrompt(
  productName: string,
  categoryName: string,
  materials: string[],
): string {
  const matStr = materials.length > 0 ? materials.join(", ") : "metal";
  return `Professional product photography of ${productName}, a ${categoryName} fashion trim accessory made of ${matStr}. Close-up shot on pure white background, studio lighting, high detail, fashion industry catalog style, no text, no people, product centered, sharp focus`;
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

    const results: Array<{ productId: string; productName: string; url?: string; status: string; error?: string }> = [];
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

        // Determine content type from data URL
        const mimeMatch = imageDataUrl.match(/^data:(image\/\w+);/);
        const contentType = mimeMatch?.[1] ?? "image/png";
        const ext = contentType === "image/jpeg" ? "jpg" : "png";

        // Upload to Supabase Storage
        const storagePath = `images/${pid}/ai-primary.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-assets")
          .upload(storagePath, bytes, {
            contentType,
            cacheControl: "31536000",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Upload error: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("product-assets")
          .getPublicUrl(storagePath);
        const publicUrl = urlData.publicUrl;

        // Update thumbnail_url on product
        await supabase
          .from("products")
          .update({ thumbnail_url: publicUrl })
          .eq("id", pid);

        // Insert into product_images
        const { error: imgError } = await supabase.from("product_images").insert({
          product_id: pid,
          url: publicUrl,
          sort_order: 0,
          is_primary: true,
          alt_text: `${productName} — product image`,
        });
        if (imgError && !imgError.message.includes("duplicate")) {
          console.warn(`product_images insert warning for ${pid}:`, imgError.message);
        }

        results.push({ productId: pid, productName, url: publicUrl, status: "success" });
        processed++;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`Failed for product ${pid} (${productName}):`, errMsg);
        results.push({ productId: pid, productName, status: "failed", error: errMsg });
        failed++;
      }

      // Delay between products to avoid rate limiting
      if (products.length > 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed, failed, total: products.length, results }),
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
