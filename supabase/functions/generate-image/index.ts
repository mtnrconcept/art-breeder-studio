
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsOptionsResponse } from "../_shared/cors.ts";
import { falPostJson } from "../_shared/fal.ts";
import { togetherPostJson } from "../_shared/together.ts";
import { siliconFlowPostJson } from "../_shared/siliconflow.ts";
import { huggingFacePost } from "../_shared/huggingface.ts";
import { uploadBase64PngToBucket } from "../_shared/storage.ts";
import { TOOLS, ToolId } from "../_shared/prompts/catalogue.ts"; // Only imports needed
import {
  PromptComponents,
  buildTextToImagePrompt,
  buildStyleTransferPrompt
} from "../_shared/prompts/templates.ts";

// Constants moved out to avoid recreation
const AR_MAP: Record<string, string> = {
  "16:9": "landscape_16_9",
  "9:16": "portrait_16_9",
  "1:1": "square_hd",
  "4:3": "landscape_4_3",
  "3:4": "portrait_4_3",
  "2:3": "portrait_4_3", // Fallback or direct if supported
  "3:2": "landscape_4_3"
};

function normalizeImageInput(b64orUrl: string): string {
  if (!b64orUrl) return "";
  if (b64orUrl.startsWith("http")) return b64orUrl;
  if (b64orUrl.startsWith("data:")) return b64orUrl;
  return `data:image/png;base64,${b64orUrl}`;
}

