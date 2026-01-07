import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RemoveBackgroundRequest {
  imageUrl: string;
  model?: 'birefnet' | 'rembg';
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

    const params: RemoveBackgroundRequest = await req.json();
    const { imageUrl, model = 'birefnet' } = params;

    if (!imageUrl) {
      throw new Error('imageUrl is required');
    }

    console.log(`Removing background: model=${model}`);

    const endpoint = model === 'birefnet' 
      ? 'https://fal.run/fal-ai/birefnet'
      : 'https://fal.run/fal-ai/imageutils/rembg';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Remove background API error:', response.status, errorText);
      throw new Error(`Remove background API error: ${response.status}`);
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
    console.error('Error removing background:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});