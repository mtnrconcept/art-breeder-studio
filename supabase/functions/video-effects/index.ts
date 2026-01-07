import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoEffectsRequest {
  videoUrl?: string;
  imageUrl?: string;
  effect: 'style-transfer' | 'slow-motion' | 'loop' | 'reverse' | 'depth' | 'camera-motion';
  prompt?: string;
  cameraMotion?: {
    horizontal?: number;
    vertical?: number;
    zoom?: number;
    tilt?: number;
    pan?: number;
    roll?: number;
  };
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

    const params: VideoEffectsRequest = await req.json();
    const { videoUrl, imageUrl, effect, prompt, cameraMotion } = params;

    if (!videoUrl && !imageUrl) {
      throw new Error('Either videoUrl or imageUrl is required');
    }

    console.log(`Applying video effect: effect=${effect}`);

    let endpoint: string;
    let body: Record<string, unknown>;

    switch (effect) {
      case 'camera-motion':
        if (!imageUrl) {
          throw new Error('imageUrl is required for camera motion');
        }
        // Use Kling with camera control
        endpoint = 'https://queue.fal.run/fal-ai/kling-video/v1.6/standard/image-to-video';
        body = {
          image_url: imageUrl,
          prompt: prompt || 'smooth camera movement',
          duration: '5',
          camera_control: {
            type: 'custom',
            horizontal: cameraMotion?.horizontal || 0,
            vertical: cameraMotion?.vertical || 0,
            zoom: cameraMotion?.zoom || 0,
            tilt: cameraMotion?.tilt || 0,
            pan: cameraMotion?.pan || 0,
            roll: cameraMotion?.roll || 0,
          },
        };
        break;

      case 'depth':
        if (!imageUrl) {
          throw new Error('imageUrl is required for depth effect');
        }
        // Get depth map first then animate
        endpoint = 'https://fal.run/fal-ai/depth-anything-v2';
        body = {
          image_url: imageUrl,
        };
        break;

      case 'style-transfer':
        if (!imageUrl) {
          throw new Error('imageUrl is required for style transfer');
        }
        // Animate image with style
        endpoint = 'https://queue.fal.run/fal-ai/kling-video/v1.6/standard/image-to-video';
        body = {
          image_url: imageUrl,
          prompt: prompt || 'cinematic style, artistic, smooth animation',
          duration: '5',
        };
        break;

      case 'slow-motion':
      case 'loop':
      case 'reverse':
      default:
        // For video manipulation effects, we animate with specific prompts
        if (imageUrl) {
          endpoint = 'https://queue.fal.run/fal-ai/kling-video/v1.6/standard/image-to-video';
          body = {
            image_url: imageUrl,
            prompt: effect === 'slow-motion' 
              ? 'slow, deliberate motion, time lapse effect'
              : effect === 'loop'
              ? 'seamless looping motion, perfect loop'
              : 'dramatic reverse motion effect',
            duration: '5',
          };
        } else {
          throw new Error('Video manipulation requires imageUrl as input');
        }
        break;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Video effects API error:', response.status, errorText);
      throw new Error(`Video effects API error: ${response.status}`);
    }

    const responseData = await response.json();

    // Handle depth map response
    if (effect === 'depth') {
      const depthImageUrl = responseData.image?.url || responseData.depth?.url;
      return new Response(
        JSON.stringify({ imageUrl: depthImageUrl, type: 'depth-map' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle queue-based responses
    if (responseData.request_id) {
      const requestId = responseData.request_id;
      console.log(`Video effect job submitted, request_id: ${requestId}`);

      let result = null;
      for (let i = 0; i < 120; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const resultResponse = await fetch(`${endpoint}/requests/${requestId}`, {
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
        throw new Error('Video effect generation timed out');
      }

      const videoResultUrl = result.video?.url || result.video_url;

      return new Response(
        JSON.stringify({ videoUrl: videoResultUrl, requestId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ videoUrl: responseData.video?.url || responseData.video_url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error applying video effect:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});