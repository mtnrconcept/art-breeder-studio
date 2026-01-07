import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoRequest {
  type: 'text-to-video' | 'image-to-video';
  prompt: string;
  imageUrl?: string;
  duration?: number; // 5 or 10 seconds
  aspectRatio?: '16:9' | '9:16' | '1:1';
  model?: 'kling' | 'minimax' | 'veo3';
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

    const params: VideoRequest = await req.json();
    const { type, prompt, imageUrl, duration = 5, aspectRatio = '16:9', model = 'kling' } = params;

    console.log(`Generating video: type=${type}, model=${model}, prompt=${prompt}`);

    let endpoint: string;
    let body: Record<string, unknown>;

    if (type === 'text-to-video') {
      // Text-to-Video using different models
      switch (model) {
        case 'minimax':
          endpoint = 'https://queue.fal.run/fal-ai/minimax-video';
          body = {
            prompt,
            prompt_optimizer: true,
          };
          break;
        case 'veo3':
          endpoint = 'https://queue.fal.run/fal-ai/veo3';
          body = {
            prompt,
            aspect_ratio: aspectRatio,
            duration: `${duration}s`,
          };
          break;
        case 'kling':
        default:
          endpoint = 'https://queue.fal.run/fal-ai/kling-video/v1.6/standard/text-to-video';
          body = {
            prompt,
            duration: duration === 5 ? '5' : '10',
            aspect_ratio: aspectRatio,
          };
          break;
      }
    } else if (type === 'image-to-video') {
      if (!imageUrl) {
        throw new Error('imageUrl is required for image-to-video');
      }

      switch (model) {
        case 'minimax':
          endpoint = 'https://queue.fal.run/fal-ai/minimax-video/image-to-video';
          body = {
            prompt,
            image_url: imageUrl,
            prompt_optimizer: true,
          };
          break;
        case 'veo3':
          endpoint = 'https://queue.fal.run/fal-ai/veo3/image-to-video';
          body = {
            prompt,
            image_url: imageUrl,
            aspect_ratio: aspectRatio,
          };
          break;
        case 'kling':
        default:
          endpoint = 'https://queue.fal.run/fal-ai/kling-video/v1.6/standard/image-to-video';
          body = {
            prompt,
            image_url: imageUrl,
            duration: duration === 5 ? '5' : '10',
            aspect_ratio: aspectRatio,
          };
          break;
      }
    } else {
      throw new Error('Invalid video generation type');
    }

    // Submit the job to fal.ai queue
    const submitResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error('FAL API error:', submitResponse.status, errorText);
      throw new Error(`FAL API error: ${submitResponse.status}`);
    }

    const submitData = await submitResponse.json();
    const requestId = submitData.request_id;

    console.log(`Job submitted, request_id: ${requestId}`);

    // Poll for completion
    const statusEndpoint = `${endpoint.replace('/queue.fal.run/', '/queue.fal.run/')}/requests/${requestId}/status`;
    let result = null;
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(statusEndpoint, {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`Status check ${attempts + 1}: ${statusData.status}`);

      if (statusData.status === 'COMPLETED') {
        // Fetch the result
        const resultEndpoint = `${endpoint.replace('/queue.fal.run/', '/queue.fal.run/')}/requests/${requestId}`;
        const resultResponse = await fetch(resultEndpoint, {
          headers: {
            'Authorization': `Key ${FAL_API_KEY}`,
          },
        });

        if (resultResponse.ok) {
          result = await resultResponse.json();
        }
        break;
      } else if (statusData.status === 'FAILED') {
        throw new Error('Video generation failed');
      }

      attempts++;
    }

    if (!result) {
      throw new Error('Video generation timed out');
    }

    // Extract video URL from result
    const videoUrl = result.video?.url || result.video_url || result.output?.video_url;

    if (!videoUrl) {
      console.error('Result structure:', JSON.stringify(result));
      throw new Error('No video URL in result');
    }

    return new Response(
      JSON.stringify({ videoUrl, requestId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating video:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});