import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoGenerateRequest {
    prompt: string;
    negativePrompt?: string;
    duration?: number; // 5 or 10 seconds
    aspectRatio?: string;
    imageUrl?: string; // For image-to-video
    cameraMotion?: string;
    motionAmount?: number;
    userId?: string;
}

// Try API call with fallback
async function callGeminiAPI(endpoint: string, body: object): Promise<Response> {
    const apiKey1 = Deno.env.get('GEMINI_API_KEY');
    const apiKey2 = Deno.env.get('GEMINI_API_KEY_2');

    if (!apiKey1 && !apiKey2) {
        throw new Error('No Gemini API keys configured');
    }

    const keys = [apiKey1, apiKey2].filter(Boolean) as string[];

    const endpoints = [
        endpoint,
        endpoint.replace('aiplatform.googleapis.com/v1/publishers/google', 'generativelanguage.googleapis.com/v1beta')
    ];

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        for (const baseEndpoint of endpoints) {
            const url = `${baseEndpoint}?key=${key}`;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'x-goog-api-key': key
            };

            try {
                console.log(`[callGeminiAPI] Attempt ${i + 1} on ${baseEndpoint.includes('aiplatform') ? 'Vertex' : 'AI Studio'}`);
                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                });

                if (response.ok) {
                    return response;
                }

                const errorData = await response.text();
                console.warn(`[callGeminiAPI] Failed (${response.status}) on ${baseEndpoint.split('/')[2]}:`, errorData);

                if (response.status === 429) break;
                if (response.status === 401 || response.status === 403 || response.status === 404) continue;

                return new Response(errorData, { status: response.status });
            } catch (error) {
                console.error(`Network error on ${baseEndpoint}:`, error);
            }
        }
    }

    throw new Error('All API keys failed');
}

async function pollForResult(operationName: string, apiKey: string, maxAttempts: number = 60): Promise<any> {
    const apiKey1 = Deno.env.get('GEMINI_API_KEY');
    const apiKey2 = Deno.env.get('GEMINI_API_KEY_2');
    const keys = [apiKey1, apiKey2].filter(Boolean) as string[];

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between polls

        for (const key of keys) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${key}`);

                if (!response.ok) continue;

                const data = await response.json();

                if (data.done) {
                    return data;
                }

                if (data.error) {
                    throw new Error(data.error.message);
                }

                break; // Operation not done, continue polling
            } catch (error) {
                console.error(`Poll attempt ${attempt + 1} with key failed:`, error);
            }
        }
    }

    throw new Error('Video generation timed out');
}

async function uploadVideoToStorage(
    supabase: ReturnType<typeof createClient>,
    videoData: string,
    userId: string
): Promise<string> {
    const timestamp = Date.now();
    const fileName = `${userId}/videos/${timestamp}.mp4`;

    const base64Data = videoData.replace(/^data:video\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const { error } = await supabase.storage
        .from('generations')
        .upload(fileName, binaryData, {
            contentType: 'video/mp4',
            upsert: false
        });

    if (error) {
        console.error('Storage upload error:', error);
        throw new Error('Failed to upload video to storage');
    }

    const { data: urlData } = supabase.storage
        .from('generations')
        .getPublicUrl(fileName);

    return urlData.publicUrl;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const params: VideoGenerateRequest = await req.json();

        console.log(`[generate-video] Prompt: ${params.prompt.substring(0, 100)}...`);

        // Build prompt with camera motion
        let enhancedPrompt = params.prompt;
        if (params.cameraMotion && params.cameraMotion !== 'static') {
            const cameraDescriptions: Record<string, string> = {
                'pan-left': 'Camera smoothly pans from right to left',
                'pan-right': 'Camera smoothly pans from left to right',
                'tilt-up': 'Camera tilts upward',
                'tilt-down': 'Camera tilts downward',
                'zoom-in': 'Camera slowly zooms in',
                'zoom-out': 'Camera slowly zooms out',
                'dolly': 'Camera moves forward through the scene',
                'orbit': 'Camera orbits around the subject',
                'crane': 'Camera performs a crane shot moving vertically',
                'fpv': 'First-person view camera movement',
                'handheld': 'Slight handheld camera movement for realism',
            };
            enhancedPrompt = `${cameraDescriptions[params.cameraMotion] || ''}. ${params.prompt}`;
        }

        // Build the request for Veo 3
        const requestBody: any = {
            instances: [{ prompt: enhancedPrompt }],
            parameters: {
                aspectRatio: params.aspectRatio || "16:9",
                durationSeconds: params.duration || 5,
                personGeneration: "allow_adult",
            }
        };

        // Add negative prompt if provided
        if (params.negativePrompt) {
            requestBody.instances[0].negativePrompt = params.negativePrompt;
        }

        // Add reference image for image-to-video
        if (params.imageUrl) {
            const imageData = params.imageUrl.split(',')[1] || params.imageUrl;
            requestBody.instances[0].image = { bytesBase64Encoded: imageData };
        }

        // Start video generation (async operation)
        const response = await callGeminiAPI(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateVideo',
            requestBody
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[generate-video] API error ${response.status} from Veo:`, errorText);

            let errorMessage = `Veo API error: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error?.message || errorMessage;
            } catch (p) {
                // Not JSON
            }

            return new Response(JSON.stringify({ error: errorMessage }), {
                status: response.status === 429 ? 429 : 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const operationData = await response.json();
        const operationName = operationData.name;

        if (!operationName) {
            console.error('[generate-video] No operation name in response:', JSON.stringify(operationData));
            throw new Error('Failed to start video generation');
        }

        console.log(`[generate-video] Operation started: ${operationName}`);

        return new Response(JSON.stringify({
            operationName,
            status: 'processing'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('[generate-video] Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
