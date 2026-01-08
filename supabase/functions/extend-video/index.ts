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

// Build hyper-precise prompt for seamless video extension
function buildExtendPrompt(userPrompt: string): string {
  return `Continue this video seamlessly with perfect visual consistency:

CONTINUATION SCENE: ${userPrompt}

CONSISTENCY REQUIREMENTS:
- Match EXACT visual style, color grading, and lighting
- Preserve all character appearances and clothing precisely
- Maintain environment details and atmospheric conditions
- Continue camera style and movement patterns
- Keep same level of detail and texture quality
- Preserve aspect ratio and framing conventions

TRANSITION QUALITY:
- Invisible join between original and extended footage
- No sudden lighting or exposure changes
- Smooth motion continuation across the edit point
- Natural flow of any ongoing actions or movements
- Consistent audio ambiance and sound design

TEMPORAL COHERENCE:
- Maintain consistent frame rate and motion blur
- Continue any established motion trajectories
- Preserve the rhythm and pacing of the original
- Seamless temporal flow without jump cuts

OUTPUT: Extended footage indistinguishable from the original video.`;
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

    const enhancedPrompt = buildExtendPrompt(prompt);
    console.log(`Extending video: duration=${duration}s`);

    // Use Kling Pro for best quality video extension
    const response = await fetch('https://queue.fal.run/fal-ai/kling-video/v1.6/pro/video-extend', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_url: videoUrl,
        prompt: enhancedPrompt,
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

    // Poll for completion with extended timeout for quality
    let result = null;
    for (let i = 0; i < 180; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const resultResponse = await fetch(`https://queue.fal.run/fal-ai/kling-video/v1.6/pro/video-extend/requests/${requestId}`, {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
        },
      });

      if (resultResponse.ok) {
        const data = await resultResponse.json();
        if (data.video?.url || data.video_url) {
          result = data;
          console.log(`Video extension completed at attempt ${i + 1}`);
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
