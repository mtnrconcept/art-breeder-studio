
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsOptionsResponse } from "../_shared/cors.ts";
import { falPostJson } from "../_shared/fal.ts";
import { huggingFacePost } from "../_shared/huggingface.ts";
import { uploadBase64ToBucket } from "../_shared/storage.ts";
import { TOOLS, ToolId, AudioToolId } from "../_shared/prompts/catalogue.ts";

interface GenerateAudioRequest {
    tool: AudioToolId;
    prompt?: string;
    duration?: number;
    userId?: string;
    useFallback?: boolean;
}

serve(async (request) => {
    if (request.method === "OPTIONS") return corsOptionsResponse();

    try {
        const body = await request.json() as GenerateAudioRequest;
        const toolDef = TOOLS[body.tool] || TOOLS['sound-effects'];
        const model = toolDef.model;

        const payload = {
            prompt: body.prompt,
            seconds_total: body.duration || 10
        };

        console.log(`[Fal Audio] Tool: ${body.tool}, Model: ${model}, Prompt: ${body.prompt}`);

        let audioUrl: string;

        if (body.useFallback) {
            console.log(`[HF Audio] Fallback for ${body.tool}`);
            const HF_TOKEN = Deno.env.get("HUGGINGFACE_TOKEN");
            if (!HF_TOKEN) throw new Error("HUGGINGFACE_TOKEN_MISSING");

            const blob: any = await huggingFacePost("facebook/musicgen-small", { inputs: body.prompt });
            // For HF we get a blob, we need to upload it directly or convert to b64
            const arrayBuffer = await blob.arrayBuffer();
            const b64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            audioUrl = `data:audio/mpeg;base64,${b64}`;
        } else {
            const result: any = await falPostJson(model, payload);
            audioUrl = result.audio?.url || result.url;
        }

        if (!audioUrl) throw new Error("No audio generated");

        let finalUrl = audioUrl;
        if (body.userId) {
            try {
                const res = await fetch(audioUrl);
                const buf = await res.arrayBuffer();
                const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));

                finalUrl = await uploadBase64ToBucket({
                    bucket: "generations",
                    path: `${body.userId}/audio/${Date.now()}.mp3`,
                    base64DataUrlOrRaw: b64,
                    contentType: "audio/mpeg"
                });
            } catch (e) { console.error("Audio upload fail", e); }
        }

        return new Response(JSON.stringify({ audioUrl: finalUrl }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("[generate-audio] error:", err);
        return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Audio error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
