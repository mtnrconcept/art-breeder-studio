import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtendVideoRequest {
  videoUrl: string;
  prompt: string;
  duration?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_API_KEY = Deno.env.get('FAL_API_KEY');
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured');
    }

    const params: ExtendVideoRequest = await req.json();
    const { videoUrl, prompt, duration = 5 } = params;

    if (!videoUrl || !prompt) {
      throw new Error('videoUrl and prompt are required');
    }

    console.log(`Extending video: prompt=${prompt}, duration=${duration}`);

    // Use Kling video extend
    const response = await fetch('https://queue.fal.run/fal-ai/kling-video/v1.6/standard/video-extend', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_url: videoUrl,
        prompt,
        duration: String(duration),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Extend video API error:', response.status, errorText);
      throw new Error(`Extend video API error: ${response.status}`);
    }

    const submitData = await response.json();
    const requestId = submitData.request_id;

    console.log(`Extend video job submitted, request_id: ${requestId}`);

    // Poll for completion
    let result = null;
    for (let i = 0; i < 120; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const resultResponse = await fetch(`https://queue.fal.run/fal-ai/kling-video/v1.6/standard/video-extend/requests/${requestId}`, {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
        },
      });

      if (resultResponse.ok) {
        const data = await resultResponse.json();
        if (data.video?.url || data.video_url) {
          result = data;
          break;
        }
      }
    }

    if (!result) {
      throw new Error('Video extension timed out');
    }

    const resultVideoUrl = result.video?.url || result.video_url;

    return new Response(
      JSON.stringify({ videoUrl: resultVideoUrl, requestId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error extending video:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});