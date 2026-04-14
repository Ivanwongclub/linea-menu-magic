import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORY_EXTRAS: Record<string, string> = {
  "Buttons": "Scatter 5–6 shank buttons at varied angles. Show ornate engraved crest faces on most, flip 1–2 to reveal the shank loop underneath. Mix of sizes if possible.",
  "Snap Buttons": "Show all 4 components of 2 snap sets — caps, sockets, studs, posts — scattered naturally with small gaps. Silver/nickel finish.",
  "Jeans Buttons": "Scatter 4–5 jeans tack buttons — domed caps with geometric patterns and rivet posts shown separated. Antique brass and gunmetal finishes mixed.",
  "Shank Buttons": "Scatter 5–6 shank buttons at varied angles. Show ornate engraved faces on most, flip 1–2 to reveal the shank loop underneath.",
  "Eyelets": "Scatter 15–20 eyelets and grommets in assorted sizes and colors (include painted colors like red, blue, teal, pink alongside metal finishes). Show both round and oval/oblong shapes. Some face-up, some showing barrel depth.",
  "Buckles": "Show 3–4 buckles of different styles (rectangular frame, D-ring, slide). Angle each to show frame depth and internal bar. Mix of brass and nickel finishes.",
  "Zipper Pullers": "Show 5–6 different zipper pullers scattered naturally. Mix of ornate castings and minimalist rectangles. Tabs hanging down, varied angles showing engraved faces.",
  "Cord Ends": "Show 8–10 cord ends in different shapes and finishes (gold, gunmetal, silver). Scatter naturally with varied angles showing the cord hole openings.",
  "Cord Stoppers": "Show 8–10 cord stoppers/locks in different shapes (barrel, cube, sphere, flat disc) and finishes (gold, gunmetal, silver, one colored). Scatter naturally with varied angles.",
  "Toggles": "Show 6–8 toggles in different shapes and finishes. Scatter naturally showing cord hole openings and varied surface textures.",
  "Drawcords": "Show 2–3 short lengths of drawcord loosely coiled or folded. Mix of braided cotton and woven nylon. Textile weave and braid texture must be clearly visible.",
  "Webbing": "Show 2–3 short lengths of webbing in different widths, loosely folded. Textile weave pattern clearly visible. Mix of black and natural colors.",
  "Badges": "Show 4–5 woven badges scattered at varied angles. Straight-on and tilted views. Show the woven texture and embossed surface detail clearly.",
  "Patches": "Show 4–5 patches at varied angles. Mix of woven and embroidered styles. Show texture detail clearly.",
  "Rivets": "Show 10–12 rivets scattered naturally. Include both cap-side and post-side views. Mix of brass, nickel, and gunmetal finishes.",
  "Beads": "Show 15–20 beads in a natural loose pile. Mix of shapes (round, faceted, barrel) and finishes (metal, glass, resin). Varied sizes.",
  "Hook & Eyes": "Show 3–4 matched pairs of hooks and eye bars scattered naturally. Mix of nickel and brass finishes. Show both components clearly.",
};

function buildImagePrompt(
  productName: string,
  categoryName: string,
  materials: string[],
): string {
  const matStr = materials.length > 0 ? materials.join(", ") : "metal";
  const subjectLine = `${productName} — a ${categoryName} fashion hardware trim made of ${matStr}`;
  const extra = CATEGORY_EXTRAS[categoryName] ?? "";
  return `Professional product photography for a fashion hardware B2B catalogue.
${subjectLine}. ${extra}
Off-white studio background with a very slight warm tone.
Show 5–8 pieces of the same product scattered naturally across the frame at varied angles — some face-up showing the engraved or textured face, some tilted at 20–40° to show depth and side profile, and at least one flipped to show the back or shank/post.
Soft diffused overhead studio lighting creating gentle gradients across curved metal surfaces.
Each piece casts its own soft individual drop shadow.
Camera angle approximately 25–30° above the surface — elevated enough to show depth but not a flat overhead lay.
Products fill 70–80% of frame with natural spacing between pieces.
Extremely sharp focus on surface detail: engraving lines, casting texture, knurled edges, enamel fills, plating finish.
Metal rendering: polished gold = mirror-bright warm reflections, antique brass = warm matte with subtle patina, gunmetal = dark cool reflective, nickel/silver = bright cool specular, rose gold = warm pink-tinted reflections.
Square 1:1 format. Photorealistic. No text, no hands, no garments, no props.`;
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
        const timeout = setTimeout(() => controller.abort(), 60000);

        const aiResponse = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-pro-image-preview",
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

        const contentType = "image/jpeg";

        // Upload primary image
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

        // Upload same image as thumb
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

        // Update thumbnail_url on product
        await supabase
          .from("products")
          .update({ thumbnail_url: thumbUrl })
          .eq("id", pid);

        // Insert/update product_images
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

      // Delay between products
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
