
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsOptionsResponse } from "../_shared/cors.ts";
import { falSubmit } from "../_shared/fal.ts"; // Using Queue submit
import { siliconFlowSubmitVideo } from "../_shared/siliconflow.ts";
import { TOOLS, MODELS, VideoToolId } from "../_shared/prompts/catalogue.ts";
import { PromptComponents, buildVideoPrompt } from "../_shared/prompts/templates.ts";

// Kling uses specific parameters
// API: fal-ai/kling-video/v1/standard/text-to-video (or image-to-video)
// Input: prompt, aspect_ratio (16:9, 9:16), duration (5, 10)

type GenerateVideoRequest = {
    tool: VideoToolId;
    components?: PromptComponents;
    prompt?: string;

    // Inputs
    imageUrl?: string; // Image to Video source
    imageBase64?: string;

    // Config
    duration?: number; // 5 or 10
    aspectRatio?: string; // "16:9" 
    width?: number;
    height?: number;

    userId?: string;
    useFallback?: boolean;
};

// Normalize Image
function normalizeImageInput(b64orUrl: string): string {
    if (b64orUrl.startsWith("http")) return b64orUrl;
    if (b64orUrl.startsWith("data:")) return b64orUrl;
    return `data:image/png;base64,${b64orUrl}`;
}

serve(async (request: Request) => {
    if (request.method === "OPTIONS") return corsOptionsResponse();

    try {
        const body = await request.json() as GenerateVideoRequest;

        // Determine Tool & Model
        const toolDef = TOOLS[body.tool] || TOOLS['text-to-video'];
        let model = toolDef.model; // e.g. "fal-ai/kling-video/v1/standard/text-to-video"

        // Kling: Text vs Image endpoints are sometimes separate or unified.
        // Fal Kling V1 Standard has separate endpoints usually:
        // .../text-to-video
        // .../image-to-video
        // We should check if input image is present to switch model endpoint if needed, 
        // OR if we defined them correctly in catalogue. 
        // Catalogue has 'image-to-video' mapped to the specific endpoint. Good.

        // If user sends 'text-to-video' tool but provides an image, we should prob switch or error.
        // Let's rely on the requested tool ID.

        // --- FALLBACK LOGIC ---
        if (body.useFallback) {
            console.log(`[Video Fallback] Switching from primary for tool: ${body.tool}`);
            if (body.tool === 'text-to-video' || body.tool === 'image-to-video') {
                model = "fal-ai/mochi-1"; // OS High-fidelity model
            } else if (body.tool === 'lip-sync') {
                model = "fal-ai/wav2lip-gan"; // Alternative lip sync
            }
        }

        // Build Prompt
        let finalPrompt = body.prompt;
        if (body.components) finalPrompt = buildVideoPrompt(body.components);
        if (!finalPrompt && body.tool !== 'image-to-video') {
            // For Specialized tools, if prompt is missing, we might use a default or empty
            if (body.tool !== 'lip-sync' && body.tool !== 'talking-avatar') {
                throw new Error("Missing Prompt");
            }
        }

        // Prepare Payload
        const payload: any = {
            aspect_ratio: body.aspectRatio || "16:9",
            duration: body.duration ? String(body.duration) : "5"
        };
        if (body.width && body.height) {
            // Kling might prefer width/height or just aspect_ratio
            // For now we keep aspect_ratio but allow width/height if model supports it
            payload.width = body.width;
            payload.height = body.height;
        }
        if (finalPrompt) payload.prompt = finalPrompt;

        // Specialized Model Handling
        if (body.tool === 'lip-sync') {
            const imgOrVid = body.imageBase64 || body.imageUrl;
            if (imgOrVid) payload.video_url = normalizeImageInput(imgOrVid);
            if (body.components?.subject) payload.audio_text = body.components.subject;
        } else if (body.tool === 'talking-avatar') {
            const img = body.imageBase64 || body.imageUrl;
            if (img) payload.ref_image_url = normalizeImageInput(img);
            if (body.components?.subject) payload.script = body.components.subject;
        } else {
            // Standard Text/Image to Video (Kling)
            const img = body.imageBase64 || body.imageUrl;
            if (img) {
                payload.image_url = normalizeImageInput(img);
                if (!model.includes("image-to-video")) {
                    model = "fal-ai/kling-video/v1/standard/image-to-video";
                }
            }
        }

        console.log(`[Fal Video] Model: ${model}, Prompt: ${finalPrompt}`);

        // Submit to Provider (Fal or SiliconFlow)
        let requestId: string;
        if (body.useFallback) {
            console.log(`[SiliconFlow Video] Fallback for ${body.tool}`);
            // Map to SiliconFlow models
            const sfModel = body.tool === 'image-to-video' ? "tencent/HunyuanVideo" : "genmo/mochi-1-preview";
            requestId = await siliconFlowSubmitVideo(sfModel, payload);
        } else {
            requestId = await falSubmit(model, payload);
        }

        // Return Request ID (Operation Name)
        return new Response(JSON.stringify({ operationName: requestId }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("[generate-video] error:", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
