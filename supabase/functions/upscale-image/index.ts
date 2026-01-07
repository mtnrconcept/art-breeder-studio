import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpscaleRequest {
  imageUrl: string;
  scale?: number;
  model?: 'creative' | 'clarity' | 'real-esrgan';
  enhanceFace?: boolean;
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

    const params: UpscaleRequest = await req.json();
    const { imageUrl, scale = 2, model = 'creative', enhanceFace = false } = params;

    if (!imageUrl) {
      throw new Error('imageUrl is required');
    }

    console.log(`Upscaling image: model=${model}, scale=${scale}`);

    let endpoint: string;
    let body: Record<string, unknown>;

    switch (model) {
      case 'clarity':
        endpoint = 'https://fal.run/fal-ai/clarity-upscaler';
        body = {
          image_url: imageUrl,
          scale,
        };
        break;
      case 'real-esrgan':
        endpoint = 'https://fal.run/fal-ai/real-esrgan';
        body = {
          image_url: imageUrl,
          scale,
          face_enhance: enhanceFace,
        };
        break;
      case 'creative':
      default:
        endpoint = 'https://fal.run/fal-ai/creative-upscaler';
        body = {
          image_url: imageUrl,
          scale,
          creativity: 0.35,
          detail: 1,
          shape_preservation: 0.25,
        };
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
      console.error('Upscale API error:', response.status, errorText);
      throw new Error(`Upscale API error: ${response.status}`);
    }

    const result = await response.json();
    const resultImageUrl = result.image?.url || result.image_url || result.output?.url;

    if (!resultImageUrl) {
      console.error('Result structure:', JSON.stringify(result));
      throw new Error('No image URL in result');
    }

    return new Response(
      JSON.stringify({ imageUrl: resultImageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error upscaling image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});