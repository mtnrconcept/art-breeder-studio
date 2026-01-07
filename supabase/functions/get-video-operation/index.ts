import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
        const { operationName, userId } = await req.json();

        if (!operationName) {
            throw new Error('Operation name is required');
        }

        const apiKey1 = Deno.env.get('GEMINI_API_KEY');
        const apiKey2 = Deno.env.get('GEMINI_API_KEY_2');
        const keys = [apiKey1, apiKey2].filter(Boolean) as string[];

        let resultData = null;
        let lastError = null;

        for (const key of keys) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${key}`);
                if (response.ok) {
                    resultData = await response.json();
                    break;
                }
            } catch (e) {
                lastError = e;
            }
        }

        if (!resultData && lastError) {
            throw lastError;
        }

        if (!resultData) {
            throw new Error('Could not fetch operation status');
        }

        // If not done yet
        if (!resultData.done) {
            return new Response(JSON.stringify({ done: false }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // If error in operation
        if (resultData.error) {
            return new Response(JSON.stringify({ done: true, error: resultData.error.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // If successful
        const generatedVideo = resultData.response?.videos?.[0]?.bytesBase64Encoded;
        if (!generatedVideo) {
            return new Response(JSON.stringify({ done: true, error: 'No video found in result' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        let videoUrl = `data:video/mp4;base64,${generatedVideo}`;

        if (userId) {
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            try {
                videoUrl = await uploadVideoToStorage(supabase, videoUrl, userId);
            } catch (uploadError) {
                console.error('[get-video-operation] Storage upload failed:', uploadError);
            }
        }

        return new Response(JSON.stringify({
            done: true,
            videoUrl
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('[get-video-operation] Error:', error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