serve(async (request: Request) => {
  // 1. Handle CORS
  if (request.method === "OPTIONS") return corsOptionsResponse();

  try {
    // 2. Parse Body safely
    const body = await request.json();

    // 3. Resolve Tool & Model
    const toolId = body.tool as ToolId || 'text-to-image';
    const toolDef = TOOLS[toolId] || TOOLS['text-to-image'];
    let model = toolDef.model;

    // --- FALLBACK LOGIC ---
    if (body.useFallback) {
      console.log(`[Fallback] Switching from primary model for tool: ${toolId}`);
      if (toolId === 'text-to-image' || toolId === 'composer') {
        model = "fal-ai/flux/schnell"; // Ultra-reliable and fast
      } else if (toolId === 'virtual-try-on') {
        model = "fal-ai/catvton"; // Alternative to IDM-VTON
      } else if (toolId === 'upscale') {
        model = "fal-ai/aura-sr"; // Switch to Aura SR if others fail
      } else if (toolId === 'style-transfer') {
        model = "fal-ai/flux/dev"; // Slightly more robust than 1.1 Ultra during peak
      }
      // Add other OS counterparts here
    }

    // 4. Build Prompt
    let finalPrompt = body.prompt || "";

    if (body.components) {
      // Use templates
      if (toolId === 'text-to-image') finalPrompt = buildTextToImagePrompt(body.components);
      else if (toolId === 'style-transfer') finalPrompt = buildStyleTransferPrompt(body.components);
      else if (toolId === 'relight') finalPrompt = `Relight scene: ${body.components.lighting || 'studio'}`;
      else if (body.components.subject) finalPrompt = body.components.subject;
    }

    // Composer / Splicer Fallback logic:
    // Since we don't have multi-image fusion in Fal yet, we rely on the Prompt passed (e.g. "Splice these images...")
    // and optionally the FIRST image as layout reference if mapped to baseImage.

    // 5. Prepare Fal Payload
    const payload: any = {
      prompt: finalPrompt
    };

    // Aspect Ratio & Dimensions
    if (body.width && body.height) {
      payload.width = body.width;
      payload.height = body.height;
    } else if (body.aspectRatio && AR_MAP[body.aspectRatio]) {
      payload.image_size = AR_MAP[body.aspectRatio];
    } else {
      payload.image_size = "landscape_16_9";
    }

    // Image Input Handling
    const baseImg = body.baseImageBase64 || body.baseImage;
    const maskImg = body.maskImageBase64 || body.maskImage;
    const styleImg = body.styleImage || body.styleImageUrl;
    const charImg = body.charImage;

    if (toolId === 'virtual-try-on' && baseImg && styleImg) {
      payload.human_image_url = normalizeImageInput(baseImg);
      payload.garment_image_url = normalizeImageInput(styleImg);
      // idm-vton doesn't use prompt usually, but we keep it
    } else if (toolId === 'upscale' && baseImg) {
      payload.image_url = normalizeImageInput(baseImg);
    } else if (toolId === 'inpaint' && baseImg && maskImg) {
      payload.image_url = normalizeImageInput(baseImg);
      payload.mask_url = normalizeImageInput(maskImg);
    } else if (baseImg) {
      const imgUrl = normalizeImageInput(baseImg);
      payload.image_url = imgUrl;
      // Multi-image for Composer/Splicer
      if (styleImg || charImg) {
        payload.images = [
          { url: imgUrl, label: "base" },
          { url: normalizeImageInput(styleImg || ""), label: "style" },
          { url: normalizeImageInput(charImg || ""), label: "character" }
        ].filter(i => i.url);
      } else {
        payload.images = [{ url: imgUrl }];
      }
    }

    console.log(`[Fal] Tool: ${toolId} -> ${model}`);

    // 6. Call Provider (Fal, Together, HuggingFace, or SiliconFlow)
    let result: any;
    const TOGETHER_KEY = Deno.env.get("TOGETHER_API_KEY");
    const HF_TOKEN = Deno.env.get("HUGGINGFACE_TOKEN");
    const SILICON_KEY = Deno.env.get("SILICONFLOW_API_KEY");

    // Helper for large image base64
    const toBase64 = (buf: ArrayBuffer) => {
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    if (body.useFallback) {
      // Multi-Provider Fallback Logic: Try HF/SF first as user confirmed they are set
      try {
        if (HF_TOKEN) {
          console.log(`[HF] Fallback for ${toolId}`);
          const blob: any = await huggingFacePost("black-forest-labs/FLUX.1-schnell", { inputs: payload.prompt });
          const arrayBuffer = await blob.arrayBuffer();
          const b64 = toBase64(arrayBuffer);
          result = { images: [{ url: `data:image/png;base64,${b64}` }] };
        } else if (SILICON_KEY) {
          console.log(`[SiliconFlow] Fallback for ${toolId}`);

          // SiliconFlow expects "WIDTHxHEIGHT"
          let sfSize = "1024x768"; // Default
          if (payload.width && payload.height) {
            sfSize = `${payload.width}x${payload.height}`;
          } else if (body.aspectRatio) {
            if (body.aspectRatio === "1:1") sfSize = "1024x1024";
            else if (body.aspectRatio === "16:9") sfSize = "1024x576";
            else if (body.aspectRatio === "9:16") sfSize = "576x1024";
            else if (body.aspectRatio === "4:3") sfSize = "1024x768";
            else if (body.aspectRatio === "3:4") sfSize = "768x1024";
          }

          result = await siliconFlowPostJson("images/generations", "black-forest-labs/FLUX.1-schnell", {
            prompt: payload.prompt,
            image_size: sfSize,
            batch_size: 1,
            num_inference_steps: 4
          });
        } else if (TOGETHER_KEY) {
          console.log(`[Together AI] Fallback for ${toolId}`);
          result = await togetherPostJson("black-forest-labs/FLUX.1-schnell", payload);
        } else {
          throw new Error("No fallback API keys available (HF, SiliconFlow, or Together)");
        }
      } catch (err: any) {
        console.error("Free Fallback failed:", err.message);
        throw err;
      }
    } else {
      result = await falPostJson(model, payload);
    }

    // 7. Extract Image
    const resultUrl = result.images?.[0]?.url;
    if (!resultUrl) {
      console.error("Fal Response Error:", JSON.stringify(result));
      throw new Error(`Fal generation failed: ${JSON.stringify(result)}`);
    }

    // 8. Upload to Storage (Optional persistence)
    let finalUrl = resultUrl;
    if (body.userId) {
      try {
        const imgRes = await fetch(resultUrl);
        const buf = await imgRes.arrayBuffer();
        const b64 = toBase64(buf);

        finalUrl = await uploadBase64PngToBucket({
          bucket: "generations",
          path: `${body.userId}/images/${Date.now()}.png`,
          base64DataUrlOrRaw: b64
        });
      } catch (e: any) {
        console.warn("Storage upload failed:", e);
      }
    }

    return new Response(JSON.stringify({
      imageUrl: finalUrl,
      debugPrompt: finalPrompt,
      debugPayload: payload
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    const finalErrorMessage = err instanceof Error ? err.message : String(err);
    console.error("Critical Gen Error:", finalErrorMessage);
    return new Response(JSON.stringify({
      error: finalErrorMessage,
      stack: err instanceof Error ? err.stack : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
