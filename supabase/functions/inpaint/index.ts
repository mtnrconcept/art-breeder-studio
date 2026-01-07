import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InpaintRequest {
  imageUrl: string;
  maskUrl: string;
  prompt: string;
  negativePrompt?: string;
  strength?: number;
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

    const params: InpaintRequest = await req.json();
    const { imageUrl, maskUrl, prompt, negativePrompt, strength = 0.85 } = params;

    if (!imageUrl || !maskUrl || !prompt) {
      throw new Error('imageUrl, maskUrl, and prompt are required');
    }

    console.log(`Inpainting image: prompt=${prompt}`);

    // Use FLUX Fill for inpainting
    const response = await fetch('https://fal.run/fal-ai/flux-pro/v1/fill', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        mask_url: maskUrl,
        prompt,
        safety_tolerance: 2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Inpaint API error:', response.status, errorText);
      
      // Fallback to standard flux inpainting
      const fallbackResponse = await fetch('https://fal.run/fal-ai/flux/dev/inpainting', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
          mask_url: maskUrl,
          prompt,
          strength,
        }),
      });

      if (!fallbackResponse.ok) {
        throw new Error(`Inpaint API error: ${response.status}`);
      }

      const fallbackResult = await fallbackResponse.json();
      const resultImageUrl = fallbackResult.images?.[0]?.url || fallbackResult.image?.url;

      return new Response(
        JSON.stringify({ imageUrl: resultImageUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    const resultImageUrl = result.images?.[0]?.url || result.image?.url;

    if (!resultImageUrl) {
      console.error('Result structure:', JSON.stringify(result));
      throw new Error('No image URL in result');
    }

    return new Response(
      JSON.stringify({ imageUrl: resultImageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error inpainting image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});