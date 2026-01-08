
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsOptionsResponse } from "../_shared/cors.ts";
import { stripDataUrlPrefix } from "../_shared/base64.ts";
import { googlePostJson } from "../_shared/google.ts";
import { TOOLS, MODELS, VideoToolId } from "../_shared/prompts/catalogue.ts";
import { PromptComponents, buildVideoPrompt } from "../_shared/prompts/templates.ts";

type GenerateVideoRequest = {
    // Routing
    tool?: VideoToolId;
    components?: PromptComponents;
    prompt?: string;

    // Config overrides
    model?: string;
    resolution?: "720p" | "1080p";

    // Image Input
    imageBase64?: string; // Standard
    imageUrl?: string; // Legacy alias

    // User
    userId?: string;
};

type VeoPredictLongRunningResponse = {
    name: string; // operation name
};

function buildVeoBody(req: GenerateVideoRequest, actualPrompt: string) {
    const instance: any = { prompt: actualPrompt };

    // Image Handling
    const img = req.imageBase64 || req.imageUrl;
    if (img) {
        instance.image = {
            bytesBase64Encoded: stripDataUrlPrefix(img),
        };
    }

    const parameters: any = {};
    if (req.resolution) parameters.resolution = req.resolution;
    // Veo 3.1 defaults usually fine. 
    // Add aspect ratio if needed and supported?
    // req.components?.aspectRatio -> map to parameters.aspectRatio if supported

    const body: any = { instances: [instance] };
    if (Object.keys(parameters).length) body.parameters = parameters;

    return body;
}

serve(async (request) => {
    if (request.method === "OPTIONS") return corsOptionsResponse();

    try {
        const body = await request.json() as GenerateVideoRequest;

        // Build Prompt using Templates
        let finalPrompt = body.prompt;
        if (body.tool && body.components) {
            finalPrompt = buildVideoPrompt(body.components);
        }

        if (!finalPrompt) {
            return new Response(JSON.stringify({ error: "Missing prompt" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Determine Model
        const model = body.model || "models/veo-3.1-generate-preview";

        console.log(`[generate-video] Model: ${model}, Prompt: ${finalPrompt}`);

        const resp = await googlePostJson<VeoPredictLongRunningResponse>(
            `/${model}:predictLongRunning`,
            buildVeoBody(body, finalPrompt),
        );

        return new Response(JSON.stringify({ operationName: resp.name }), {
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
