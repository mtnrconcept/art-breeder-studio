
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsOptionsResponse } from "../_shared/cors.ts";
import { falStatus, falResult } from "../_shared/fal.ts"; // Shared Fal client
import { siliconFlowGetVideoStatus } from "../_shared/siliconflow.ts";

type GetVideoOpRequest = {
    operationName: string; // This is the Fal Request ID
    userId?: string;
};

serve(async (request) => {
    if (request.method === "OPTIONS") return corsOptionsResponse();

    try {
        const body = await request.json() as GetVideoOpRequest;
        if (!body?.operationName) throw new Error("Missing operationName");

        // Check Status (SiliconFlow vs Fal)
        // Simple heuristic: Try Fal first, but SiliconFlow IDs might be longer or if Fal fails we check SF
        let status: any;
        let isSiliconFlow = false;

        try {
            status = await falStatus(body.operationName);
        } catch (e) {
            console.log("Fal status check failed, trying SiliconFlow...");
            try {
                const sfStatus = await siliconFlowGetVideoStatus(body.operationName);
                isSiliconFlow = true;
                // Normalize SF status to our internal format
                // SF Succeed: { code: 20000, data: { status: "Succeed", results: { video: "..." } } }
                if (sfStatus.code === 20000) {
                    const sfData = sfStatus.data;
                    if (sfData.status === "Succeed") {
                        return new Response(JSON.stringify({
                            done: true,
                            videoUrl: sfData.results.video
                        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                    } else if (sfData.status === "Failed") {
                        return new Response(JSON.stringify({
                            done: true,
                            error: sfData.reason || "SiliconFlow Failed"
                        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                    } else {
                        // Pending/Processing
                        return new Response(JSON.stringify({ done: false }), {
                            headers: { ...corsHeaders, "Content-Type": "application/json" },
                        });
                    }
                }
                throw new Error("SF Status check returned unexpected format");
            } catch (sfErr) {
                console.error("Both Fal and SF status checks failed:", sfErr);
                throw e; // Re-throw original fal error if both fail
            }
        }

        // Fal.ai Logic (if Fal succeeded)
        console.log(`[Fal Status] ${body.operationName}: ${status.status}`);

        if (status.status === "COMPLETED") {
            // Fetch Result
            const result = await falResult(body.operationName);
            // Result usually: { video: { url: ... } } or { images: ... } depending on model
            // Kling: { video: { url: "..." } }

            let videoUrl = result.video?.url || result.video_url; // Handle variants

            // Note: Fal video URLs are usually temporary or CDN based.
            // We return it directly. Client can download or we can implement upload here if strictly needed.
            // Keeping it consistent with previous logic: return URL.

            return new Response(JSON.stringify({
                done: true,
                videoUrl
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        } else if (status.status === "FAILED") {
            return new Response(JSON.stringify({
                done: true,
                error: status.error || "Fal Job Failed"
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        } else {
            // Pending
            return new Response(JSON.stringify({ done: false }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

    } catch (err) {
        console.error("[get-video-operation] error:", err);
        return new Response(JSON.stringify({ done: true, error: (err as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
